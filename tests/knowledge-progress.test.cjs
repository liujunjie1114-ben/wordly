const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../assets/study-core.js');
const e={id:'cause',kind:'knowledge',title:'因果方向',categories:['writing'],sources:[{path:'local.md',locator:'第一节'}],status:'ready'};
const fresh=()=>core.normalizeState({entries:[e],review:{cause:{stage:2,last:10,due:900,reviews:2,lapses:0}}});
const quiz={id:'cause-check',entryId:'cause',version:1,title:'因果方向',questions:[{id:'in',type:'fill',prompt:'Causes result ___ effects.',answers:['in'],explanation:'原因引出结果。'},{id:'from',type:'choice',prompt:'Effects result ___ causes.',options:[{id:'a',text:'from'},{id:'b',text:'in'}],answers:['a'],explanation:'结果来自原因。'}]};
test('reading, familiarity and old review evidence are independent and never invent an exam pass',()=>{
 let s=core.normalizeState({entries:[e]});assert.equal(core.learningPhase(s,'cause'),'unseen');
 s=core.markViewed(s,'cause',100);assert.equal(core.learningPhase(s,'cause'),'viewed');assert.deepEqual(s.review,{});
 s=core.setFamiliarity(s,'cause','familiar',101);assert.equal(core.learningPhase(s,'cause'),'viewed');assert.equal(core.checkProgress(s,'cause',quiz).passed,false);
 assert.equal(core.learningPhase(fresh(),'cause'),'practiced');assert.throws(()=>core.markViewed(s,'absent',1));
});
test('objective quiz keeps first failed submission, retests only real mistakes and aggregates the same version',()=>{
 let s=core.submitCheck(fresh(),'cause',quiz,{in:'from',from:'a'},{at:100,id:'first'});
 assert.equal(s.learning.cause.attempts[0].score,1);assert.equal(core.checkProgress(s,'cause',quiz).passed,false);
 s=core.submitCheck(s,'cause',quiz,{in:' IN '},{at:200,id:'retry',questionIds:['in']});
 assert.equal(core.checkProgress(s,'cause',quiz).passed,true);assert.equal(s.learning.cause.attempts.length,2);
 assert.equal(s.learning.cause.attempts[0].results[0].entered,'from');assert.equal(core.learningPhase(s,'cause'),'practiced');
 assert.equal(core.checkProgress(s,'cause',{...quiz,version:2}).passed,false);
 assert.deepEqual(s.review,fresh().review);assert.throws(()=>core.submitCheck(s,'cause',quiz,{},{at:3,id:'blank'}));
 assert.throws(()=>core.submitCheck(s,'cause',quiz,{in:'in'},{at:3,id:'fake',questionIds:['invented']}));
});
test('drafts do not count as practice, and importing or compressing keeps metadata and original review dates',()=>{
 let s=core.saveCheckDraft(core.normalizeState({entries:[e]}),'cause',quiz,{in:'from'},100);
 assert.equal(core.learningPhase(s,'cause'),'unseen');assert.equal(s.learning.cause.draft.answers.in,'from');
 s=core.markViewed(s,'cause',110);s=core.setLibraryView(s,{subject:'writing',phase:'viewed',query:'因果',limit:36,lastId:'cause',scroll:880},111);
 const pack={schema:'wordly-study-pack',version:1,batch:{id:'repeat',title:'repeat'},entries:[e]};
 assert.deepEqual(core.merge(s,pack).state.learning,s.learning);assert.deepEqual(core.merge(s,pack).state.libraryView,s.libraryView);
 const db={words:[],knowledge:s,logs:[]};assert.deepEqual(core.readDb(core.writeDb(db)),db);
 assert.throws(()=>core.normalizeState({...s,learning:{cause:{seenAt:1,attempts:'broken'}}}));
});
test('metadata merge preserves other-tab attempts and uses the latest explicit familiarity and draft',()=>{
 let a=core.submitCheck(fresh(),'cause',quiz,{in:'in',from:'a'},{at:10,id:'a'});
 let b=core.setFamiliarity(core.markViewed(fresh(),'cause',20),'cause','partial',21);
 const merged=core.mergeLearningMetadata(a,b);assert.equal(merged.learning.cause.attempts.length,1);assert.equal(merged.learning.cause.familiarity,'partial');
 assert.deepEqual(merged.review,a.review);assert.deepEqual(core.mergeLearningMetadata(merged,b),merged);
});
test('the first ten authored checks have thirty gradable questions with distinct distractors and explanations',()=>{
 const catalog=require('../assets/knowledge-checks.js');assert.equal(Object.keys(catalog).length,10);let total=0;
 for(const q of Object.values(catalog)){core.validateQuiz(q,q.entryId);const s=core.normalizeState({entries:[{...e,id:q.entryId}]});const answers=Object.fromEntries(q.questions.map(x=>[x.id,x.answers[0]]));const next=core.submitCheck(s,q.entryId,q,answers,{id:'all-correct',at:1});assert.equal(core.checkProgress(next,q.entryId,q).passed,true);for(const item of q.questions)assert.ok(item.explanation.length>5);total+=q.questions.length;}
 assert.equal(total,30);
});
test('the list keeps its filters and last card and marks real opens as viewed',()=>{
 const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),controls=new Map();let saved=core.normalizeState({entries:[{...e,summary:'因果方向'},{...e,id:'other',title:'另一条'}]}),writes=0;
 const control=s=>{if(!controls.has(s))controls.set(s,{listeners:{},addEventListener(t,f){this.listeners[t]=f;},dataset:{},value:'',focus(){}});return controls.get(s);};
 const opener=Object.assign(control('opener'),{dataset:{studyOpen:'cause'}});
 const back=control('back');
 const node={innerHTML:'',querySelector:control,querySelectorAll(s){return s==='[data-study-open]'?[opener]:s==='[data-study-list]'?[back]:[];}};
 const c=vm.createContext({WordlyStudyCore:core,module:{exports:{}},Date,URL,Blob,console});vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/study-library.js'),'utf8'),c);const ui=c.module.exports;
 ui.configure({getState:()=>saved,setState(next){saved=next;writes++;return true;},notify(){}});ui.mount(node);
 control('[data-study-search]').listeners.input({target:{value:'因果'}});opener.onclick();assert.equal(core.learningPhase(saved,'cause'),'viewed');assert.equal(saved.libraryView.query,'因果');assert.equal(saved.libraryView.lastId,'cause');
 back.onclick();assert.match(node.innerHTML,/value="因果"/);assert.match(node.innerHTML,/data-study-phase="viewed"/);assert.deepEqual(saved.review,{});assert.ok(writes>0);
});
test('unconfigured or unverified cards cannot masquerade as automatically passed checks',()=>{
 const ui=require('../assets/study-library.js'),saved=core.normalizeState({entries:[e]});ui.configure({getState:()=>saved,setState:()=>true,checks:{},notify(){}});ui.open({entryId:'cause'});const node={innerHTML:'',querySelectorAll:()=>[],querySelector:()=>null};ui.mount(node);assert.match(node.innerHTML,/暂未配置自动题/);assert.doesNotMatch(node.innerHTML,/data-check-start/);
 assert.throws(()=>core.submitCheck(core.normalizeState({entries:[{...e,status:'needs-check'}]}),'cause',quiz,{in:'in',from:'a'},{id:'invalid',at:1}));
 assert.throws(()=>core.readLearningMetadata({studyLearningData:{unexpected:[]}}));
});
test('choosing the viewed folder persists immediately so a refresh does not reset the folder',()=>{
 const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');let saved=core.markViewed(core.normalizeState({entries:[e]}),'cause',100);
 const button={dataset:{studyPhase:'viewed'}},node={innerHTML:'',querySelector:()=>null,querySelectorAll:s=>s==='[data-study-phase]'?[button]:[]};
 const c=vm.createContext({WordlyStudyCore:core,module:{exports:{}},Date,URL,Blob,console});vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/study-library.js'),'utf8'),c);const ui=c.module.exports;ui.configure({getState:()=>saved,setState(next){saved=next;return true;},notify(){}});ui.mount(node);button.onclick();assert.equal(saved.libraryView?.phase,'viewed');
});
test('large libraries store changing learning metadata apart from the stable content and round-trip both',()=>{
 let s=core.normalizeState({entries:[e,...Array.from({length:140},(_,i)=>({...e,id:'large-'+i,explanation:'原始私人知识内容'.repeat(1200)}))]});s=core.markViewed(s,'cause',100);
 const db={words:[],knowledge:s,logs:[]},stored=core.writeDb(db);assert.ok(stored.studyLearningData);
 assert.equal(core.readDb({words:[],knowledge:stored.knowledge}).knowledge.learning,undefined);
 assert.deepEqual(core.readDb(stored),db);
 for(let at=101;at<109;at++)assert.equal(core.writeDb({...db,knowledge:core.markViewed(s,'cause',at)}).knowledge===stored.knowledge,true,'changing progress must reuse compressed content');
 const damaged=structuredClone(stored);damaged.studyLearningData.checksum='bad';assert.throws(()=>core.readDb(damaged));
});
test('loading a previously compressed library primes the cache before its first progress save',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),lz=require('../assets/lz-string.js');
 const s=core.markViewed(core.normalizeState({entries:[e,...Array.from({length:140},(_,i)=>({...e,id:'cold-'+i,explanation:'私人正文'.repeat(2400)}))]}),'cause',100),db={words:[],knowledge:s,logs:[]},stored=core.writeDb(db);
 let compressions=0;const spy={...lz,compressToUTF16(value){compressions++;return lz.compressToUTF16(value);}},c=vm.createContext({module:{exports:{}},require:()=>spy,TextEncoder});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/study-core.js'),'utf8'),c);const freshCore=c.module.exports,loaded=freshCore.readDb(stored);loaded.knowledge=freshCore.markViewed(loaded.knowledge,'cause',101);freshCore.writeDb(loaded);assert.equal(compressions,1,'only changed metadata needs compression');
});
