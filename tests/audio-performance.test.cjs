const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {createPool}=require('../assets/word-audio.js');
const {createStore,isAudioRequest,rangeResponse}=require('../audio-worker.js');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const scope='https://example.test/wordly/';
const url=scope+'assets/0123456789abcdef01234567.mp3';
class FakeAudio{
  static instances=[];
  constructor(src){this.src=src;this.paused=true;this.readyState=4;this.listeners={};FakeAudio.instances.push(this);}
  addEventListener(type,fn){this.listeners[type]=fn;}
  load(){this.loads=(this.loads||0)+1;}
  play(){this.paused=false;this.onplaying?.();return Promise.resolve();}
  pause(){this.paused=true;}
  removeAttribute(){this.src='';}
}
function fakeCaches(){const entries=new Map();return {entries,async open(){return {async match(key){return entries.get(String(key))?.clone();},async put(key,value){entries.set(String(key),value.clone());},async keys(){return [...entries.keys()].map(x=>new Request(x));},async delete(key){return entries.delete(typeof key==='string'?key:key.url);}};}};}
test('preload is bounded, silent, and the same player is reused for repeats',()=>{
  FakeAudio.instances=[];const pool=createPool({Audio:FakeAudio,maxPlayers:6});
  pool.warm(Array.from({length:50},(_,i)=>url+'?'+i));
  assert.equal(FakeAudio.instances.length,4);
  assert.ok(FakeAudio.instances.every(a=>a.paused&&a.preload==='auto'));
  const first=pool.get(url+'?0');assert.equal(pool.get(url+'?0'),first);
  first.play();pool.warm([url+'?4',url+'?5',url+'?6',url+'?7']);
  assert.equal(pool.get(url+'?0'),first);
  assert.ok(pool.size<=6);
  const retry=pool.get(url+'?0'),loads=retry.loads;retry.error={code:2};assert.equal(pool.get(url+'?0'),retry);assert.equal(retry.loads,loads+1);
});
test('hashed audio caches once and serves a subsequent range even without network',async()=>{
  let requests=0;const caches=fakeCaches();const store=createStore({caches,scope,fetch:async()=>{requests++;return new Response('abcdefghij',{headers:{'Content-Type':'audio/mpeg'}});}});
  assert.equal(await (await store.respond(new Request(url))).text(),'abcdefghij');
  const partial=await store.respond(new Request(url,{headers:{Range:'bytes=2-5'}}));
  assert.equal(partial.status,206);assert.equal(partial.headers.get('Content-Range'),'bytes 2-5/10');assert.equal(await partial.text(),'cdef');
  assert.equal(requests,1);
  const suffix=await store.respond(new Request(url,{headers:{Range:'bytes=-3'}}));
  assert.equal(await suffix.text(),'hij');assert.equal(requests,1);
});
test('invalid ranges are 416 and only this site immutable MP3s are intercepted',async()=>{
  const result=await rangeResponse(new Response('abc'), 'bytes=8-');
  assert.equal(result.status,416);assert.equal(result.headers.get('Content-Range'),'bytes */3');
  for(const target of ['index.html','assets/speaking-coach.js','assets/custom.mp3','assets/private.pdf'])assert.equal(isAudioRequest(new Request(scope+target),scope),false);
  assert.equal(isAudioRequest(new Request('https://other.test/wordly/assets/0123456789abcdef01234567.mp3'),scope),false);
  assert.equal(isAudioRequest(new Request(url),scope),true);
  assert.equal(isAudioRequest(new Request(url,{headers:{Range:'bytes=0-1,5-6'}}),scope),false);
});
test('cache errors cannot stop audio, error responses are not cached, and cache stays bounded',async()=>{
  let requests=0;const caches=fakeCaches();const store=createStore({caches,scope,maxEntries:2,fetch:async()=>{requests++;return new Response('sound',{headers:{'Content-Type':'audio/mpeg'}});}});
  for(const suffix of ['1','2','3'])await store.respond(new Request(url+'?v='+suffix));
  assert.equal(caches.entries.size,1); // query changes do not duplicate a hashed file
  const broken=createStore({caches:{open(){throw Error('private browsing');}},scope,fetch:async()=>new Response('sound')});
  assert.equal(await (await broken.respond(new Request(url))).text(),'sound');
  const missing=createStore({caches:fakeCaches(),scope,fetch:async()=>new Response('missing',{status:404})});
  assert.equal((await missing.respond(new Request(url))).status,404);
  const other=createStore({caches,scope,maxEntries:2,fetch:async()=>new Response('sound',{headers:{'Content-Type':'audio/mpeg'}})});
  for(const hash of ['1'.repeat(24),'2'.repeat(24),'3'.repeat(24)])await other.respond(new Request(scope+'assets/'+hash+'.mp3'));
  assert.equal(caches.entries.size,2);
});
function source(name){const start=html.indexOf('function '+name+'(');assert.ok(start>=0,name);for(let end=html.indexOf('}',start);end>=0;end=html.indexOf('}',end+1)){const s=html.slice(start,end+1);try{new vm.Script('('+s+')');return s;}catch{}}throw Error(name);}
function playback(){FakeAudio.instances=[];const timers=new Map(),statuses=[],spoken=[];let tick=0;const pool=createPool({Audio:FakeAudio});const context=vm.createContext({Audio:FakeAudio,SpeechSynthesisUtterance:class{constructor(text){this.text=text;}},window:{WordlyAudio:pool,speechSynthesis:{getVoices:()=>[{name:'Local English',lang:'en-GB',localService:true}],speak(u){spoken.push(u.text);u.onstart?.();},cancel(){},resume(){}}},db:{settings:{voice:''}},AUDIO_PACK:{test:url},setTimeout(fn,delay){const id=++tick;timers.set(id,{fn,delay});return id;},clearTimeout(id){timers.delete(id);},playbackStatus(s){statuses.push(s);},toast(){},normalizeAnswer:s=>s.toLowerCase().trim()});vm.runInContext('let audioGeneration=0,audioTimer=null,audioWatchdog=null,activeMedia=null,activeUtterance=null,lastPlayback=null;'+['cancelAudio','voiceForEnglish','waitForEnglishVoice','playbackKey','audioFailure','playText'].map(source).join('\n'),context);return {run:s=>vm.runInContext(s,context),timers,statuses,spoken};}
test('actual playback repeats a buffered player without creating another request',()=>{
  const p=playback();p.run("playText('test',2,3,.8)");assert.equal(FakeAudio.instances.length,1);
  FakeAudio.instances[0].onended();const gap=[...p.timers.values()].find(t=>t.delay===3000);assert.ok(gap);gap.fn();
  assert.equal(FakeAudio.instances.length,1);assert.equal(FakeAudio.instances[0].currentTime,0);
});
test('a completed built-in playback still identifies the neural pronunciation source',()=>{
  const p=playback();p.run("playText('test')");FakeAudio.instances[0].onended();
  assert.match(p.statuses.at(-1),/播放完成.*Kokoro/);
});
test('slow audio falls back to an available offline English voice and cancellation is safe',()=>{
  const p=playback();p.run("playText('test')");const stalled=FakeAudio.instances[0];stalled.onwaiting();
  const fallback=[...p.timers.values()].find(t=>t.delay<=3000);assert.ok(fallback);fallback.fn();assert.deepEqual(p.spoken,['test']);assert.ok(stalled.paused);
  const q=playback();q.run("playText('test')");FakeAudio.instances[0].onwaiting();const old=[...q.timers.values()].find(t=>t.delay<=3000);q.run('cancelAudio()');old.fn();assert.deepEqual(q.spoken,[]);
});

test('changing pace preserves the typed answer and uses the saved setting on the next replay',()=>{
  const nodes={'#answer':{value:'not submitted'},'#dictationPlays':{},'#dictationGap':{},'#dictationPaceHint':{}},db={settings:{plays:3,interval:4}},calls=[];
  const context=vm.createContext({db,document:{querySelector:s=>nodes[s]},save(){calls.push('save');}});
  vm.runInContext(source('setDictationPace')+'\nsetDictationPace(1,0);',context);
  assert.equal(nodes['#answer'].value,'not submitted');assert.deepEqual(db.settings,{plays:1,interval:0});assert.deepEqual(calls,['save']);
});
