const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const pack=JSON.parse(html.match(/const AUDIO_PACK=(\{[^\n]+\});/)[1]);
function manifest(){return JSON.parse(fs.readFileSync(path.join(root,'assets/neural-audio-manifest.json'),'utf8'));}

test('the new British neural pack replaces the reported words and all existing 2936 clips',()=>{
  const m=manifest();
  assert.equal(m.engine,'Kokoro-82M');assert.equal(m.voice,'bf_emma');assert.equal(m.language,'en-GB');
  assert.ok(m.clips.length>=2936);assert.equal(Object.keys(pack).length,m.clips.length);
  assert.notEqual(pack.archaeological,'/assets/474838667f3fed243cbf1144.mp3');
  assert.notEqual(pack.environment,'/assets/915cbe35ddd15ecd325f68de.mp3');
  for(const key of ['archaeological','environment','the team found pottery at an archaeological site.','hello. let us practise english.'])assert.ok(pack[key],key);
  assert.match(html,/Kokoro/);assert.doesNotMatch(html,/Piper en_GB-cori-medium/);
});

test('every pronunciation points to complete new bytes with an immutable content hash',()=>{
  const m=manifest(),keys=new Set();
  for(const clip of m.clips){
    assert.equal(keys.has(clip.key),false,clip.key);keys.add(clip.key);
    assert.equal(pack[clip.key],clip.url,clip.key);
    assert.match(clip.url,/^\/assets\/[a-f0-9]{24}\.mp3$/);
    const bytes=fs.readFileSync(path.join(root,clip.url.slice(1)));
    const hash=crypto.createHash('sha256').update(bytes).digest('hex');
    assert.equal(clip.sha256,hash,clip.key);assert.ok(clip.url.endsWith(hash.slice(0,24)+'.mp3'));
    assert.ok(bytes.length>1000,clip.key);assert.ok(clip.duration>=.25&&clip.duration<=45,clip.key);
    assert.ok(clip.phonemes.trim(),clip.key);assert.doesNotMatch(clip.phonemes,/[❓�]/,clip.key);
  }
});

test('reported pronunciations have reproducible phoneme overrides in words and sentences',()=>{
  const rules=JSON.parse(fs.readFileSync(path.join(root,'scripts/pronunciation-overrides.json'),'utf8'));
  assert.equal(rules.words.environment.phonemes,'ɪnvˈIɹəmənt');
  assert.equal(rules.words.archaeological.phonemes,'ˌɑːkiəlˈɒʤɪkᵊl');
  const m=manifest();
  for(const word of ['environment','archaeological']){
    const clip=m.clips.find(c=>c.key===word);assert.equal(clip.phonemes,rules.words[word].phonemes+'.');
    assert.ok(clip.overrides.includes(word));
    for(const sentence of m.clips.filter(c=>c.key.includes(' '+word+' ')))assert.ok(sentence.overrides.includes(word),sentence.key);
  }
});

test('built-in words and examples stay covered without modifying their IDs or contents',()=>{
  const words=JSON.parse(html.match(/const WANG807=(\[[^\n]+\]);/)[1]);
  assert.equal(words.length,1854);
  const normalize=s=>s.trim().replace(/\s+/g,' ').replace(/[’‘]/g,"'").toLowerCase();
  for(const w of words){assert.ok(pack[normalize(w.en)],w.en);if(w.example?.en)assert.ok(pack[normalize(w.example.en)],w.example.en);}
  assert.match(html,/const KEY='wordly_app_v1'/);
});

test('dictation uses the natural neural recording pace and preserves repeat settings',()=>{
  const start=html.indexOf('function playCurrent('),end=html.indexOf('\nfunction ',start+10);
  const calls=[];
  vm.runInNewContext(html.slice(start,end)+';playCurrent();',{
    session:{checked:false,index:0,words:[{en:'environment'}]},
    db:{settings:{plays:3,interval:4}},playText(...args){calls.push(args);}
  });
  assert.deepEqual(calls,[['environment',3,4,1]]);
  vm.runInNewContext('('+html.match(/speak:(text=>playText\([^)]*\))/)[1]+') ("environment");',{
    playText(...args){calls.push(args);}
  });
  assert.deepEqual(calls[1],['environment',1,0,1]);
});
