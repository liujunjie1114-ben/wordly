const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const file=path.join(__dirname,'../assets/speaking-vocab.js');
test('the vocabulary conversion memory module is available',()=>assert.ok(fs.existsSync(file)));
if(fs.existsSync(file)){
 const api=require(file);
 test('content includes natural basic and intermediate expressions with alternatives and rescue sentences',()=>{
  assert.equal(api.items.length,120);assert.equal(new Set(api.items.map(e=>e.id)).size,120);
  assert.equal(api.groups.length,10);assert.equal(api.levels.length,3);
  for(const e of api.items){assert.ok(e.zh&&e.en&&e.example&&e.rescue&&e.alternatives.length);assert.ok(api.levels.includes(e.level));assert.ok(api.groups.includes(e.group));assert.doesNotMatch(e.en,/[\u4e00-\u9fff]/);}
 });
 test('a filtered practice round is shuffled without duplicates or changing the source',()=>{
  const before=JSON.stringify(api.items);const q=api.select({group:api.groups[0],limit:10},()=>0);
  assert.equal(q.length,10);assert.equal(new Set(q).size,10);assert.notDeepEqual(q,api.items.filter(e=>e.group===api.groups[0]).slice(0,10).map(e=>e.id));assert.equal(JSON.stringify(api.items),before);
  assert.equal(api.select({group:'不存在'}).length,0);
 });
 test('comparison accepts listed alternatives and normalized punctuation but not substrings',()=>{
  const item=api.items.find(e=>e.en==='weigh the pros and cons');
  assert.equal(api.match(item,'  WEIGH the pros and cons. '),true);
  assert.equal(api.match(item,item.alternatives[0]),true);assert.equal(api.match(item,'pros and cons'),false);assert.equal(api.match(item,''),false);
 });
 test('only stuck or forgotten expressions are selected for retry and previous attempts survive merges',()=>{
  const id=api.items[0].id;const old={attempts:[{id:'a',itemId:id,grade:'stuck',roundId:'r',date:10}],draft:null};
  const next=api.merge(old,{attempts:[...old.attempts,{id:'b',itemId:id,grade:'smooth',roundId:'r2',date:20}],draft:null});
  assert.equal(next.attempts.length,2);assert.deepEqual(api.weakIds(next),[]);assert.deepEqual(api.weakIds(old),[id]);
  assert.equal(api.merge(next,next).attempts.length,2);
  const concurrent=api.merge(next,{attempts:[{id:'c',itemId:api.items[1].id,grade:'missed',roundId:'r3',date:30}],draft:null});assert.equal(concurrent.attempts.length,3);
  assert.equal(api.normalize({attempts:[{id:'invalid',itemId:id,grade:'invented',roundId:'x',date:1}]}).attempts.length,0);
 });
 test('only revealed cards can be graded, interrupted rounds resume, and grading is immutable',()=>{
  const s=api.start(api.empty(),{limit:2},100,()=>0);const original=JSON.stringify(s);
  assert.throws(()=>api.grade(s,'smooth',{now:200}),/揭晓/);const r=api.reveal(s,'test answer',200);
  const n=api.grade(r,'stuck',{now:500,id:'attempt-1'});
  assert.equal(n.attempts.length,1);assert.equal(n.draft.index,1);assert.equal(n.attempts[0].answer,'test answer');assert.equal(n.draft.revealed,false);
  assert.deepEqual(api.normalize(JSON.parse(JSON.stringify(n))),n);assert.equal(JSON.stringify(s),original);
  const done=api.grade(api.reveal(n,'',600),'missed',{now:800,id:'attempt-2'});assert.equal(done.draft.index,2);assert.equal(api.roundResults(done).length,2);
 });
}
