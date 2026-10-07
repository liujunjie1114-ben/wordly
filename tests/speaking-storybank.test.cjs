const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const bank=require('../assets/speaking-storybank.json');
const catalog=require('../assets/speaking-storybank.js');
const library=require('../assets/speaking-library.js');
const asset=name=>path.join(__dirname,'../assets',name);
test('all 28 original pages, every topic, and unchanged source PDF are retained',()=>{
  assert.equal(bank.sourcePages.length,28);
  assert.deepEqual(bank.sourcePages.map(p=>p.page),Array.from({length:28},(_,i)=>i+1));
  assert.ok(bank.sourcePages.every(p=>p.text.length>300));
  assert.equal(createHash('sha256').update(fs.readFileSync(asset(bank.source.file))).digest('hex'),bank.source.sha256);
  assert.equal(bank.entries.length,70);
  assert.equal(new Set(bank.entries.map(e=>e.id)).size,70);
  assert.deepEqual(['part2','part1','part3','legacy','reference'].map(k=>bank.entries.filter(e=>e.kind===k).length),[20,28,12,6,4]);
  assert.equal(bank.storyClusters.length,11);
  assert.deepEqual([...new Set(bank.entries.flatMap(e=>e.sourcePages))].sort((a,b)=>a-b),Array.from({length:28},(_,i)=>i+1));
  assert.deepEqual(catalog.map(e=>e.id),bank.entries.map(e=>e.id));
  assert.equal(library.builtins.filter(e=>e.id==='course-impressed').length,1);
});
test('all answers, corrections, outlines and table cells appear in their reading pages',()=>{
  const escape=library.escape;
  for(const e of bank.entries){
    const html=fs.readFileSync(asset(e.file),'utf8').replaceAll('&#x27;','&#39;').replaceAll('\r\n','\n');
    for(const field of ['story','answer','activeVocabulary'])if(e[field])assert.ok(html.includes(escape(e[field])),`${e.id}: ${field}`);
    for(const correction of e.errorFixes||[])assert.ok(html.includes(escape(correction)),e.id);
    for(const section of e.sections||[])for(const text of section)assert.ok(html.includes(escape(text)),e.id);
    for(const row of e.table||[])for(const cell of row)assert.ok(html.includes(escape(cell)),e.id);
    assert.ok(html.includes(bank.source.file));
    assert.match(html,/target="_top"/);
  }
  const boredom=bank.entries.find(e=>e.id==='P1-22');
  assert.match(boredom.activeVocabulary,/change my mood/);
  assert.deepEqual(boredom.sourcePages,[23,24]);
  assert.match(bank.entries.find(e=>e.id==='P2-INTERVIEW-ZHANG').answer,/warm-hearted/);
});
test('missing personal details and queued memory questions stay pending and searchable',()=>{
  const pending=library.filterEntries(library.builtins,{status:'pending'});
  assert.equal(pending.length,11); // 4 unfinished Part 2, 6 legacy topics, 1 queued Part 3.
  assert.ok(pending.every(e=>e.status==='draft'&&e.needsPersonalDetails));
  assert.ok(library.filterEntries(library.builtins,{query:'change my mood',part:1}).some(e=>e.id==='P1-22'));
  assert.ok(library.filterEntries(library.builtins,{query:'memorial objects',part:3}).some(e=>e.id==='P3-12'));
  assert.equal(library.filterEntries(library.builtins,{cluster:'SUMMER-SCHOOL',part:2}).length,4);
  assert.equal(library.filterEntries(library.builtins,{part:4}).length,4);
});
test('personal practice is independently accessible alongside the larger built-in bank',()=>{
  const entries=[...library.builtins.map(e=>({...e,builtin:true})),{id:'private-kept',part:2,title:'我的旧题',answer:'My own answer.',builtin:false}];
  assert.deepEqual(library.filterEntries(entries,{source:'mine'}).map(e=>e.id),['private-kept']);
  assert.equal(library.filterEntries(entries,{source:'builtin'}).length,70);
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert.ok(html.indexOf('src="/assets/speaking-storybank.js')<html.indexOf('src="/assets/speaking-library.js'));
});
