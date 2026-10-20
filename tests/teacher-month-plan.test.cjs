const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const core=require('../assets/word-tasks.js');
function published(){const context={window:{}};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../assets/teacher-word-tasks.js'),'utf8'),context);return context.window;}
test('the supplied October class plan covers October 12 through November 22',()=>{
 const w=published(),plan=w.WordlyTeacherPlan;
 assert.equal(plan.length,42);
 assert.equal(plan[0].day,'2026-10-12');assert.equal(plan.at(-1).day,'2026-11-22');
 const tasks=w.WordlyTeacherTasks;
 for(const date of plan.filter(p=>p.kind==='study'))assert.ok(tasks.some(t=>t.day===date.day),date.day);
 const on20=tasks.filter(t=>t.day==='2026-10-20');
 assert.deepEqual(Array.from(on20,t=>t.subject),['reading','writing','listening']);
 assert.equal(on20[0].items[0].key,'r-251');assert.equal(on20[0].items.at(-1).key,'r-300');
 assert.equal(on20[1].items.length,10);
 assert.match(on20[1].title,/犯罪冲刺第16–20词.*文化强化第1–5词/);
 assert.equal(tasks.filter(t=>t.day==='2026-11-18'&&t.subject==='writing').length,0);
 assert.equal(tasks.find(t=>t.day==='2026-11-20'&&t.subject==='reading').items.at(-1).key,'r-1450');
 assert.equal(new Set(tasks.map(t=>t.id)).size,tasks.length);
 assert.ok(tasks.every(t=>!t.displayDays));
 assert.ok(tasks.find(t=>t.day==='2026-10-30'&&t.subject==='listening').pendingSource);
 const on21=tasks.find(t=>t.day==='2026-10-21'&&t.subject==='listening');
 assert.deepEqual(Array.from(on21.items.slice(0,4),i=>i.key),['l-ch4-11-1','l-ch4-11-4','l-ch4-11-7','l-ch4-11-10']);
 assert.deepEqual(Array.from(on21.items.slice(12,15),i=>i.key),['l-ch5-1-1','l-ch5-1-13','l-ch5-1-25']);
});
test('weekends reuse the complete weekday scope without creating new answer records',()=>{
 const w=published();
 assert.deepEqual(Array.from(w.WordlyTeacherReviewDays['2026-10-24']),['2026-10-19','2026-10-20','2026-10-21','2026-10-22','2026-10-23']);
 const saved={tasks:{}};const before=JSON.stringify(saved);
 core.configure({tasks:w.WordlyTeacherTasks,plan:w.WordlyTeacherPlan,reviewDays:w.WordlyTeacherReviewDays,getDb:()=>({wordTasks:saved,knowledge:{entries:[]}})});
 const today=core.markup('2026-10-20');
 assert.match(today,/data-wt-learn="teacher-2026-10-20-reading"/);
 assert.doesNotMatch(today,/data-wt-learn="teacher-2026-10-19-reading"/);
 const weekend=core.markup('2026-10-24');
 for(const day of w.WordlyTeacherReviewDays['2026-10-24'])assert.ok(weekend.includes(`data-wt-learn="teacher-${day}-reading"`));
 assert.match(weekend,/复习单词/);
 assert.match(core.markup('2026-10-25'),/听写单词/);
 assert.equal(JSON.stringify(saved),before);
});
test('new schedule definitions publish references and ranges, never private vocabulary or answers',()=>{
 const w=published();
 for(const t of w.WordlyTeacherTasks){assert.equal(new Set(t.items.map(i=>i.key)).size,t.items.length);for(const i of t.items)assert.ok(Object.keys(i).every(k=>['key','entryId','label','optional','note'].includes(k)));}
 assert.doesNotMatch(fs.readFileSync(require('node:path').join(__dirname,'../assets/teacher-word-tasks.js'),'utf8'),/"(?:en|zh|answer|history|entered)"\s*:/);
});
