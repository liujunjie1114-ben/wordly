const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../assets/word-tasks.js');
const task={id:'review-fixture',day:'2026-10-22',title:'测试任务',mode:'spelling',items:Array.from({length:24},(_,i)=>({key:'q-'+i,entryId:'e-'+i,label:'第'+(i+1)+'项'}))};
const library=task.items.map((r,i)=>({id:r.entryId,status:'ready',en:'sample '+i,zh:'示例'+i}));
function fixture(){let s=core.record({},task,'q-0',{entered:'first try',correct:false,judgement:'auto',at:1});s=core.record(s,task,'q-0',{entered:'sample 0',correct:true,judgement:'auto',at:2});return core.record(s,task,'q-1',{entered:'another expression',correct:true,judgement:'self',at:3});}

test('review distinguishes first-pass mistakes, spelling checks, self assessment and untested items',()=>{
 const s=fixture(),p=core.review(task,s,library);
 assert.equal(p.autoPassed,1);assert.equal(p.selfPassed,1);assert.equal(p.firstCorrect,1);assert.equal(p.firstWrong,1);
 assert.equal(p.untested,22);assert.equal(p.recovered,1);assert.equal(p.pending,22);
 assert.deepEqual(p.batches.map(b=>({total:b.total,attempted:b.attempted,pending:b.pending})),[{total:20,attempted:2,pending:18},{total:4,attempted:0,pending:4}]);
 assert.equal(p.rows[0].record.first.entered,'first try');assert.equal(p.rows[2].status,'未测');
});

test('missing references and optional items remain visible without inflating measured progress',()=>{
 const t={...task,items:[...task.items.slice(0,3),{key:'optional',entryId:'none',optional:true}]},s=fixture();
 const p=core.review(t,s,[{...library[0],status:'needs-check'},library[1]]);
 assert.equal(p.total,3);assert.equal(p.missing,2);assert.equal(p.autoPassed,0);assert.equal(p.selfPassed,1);assert.equal(p.pending,2);
 assert.equal(p.rows[0].status,'资料待核对');assert.equal(p.rows[2].status,'未导入');assert.equal(p.rows[3].status,'不计分');
});

test('local review export includes original and latest inputs, current references and complete retest history only for this task',()=>{
 let s=fixture();s=core.record(s,{...task,id:'another-task'},'q-0',{entered:'other task private input',correct:false,judgement:'self',at:4});
 const before=JSON.stringify({s,library}),report=core.reviewText(task,s,library);
 assert.match(report,/first try/);assert.match(report,/sample 0/);assert.match(report,/示例0/);assert.match(report,/another expression/);
 assert.match(report,/首次答案/);assert.match(report,/最新答案/);assert.match(report,/逐次记录/);assert.match(report,/自评通过/);assert.match(report,/未测 22/);
 assert.doesNotMatch(report,/other task private input/);assert.equal(JSON.stringify({s,library}),before);
});

test('review exports and visible results escape imported text without hiding line breaks or corrupting table columns',()=>{
 const t={...task,items:[task.items[0]]},all=[{...library[0],en:'<script>x</script>|next',zh:'one\ntwo'}];
 const s=core.record({},t,'q-0',{entered:'<img src=x>|answer\nsecond',correct:false,judgement:'auto',at:1});
 const report=core.reviewText(t,s,all);
 assert.doesNotMatch(report,/<script>|<img/);assert.match(report,/&#124;/);assert.match(report,/one<br>two/);
 core.configure({tasks:[t],getDb:()=>({wordTasks:s,knowledge:{entries:all}})});
 const html=core.markup(t.day);assert.doesNotMatch(html,/<script>|<img/);assert.match(html,/最新答案/);assert.match(html,/导出复盘/);assert.match(html,/data-wt-export="review-fixture"/);
});

test('cards and learning groups identify self assessment and show local progress without changing learning records',()=>{
 const s=fixture(),before=JSON.stringify(s);core.configure({tasks:[task],getDb:()=>({wordTasks:s,knowledge:{entries:library}})});
 assert.match(core.markup(task.day),/拼写核对通过 1.*自评通过 1/);
 assert.match(core.learningMarkup(task,library,{page:0}),/本组已测 2\/20/);
 assert.match(core.learningMarkup(task,library,{page:1}),/本组已测 0\/4/);
 assert.equal(JSON.stringify(s),before);
});

test('export action downloads a local task report, releases its URL and never saves or uploads learning data',async()=>{
 const fs=require('node:fs'),vm=require('node:vm');let blob,download,clicked=false,revoke,timer;const notices=[],s=fixture(),before=JSON.stringify(s);
 const button={dataset:{wtExport:task.id}},day={},target={innerHTML:'',querySelector:q=>q==='[data-wt-day]'?day:null,querySelectorAll:q=>q==='[data-wt-export]'?[button]:[]};
 const context={module:{exports:{}},Blob,URL:{createObjectURL:b=>{blob=b;return 'blob:local-review';},revokeObjectURL:u=>{revoke=u;}},document:{createElement:tag=>{assert.equal(tag,'a');download={click(){clicked=true;}};return download;}},setTimeout:fn=>{timer=fn;}};
 vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../assets/word-tasks.js'),'utf8'),context);
 const isolated=context.module.exports;isolated.configure({tasks:[task],today:()=>task.day,getDb:()=>({wordTasks:s,knowledge:{entries:library}}),saveState(){throw Error('Export attempted to save');},notify:m=>notices.push(m)});
 isolated.mount(target);button.onclick();
 assert.equal(clicked,true);assert.equal(download.download,'Wordly-review-fixture-review.md');assert.equal(download.href,'blob:local-review');
 assert.match(await blob.text(),/first try/);assert.match(notices.at(-1),/未自动上传/);timer();assert.equal(revoke,'blob:local-review');assert.equal(JSON.stringify(s),before);
 context.URL.createObjectURL=()=>{throw Error('download unavailable');};button.onclick();assert.match(notices.at(-1),/导出失败/);assert.equal(JSON.stringify(s),before);
});
