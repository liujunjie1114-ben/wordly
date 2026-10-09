const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const available=fs.existsSync(path.join(__dirname,'../assets/month-plan-core.js'));
const core=available?require('../assets/month-plan-core.js'):{};
const entries=()=>['listening','reading','writing','speaking','grammar'].flatMap((subject,i)=>[{id:'k-'+i,kind:'knowledge',title:'Topic '+i,categories:[subject],status:'ready'},{id:'v-'+i,kind:'vocabulary',en:'word '+i,title:'word '+i,zh:'核心义',categories:[subject],status:'ready'}]);
const create=extra=>core.create({entries:entries(),startDay:'2026-10-09',now:1,...extra});

test('month has thirty continuous days with 330 study and 30 break minutes',()=>{
  assert.equal(typeof core.create,'function');
  const plan=create();assert.equal(plan.days.length,30);assert.equal(plan.days[29].day,'2026-11-07');
  for(const day of plan.days){assert.equal(day.tasks.filter(t=>t.subject!=='break').reduce((n,t)=>n+t.minutes,0),330);assert.equal(day.tasks.filter(t=>t.subject==='break').reduce((n,t)=>n+t.minutes,0),30);}
  assert.equal(create({startDay:'2028-02-28'}).days[1].day,'2028-02-29');
  assert.equal(create({startDay:'2028-02-28'}).days[2].day,'2028-03-01');
  assert.equal(core.chinaDay(Date.parse('2026-10-08T16:01:00Z')),'2026-10-09');
});
test('only ready real IDs enter new-learning assignments without duplicates',()=>{
  const data=entries().concat({id:'pending',kind:'knowledge',title:'待查',categories:['reading'],status:'needs-check'});
  const plan=create({entries:data});const ids=plan.days.flatMap(d=>d.tasks.flatMap(t=>t.entryIds));
  assert.equal(ids.length,10);assert.equal(new Set(ids).size,10);assert.ok(!ids.includes('pending'));
  assert.equal(plan.days[0].tasks.flatMap(t=>t.entryIds).filter(id=>id.startsWith('k-')).length,5);
  assert.equal(plan.days.slice(26).flatMap(d=>d.tasks.flatMap(t=>t.entryIds)).length,0);
  assert.throws(()=>create({entries:[]}),/可复习/);
});
test('excess material remains explicitly unassigned within six-hour bounds',()=>{
  const words=Array.from({length:6000},(_,i)=>({id:'word-'+i,title:'word '+i,en:'word '+i,zh:'词义',kind:'vocabulary',categories:['speaking'],status:'ready'}));
  const plan=create({entries:words});assert.ok(plan.unassigned.length>0);
  const assigned=plan.days.flatMap(d=>d.tasks.flatMap(t=>t.entryIds));assert.equal(assigned.length+plan.unassigned.length,6000);
  for(const d of plan.days){const word=d.tasks.find(t=>t.subject==='words');assert.ok(word.entryIds.length*45<=1800);}
});
test('append keeps completed tasks byte-identical and does not duplicate prior assignments',()=>{
  let plan=create(),task=plan.days[0].tasks.find(t=>t.subject==='reading');
  plan=core.setTask(plan,task.id,{selfReported:true,notes:'已写证据句'});const before=JSON.stringify(plan.days[0].tasks.find(t=>t.id===task.id));
  const appended=core.append(plan,entries().concat({id:'new-reading',kind:'knowledge',title:'新专题',categories:['reading'],status:'ready'}),'2026-10-09');
  assert.ok(!plan.days.flatMap(d=>d.tasks.flatMap(t=>t.entryIds)).includes('new-reading'));
  assert.equal(JSON.stringify(appended.days[0].tasks.find(t=>t.id===task.id)),before);
  const ids=appended.days.flatMap(d=>d.tasks.flatMap(t=>t.entryIds));assert.equal(new Set(ids).size,ids.length);assert.ok(ids.includes('new-reading'));
});
test('navigation progress moves on completion, reverses on uncheck, excludes breaks and survives reload',()=>{
  let plan=create(),day=plan.days[0],task=day.tasks.find(t=>t.subject==='reading');
  let p=core.progress(plan,'2026-10-09');assert.equal(p.today.total,7);assert.equal(p.today.done,0);assert.equal(p.month.total,210);
  plan=core.setTask(plan,task.id,{selfReported:true});p=core.progress(plan,'2026-10-09');assert.equal(p.today.done,1);assert.equal(p.today.percent,14);assert.equal(p.month.done,1);
  plan=core.setTask(plan,day.tasks.find(t=>t.subject==='break').id,{selfReported:true});assert.equal(core.progress(plan,'2026-10-09').today.done,1);
  plan=core.normalize(JSON.parse(JSON.stringify(plan)));assert.equal(core.progress(plan,'2026-10-09').today.done,1);
  plan=core.setTask(plan,task.id,{selfReported:false});assert.equal(core.progress(plan,'2026-10-09').today.percent,0);
  assert.equal(core.progress(null,'2026-10-09').month.percent,0);
});
test('overdue and unavailable source tasks remain visible without inventing progress',()=>{
  const plan=create();const view=core.daily(plan,'2026-10-10',{});assert.ok(view.overdue.length>0);
  const changed=entries().filter(e=>e.id!=='k-1');const appended=core.append(plan,changed,'2026-10-10');
  assert.ok(appended.missing.includes('k-1'));assert.equal(core.progress(appended,'2026-10-10').month.done,0);
  assert.throws(()=>core.normalize({version:1,days:[]}),/计划/);
});
