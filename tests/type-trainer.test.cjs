const test=require('node:test'),assert=require('node:assert/strict');
const core=require('../assets/study-core.js');
const trainer=require('../assets/type-trainer.js');
const e=(id,title,subject='listening',extra={})=>({id,title,kind:'knowledge',question:'请说出关键步骤。',summary:'参考要点',explanation:'对照说明',categories:[subject],sources:[{path:'notes.md',locator:'第1节'}],status:'ready',...extra});
test('subjects and real question types organize stable batches, with ambiguous entries in a general category',()=>{
 const entries=[e('map','地图题方位与路线'),e('blank','填空词性'),e('tf','判断题 True False Not Given','reading'),e('pending','地图题','listening',{status:'needs-check'}),e('x','其他课堂笔记')];
 const groups=trainer.groups(entries);assert.ok(groups.some(g=>g.subject==='listening'&&g.type==='地图题'&&g.ids.includes('map')));assert.ok(groups.some(g=>g.subject==='reading'&&g.type==='判断题'));assert.ok(groups.some(g=>g.type==='综合方法'));assert.ok(!groups.some(g=>g.ids.includes('pending')));
 const large=Array.from({length:35},(_,i)=>e('map-'+i,'地图题'+i));assert.deepEqual(trainer.groups(large).map(g=>g.ids.length),[16,16,3]);assert.deepEqual(trainer.groups(large),trainer.groups(large));
});
test('free recall keeps first answers, drafts and append-only self assessments separate from automatic scores',()=>{
 let s=core.normalizeState({entries:[e('map','地图题')]});s=core.saveRecallDraft(s,'map','我的第一次回答',10);assert.equal(core.learningPhase(s,'map'),'unseen');
 s=core.submitRecall(s,'map','again',{id:'first',at:11});s=core.saveRecallDraft(s,'map','修正后的回答',12);s=core.submitRecall(s,'map','remembered',{id:'second',at:13});
 assert.equal(s.learning.map.recallAttempts[0].entered,'我的第一次回答');assert.equal(s.learning.map.recallAttempts[1].entered,'修正后的回答');assert.deepEqual(s.learning.map.attempts,[]);
 assert.equal(trainer.progress(s,'map').streak,1);assert.equal(trainer.progress(s,'map').passed,false);
 s=core.saveRecallDraft(s,'map','再次独立回忆',14);s=core.submitRecall(s,'map','remembered',{id:'third',at:15});assert.equal(trainer.progress(s,'map').passed,true);
 assert.equal(core.learningPhase(s,'map'),'practiced');assert.equal(core.normalizeState(s).learning.map.recallAttempts.length,3);
 assert.throws(()=>core.submitRecall(s,'map','remembered',{id:'empty',at:16}),/回答/);
});
test('merging different tabs and full backups retains recall history, original content and old progress',()=>{
 const start=core.normalizeState({entries:[e('map','地图题')],review:{map:{stage:2,last:5,due:900,reviews:2,lapses:0}}});
 let a=core.saveRecallDraft(start,'map','第一次',10);a=core.submitRecall(a,'map','again',{id:'a',at:11});
 let b=core.saveRecallDraft(start,'map','另一个标签',12);b=core.submitRecall(b,'map','remembered',{id:'b',at:13});
 const merged=core.mergeLearningMetadata(a,b);assert.equal(merged.learning.map.recallAttempts.length,2);assert.deepEqual(merged.entries,start.entries);assert.deepEqual(merged.review,start.review);
 assert.deepEqual(core.readDb(core.writeDb({words:[],knowledge:merged})).knowledge,merged);
 const damaged=structuredClone(merged);damaged.learning.map.recallAttempts[0].assessment='automatic-pass';assert.throws(()=>core.normalizeState(damaged));
});
test('pending content and blank answers never become self-assessed passes',()=>{
 let s=core.normalizeState({entries:[e('p','待核对','reading',{status:'needs-check'})]});assert.throws(()=>core.saveRecallDraft(s,'p','回答',1));
 s=core.normalizeState({entries:[e('x','练习')]});s=core.saveRecallDraft(s,'x','  ',1);assert.throws(()=>core.submitRecall(s,'x','remembered',{id:'a',at:2}));
});
test('classification uses the explicit heading before a broad application and grammar is not inferred from examples',()=>{
 assert.equal(trainer.typeOf(e('n','数字听辨 double 与 triple','listening',{application:'电话号码填空'}),'listening'),'数字与辨音');
 assert.equal(trainer.typeOf(e('x','课堂综合方法','reading',{example:'Only then did he understand.'}),'reading'),'综合方法');
});
test('editing the question or reference keeps old answers but requires new self-assessment passes',()=>{
 let s=core.normalizeState({entries:[e('x','方法')]});
 for(let i=0;i<2;i++){s=core.saveRecallDraft(s,'x','自己的回答',i*2+1);s=core.submitRecall(s,'x','remembered',{id:'try-'+i,at:i*2+2});}
 assert.equal(trainer.progress(s,'x').passed,true);s.entries[0].summary='修订后的参考要点';assert.equal(trainer.progress(s,'x').passed,false);assert.equal(s.learning.x.recallAttempts.length,2);
});
