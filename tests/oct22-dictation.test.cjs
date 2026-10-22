const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const core=require('../assets/word-tasks.js');

test('October 22 screenshot assignment keeps all 24 numbered private references and earlier answers',()=>{
 const context={window:{}};
 const source=fs.readFileSync(path.join(__dirname,'../assets/teacher-word-tasks.js'),'utf8');
 vm.runInNewContext(source,context);
 const all=context.window.WordlyTeacherTasks;
 const task=all.find(t=>t.id==='teacher-2026-10-22-dictation-24');
 assert.equal(task.day,'2026-10-22');
 assert.equal(task.mode,'spelling');
 const ids=Array.from({length:24},(_,i)=>`dict-20261022-${String(i+1).padStart(2,'0')}`);
 assert.deepEqual(Array.from(task.items,i=>i.entryId),ids);
 assert.deepEqual(Array.from(task.items,i=>i.key),ids);
 assert.match(task.note,/参考译法/);
 assert.match(task.note,/第7项有歧义/);
 assert.equal(all.filter(t=>t.day==='2026-10-22').length,4);
 assert.doesNotMatch(source,/"(?:en|zh|example|answer)"\s*:/);
 const oldTask=all.find(t=>t.id==='teacher-2026-10-22-writing');
 const before=core.record({},oldTask,oldTask.items[0].key,{entered:'previous answer',correct:false,judgement:'self',at:1});
 const next=core.record(before,task,task.items[0].key,{entered:'new answer',correct:false,judgement:'self',at:2});
 assert.deepEqual(next.tasks[oldTask.id],before.tasks[oldTask.id]);
 assert.equal(next.tasks[task.id].items[task.items[0].key].first.entered,'new answer');
 assert.equal(core.summary(task,next,[]).missing,24);
});
