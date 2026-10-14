const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../assets/word-tasks.js');
const task={id:'teacher-2026-10-13-reading',day:'2026-10-13',mode:'meaning',items:[{key:'r-1',entryId:'a'},{key:'r-2',entryId:'b'},{key:'r-3',entryId:'missing'}]};
const entries=[{id:'a',status:'ready',en:'rise',zh:'上升'},{id:'b',status:'needs-check',en:'raise',zh:'提高'}];
test('published assignments contain exact numbered ranges and only references to the private library',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),context={window:{}};
 vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../assets/teacher-word-tasks.js'),'utf8'),context);
 const all=context.window.WordlyTeacherTasks,tasks=all.filter(t=>t.day==='2026-10-13');assert.deepEqual(Array.from(tasks,t=>t.items.length),[50,15,255]);
 assert.equal(new Set(all.map(t=>t.id)).size,all.length);
 for(const t of all){assert.equal(new Set(t.items.map(i=>i.key)).size,t.items.length);for(const i of t.items)assert.deepEqual(Object.keys(i).sort(),['entryId','key','label']);}
 assert.equal(tasks[0].items[49].key,'r-50');assert.equal(tasks[1].items[14].key,'w-15');
 assert.ok(tasks[2].items.every(i=>/^l-[1-7]-\d+$/.test(i.key)));
 assert.deepEqual(Array.from(tasks[2].items.slice(0,4),i=>i.key),['l-1-1','l-1-10','l-1-19','l-1-28']);
 const today=all.filter(t=>t.day==='2026-10-14');assert.deepEqual(Array.from(today,t=>t.items.length),[50,6,10,225]);
 assert.deepEqual(Array.from(today[0].items,i=>i.key),Array.from({length:50},(_,i)=>'r-'+(i+51)));
 assert.deepEqual(Array.from(today[1].items,i=>i.key),Array.from({length:6},(_,i)=>'w-strong-'+(i+15)));
 assert.deepEqual(Array.from(today[2].items,i=>i.key),Array.from({length:10},(_,i)=>'w-sprint-'+(i+1)));
 assert.ok(today[3].items.every(i=>/^l-(8|9|10|11|12|13)-\d+$/.test(i.key)));
 assert.deepEqual(Array.from(today[3].items.slice(0,4),i=>i.key),['l-8-1','l-8-10','l-8-19','l-8-29']);
 assert.deepEqual(Array.from(today[3].items.slice(-4),i=>i.key),['l-13-9','l-13-18','l-13-27','l-13-36']);
});
test('task resolution keeps teacher order, duplicate numbers and missing or pending rows visible',()=>{
 const rows=core.resolve(task,entries);assert.deepEqual(rows.map(r=>r.key),['r-1','r-2','r-3']);assert.deepEqual(rows.map(r=>r.available),[true,false,false]);
 assert.equal(core.summary(task,{},entries).complete,false);assert.equal(core.summary(task,{},entries).missing,2);
});
test('first answer survives errors, retests and normalization; latest result determines remaining mistakes',()=>{
 let state=core.record({},task,'r-1',{entered:'增加',correct:false,judgement:'self',at:1});
 state=core.record(state,task,'r-1',{entered:'上升',correct:true,judgement:'self',at:2});
 const saved=core.normalizeState(JSON.parse(JSON.stringify(state)));
 assert.equal(saved.tasks[task.id].items['r-1'].first.entered,'增加');
 assert.equal(saved.tasks[task.id].items['r-1'].latest.correct,true);
 assert.equal(saved.tasks[task.id].items['r-1'].attempts,2);
 assert.equal(saved.tasks[task.id].items['r-1'].errors,1);
 assert.deepEqual(core.queue(task,saved,entries,'wrong'),[]);
 assert.throws(()=>core.record(state,task,'invented',{entered:'x',correct:true,judgement:'auto',at:3}));
});
test('spelling normalizes case, whitespace and hyphen; slash expressions require self assessment',()=>{
 assert.equal(core.checkSpelling(' MAN MADE   environment ','man-made environment'),true);
 assert.equal(core.checkSpelling('rize','rise'),false);
 assert.equal(core.checkSpelling('higher food production','improved/higher food production'),null);
});
test('complete means every numbered item has a result and no unresolved mistake; history is append-only',()=>{
 const t={...task,items:[task.items[0]]};let s=core.record({},t,'r-1',{entered:'错误',correct:false,judgement:'self',at:1});
 assert.equal(core.summary(t,s,entries).complete,false);assert.equal(core.queue(t,s,entries,'wrong').length,1);
 s=core.record(s,t,'r-1',{entered:'上升',correct:true,judgement:'self',at:2});
 assert.equal(core.summary(t,s,entries).complete,true);assert.equal(s.tasks[t.id].history.length,2);
 const extra=core.record(s,{...t,id:'teacher-next-day'},'r-1',{entered:'上升',correct:true,judgement:'self',at:3});
 assert.deepEqual(extra.tasks[t.id],s.tasks[t.id]);assert.throws(()=>core.normalizeState({tasks:{broken:{items:[],history:[]}}}));
});
test('stale tabs merge independent answers without losing first attempts or duplicating history',()=>{
 const t={...task,items:[task.items[0],task.items[1]]};
 const a=core.record({},t,'r-1',{entered:'错',correct:false,judgement:'self',at:1});
 const b=core.record({},t,'r-2',{entered:'提高',correct:true,judgement:'self',at:2});
 const merged=core.mergeState(a,b);assert.equal(merged.tasks[t.id].history.length,2);
 assert.equal(merged.tasks[t.id].items['r-1'].first.correct,false);
 assert.deepEqual(core.mergeState(merged,a),merged);
});
test('returning to the home tab cannot reset an active answer or interrupt its audio',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
 const source=html.match(/^function render\(\).*$/m)[0];
 assert.doesNotThrow(()=>vm.runInNewContext(source+';render();',{window:{WordlyWordTasks:{isPracticing:()=>true,beforeRender(){throw Error('Active task was reset');}}}}));
});
