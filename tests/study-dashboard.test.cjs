const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../assets/month-plan-core.js');
const ui=require('../assets/study-dashboard.js');
const entries=['listening','reading','writing','speaking','grammar'].map(s=>({id:'card-'+s,title:s==='reading'?'<script>bad</script>':s,kind:'knowledge',categories:[s],status:'ready'}));
entries.push({id:'vocab-one',title:'original',en:'original',kind:'vocabulary',categories:['reading'],status:'ready'});
const db=()=>({knowledge:{entries,review:{}},words:[],mistakes:{old:{}},logs:[],speaking:{logs:[]},studyPlan:null});
test('primary navigation has today followed by six subjects; empty progress is not success',()=>{
  assert.deepEqual(ui.primary.map(x=>x[0]),['home','hub-listening','hub-reading','hub-writing','hub-speaking','hub-words','hub-grammar']);
  const html=ui.navProgress(db(),'2026-10-09');assert.match(html,/value="0"/);assert.match(html,/尚未开始/);
});
test('today precedes due reviews, subjects and legacy calendar; preview does not save',()=>{
  let saves=0;const data=db();ui.configure({getDb:()=>data,savePlan:()=>{saves++;return true;},navigate:()=>true,openKnowledge:()=>true,notify(){}});
  const node={innerHTML:'',querySelectorAll:()=>[],querySelector:()=>null};ui.mountHome(node);
  assert.ok(node.innerHTML.indexOf('data-dashboard-today')<node.innerHTML.indexOf('data-dashboard-due'));
  assert.ok(node.innerHTML.indexOf('data-dashboard-due')<node.innerHTML.indexOf('data-dashboard-subjects'));
  assert.match(node.innerHTML,/开始 30 天计划/);assert.equal(saves,0);assert.equal(data.studyPlan,null);
});
test('all subject hubs have knowledge, practice and reflection without raw HTML leakage',()=>{
  ui.configure({getDb:()=>db()});
  for(const subject of ['listening','reading','writing','speaking','words','grammar']){
    const html=ui.subjectMarkup(subject);for(const label of ['学知识','做练习','留复盘'])assert.match(html,new RegExp(label));
    assert.doesNotMatch(html,/<script>bad/);
  }
  assert.match(ui.subjectMarkup('reading'),/&lt;script&gt;/);
});
test('completing and undoing moves both bars and survives re-render without changing review results',()=>{
  const data=db();data.studyPlan=core.create({entries,startDay:'2026-10-09',now:1});
  const id=data.studyPlan.days[0].tasks[0].id;
  ui.configure({getDb:()=>data,savePlan:p=>{data.studyPlan=p;return true;},notify(){}});
  assert.equal(ui.updateTask(id,{selfReported:true}),true);
  assert.match(ui.navProgress(data,'2026-10-09'),/今日[^]*1 \/ 7/);
  assert.match(ui.navProgress(data,'2026-10-09'),/30 天[^]*1 \/ 210/);
  assert.match(ui.homeMarkup('2026-10-09'),/自报完成/);assert.match(ui.homeMarkup('2026-10-09'),/实测证据/);
  assert.deepEqual(data.knowledge.review,{});
  ui.updateTask(id,{selfReported:false});assert.match(ui.navProgress(data,'2026-10-09'),/今日[^]*0 \/ 7/);
});
test('failed saves do not move progress; task opens exact queue, not a random card',()=>{
  const data=db();data.studyPlan=core.create({entries,startDay:'2026-10-09',now:1});let target;
  ui.configure({getDb:()=>data,savePlan:()=>false,openKnowledge:x=>{target=x;return true;},notify(){}});
  const task=data.studyPlan.days[0].tasks.find(t=>t.subject==='reading');
  assert.equal(ui.updateTask(task.id,{selfReported:true}),false);assert.equal(task.selfReported,false);
  ui.continueTask(task.id);assert.deepEqual(target.reviewIds,task.entryIds);
});
test('empty library guides import and never fabricates learning tasks',()=>{
  ui.configure({getDb:()=>({...db(),knowledge:{entries:[],review:{}}})});
  assert.match(ui.homeMarkup('2026-10-09'),/导入资料/);assert.doesNotMatch(ui.homeMarkup('2026-10-09'),/data-task-toggle/);
});
test('new navigation uses existing recording, dictation and unsaved-edit guards before opening knowledge',()=>{
  const fs=require('node:fs'),vm=require('node:vm');const source=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8').split(/\r?\n/);
  const ctx=vm.createContext({pages:[...ui.primary,['knowledge']],recordingBusy:()=>true,toast(){},cancelAudio(){},render(){},history:{replaceState(){}},location:{pathname:'/',search:'',hash:''},page:'home',session:null,spRun:null,searchTerm:'',window:{WordlyStudyDashboard:{beforeNavigate:()=>true,primary:ui.primary},WordlyStudyLibrary:{beforeNavigate:()=>true,open(){throw Error('must not open');}},WordlySpeakingLibrary:{beforeNavigate:()=>true}}});
  vm.runInContext(source.find(s=>s.startsWith('function go(p)')),ctx);vm.runInContext(source.find(s=>s.startsWith('function openStudyKnowledge(')),ctx);
  assert.equal(vm.runInContext("openStudyKnowledge({entryId:'x'})",ctx),false);assert.equal(ctx.page,'home');
  ctx.recordingBusy=()=>false;ctx.session={};assert.equal(vm.runInContext("go('hub-reading')",ctx),false);
  ctx.session=null;ctx.window.WordlyStudyDashboard.beforeNavigate=()=>false;assert.equal(vm.runInContext("go('hub-reading')",ctx),false);assert.equal(ctx.page,'home');
  ctx.window.WordlyStudyDashboard.beforeNavigate=()=>true;assert.equal(vm.runInContext("go('hub-reading')",ctx),true);assert.equal(ctx.page,'hub-reading');
});
test('start and preview are explicit UI actions; discarded preview never saves',()=>{
  const data=db(),controls=new Map();let writes=0;
  function control(selector){if(!controls.has(selector))controls.set(selector,{value:'2026-10-09',dataset:{},addEventListener(type,fn){this[type]=fn;}});return controls.get(selector);}
  const node={innerHTML:'',querySelector:control,querySelectorAll(selector){return ['[data-sd-preview]','[data-sd-close-preview]','[data-sd-start-plan]'].includes(selector)?[control(selector)]:[];}};
  ui.configure({getDb:()=>data,savePlan:p=>{writes++;data.studyPlan=p;return true;},onChange(){}});ui.mountHome(node);
  assert.equal(writes,0);control('[data-sd-preview]').click();assert.match(node.innerHTML,/尚未保存/);assert.equal(writes,0);
  control('[data-sd-close-preview]').click();assert.equal(writes,0);assert.equal(data.studyPlan,null);
  control('[data-sd-start-plan]').click();assert.equal(writes,1);assert.equal(data.studyPlan.days.length,30);
});
