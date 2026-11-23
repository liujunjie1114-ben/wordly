const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const core=require('../assets/word-tasks.js');
test('P1 spelling has 160 unique public words, eight groups and separate next-day recall',()=>{
 const p=require('../assets/p1-spelling.js');assert.equal(p.entries.length,160);assert.equal(new Set(p.entries.map(e=>e.en.toLowerCase())).size,160);
 assert.equal(p.tasks.filter(t=>t.day==='2026-11-23').length,8);assert.equal(p.tasks.filter(t=>t.day==='2026-11-24').length,8);
 assert.equal(p.tasks.filter(t=>t.day==='2026-11-24').reduce((n,t)=>n+t.items.length,0),160);
 for(const t of p.tasks){assert.equal(t.items.length,20);assert.equal(t.mode,'audio');assert.equal(t.strictSpelling,true);assert.equal(core.summary(t,{tasks:{}},p.entries).missing,0);assert.equal(core.summary(t,{tasks:{}},p.entries).complete,false);}
 for(const en of ['waterfall','insurance','accommodation','Wednesday','February','receipt','address'])assert.ok(p.entries.some(e=>e.en===en),en);
 const old=Object.freeze([{id:p.entries[0].id,en:'my edited word',zh:'私人修改',status:'ready'}]);const lib=p.library(old);assert.equal(lib.length,160);assert.equal(lib[0],old[0]);assert.equal(old.length,1);
});
test('strict spelling records cannot pass through self assessment, old tasks still can',()=>{
 const t={id:'p1-test',strictSpelling:true,items:[{key:'one',entryId:'one'}]},a={entered:'waterfal',correct:true,judgement:'self',at:1};
 assert.throws(()=>core.record({tasks:{}},t,'one',a),/拼写/);
 assert.doesNotThrow(()=>core.record({tasks:{}},{...t,strictSpelling:false},'one',a));
 assert.equal(core.checkSpelling('waterfal','waterfall'),false);assert.equal(core.checkSpelling('insurence','insurance'),false);assert.equal(core.checkSpelling('address','addresses'),false);assert.equal(core.checkSpelling('theater','theatre',['theater']),true);
 let s=core.record({tasks:{}},t,'one',{...a,correct:false,judgement:'auto'});s=core.record(s,t,'one',{entered:'waterfall',correct:true,judgement:'auto',at:2});assert.equal(s.tasks[t.id].items.one.first.entered,'waterfal');assert.equal(s.tasks[t.id].items.one.attempts,2);
});
test('public supplement appends tasks without rewriting existing assignments or learner state',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../assets/p1-spelling.js'),'utf8');const old={id:'existing-task',items:[]},window={WordlyTeacherTasks:[old]};vm.runInNewContext(source,{window,globalThis:window});assert.equal(window.WordlyTeacherTasks[0],old);assert.equal(window.WordlyTeacherTasks.length,17);assert.equal(window.localStorage,undefined);
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');assert.ok(html.includes('p1-spelling.js?v='));assert.ok(html.includes('getEntries:()=>window.WordlyP1Spelling.library(db.knowledge.entries)'));
});

test('all 160 P1 answers have local audio and manifest hashes match',()=>{
 const crypto=require('node:crypto');const p=require('../assets/p1-spelling.js');const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');const pack=JSON.parse(html.match(/const AUDIO_PACK=(\{[^\n]+\});/)[1]);const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/neural-audio-manifest.json'),'utf8'));
 for(const e of p.entries){const url=pack[e.en.toLowerCase()];assert.ok(url,'missing local audio: '+e.en);const clip=manifest.clips.find(c=>c.key===e.en.toLowerCase());assert.ok(clip,e.en);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'..',url))).digest('hex'),clip.sha256);}
});

test('August uses the month pronunciation with initial stress',()=>{
 const m=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/neural-audio-manifest.json'),'utf8'));const clip=m.clips.find(c=>c.key==='august');assert.equal(clip.phonemes,'ˈɔːɡəst.');assert.ok(clip.overrides.includes('august'));
});
