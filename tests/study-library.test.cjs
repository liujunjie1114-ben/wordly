const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const core=require('../assets/study-core.js');
const entry=(id='kp-one',extra={})=>({id,title:'判断题的证据',categories:['reading'],summary:'原解释',sources:[{path:'lesson.pdf',locator:'第 2 页'}],...extra});
const pack=(entries=[entry()],id='batch-one')=>({schema:'wordly-study-pack',version:1,batch:{id,title:'首批'},entries});

test('Chinese editorial label is not spoken as English',()=>{
  const p=pack([entry('flat',{kind:'vocabulary',en:'flat',zh:'公寓',example:'整理补充例句（原创，非原文）：The flat is spacious.'})]);
  const word=core.mergeWords([],p,1).words[0];
  assert.equal(word.example.en,'The flat is spacious.');
  assert.match(word.example.attribution,/原创/);
  const mixed=pack([entry('house',{kind:'vocabulary',en:'house',zh:'住宅',example:'My house is big. 我的房子很大。'})]);
  assert.equal(core.mergeWords([],mixed,1).words[0].example,undefined);
});

test('preview validation rejects backup files, malformed items and repeated IDs',()=>{
  assert.throws(()=>core.readPack({words:[],logs:[]}));
  assert.throws(()=>core.readPack(pack([])));
  assert.throws(()=>core.readPack(pack([entry(),entry()])));
  assert.throws(()=>core.readPack(pack([entry('bad/id')])));
  assert.throws(()=>core.readPack(pack([entry('__proto__')])));
  assert.throws(()=>core.readPack(pack([entry('x',{sources:[]})])));
  assert.throws(()=>core.readPack(pack([entry('x',{categories:['unknown']})])));
});
test('repeated imports merge sources while retaining personal edits and review schedules',()=>{
  let state=core.merge(null,pack(),100).state;
  state.entries[0].title='我改过的标题';state.entries[0].summary='自己的解释';state.entries[0].example='My example.';
  state=core.grade(state,'kp-one',true,1000);
  const before=structuredClone(state.review);
  const incoming=pack([entry('another-id',{categories:['reading','grammar'],summary:'新的原解释',sources:[{path:'lesson-copy.pdf',locator:'第 3 页'}]})],'batch-two');
  const result=core.merge(state,incoming,2000);
  assert.equal(result.added,0);assert.equal(result.merged,1);assert.equal(result.state.entries.length,1);
  assert.equal(result.state.entries[0].title,'我改过的标题');assert.equal(result.state.entries[0].summary,'自己的解释');assert.equal(result.state.entries[0].example,'My example.');
  assert.equal(result.state.entries[0].sources.length,2);assert.deepEqual(result.state.review,before);
  const again=core.merge(result.state,incoming,3000).state;assert.deepEqual(again,result.state);
  assert.equal(state.entries[0].sources.length,1);
});
test('a reused ID with conflicting content cannot overwrite an existing card',()=>{
  const state=core.merge(null,pack(),1).state;
  assert.throws(()=>core.merge(state,pack([entry('kp-one',{title:'完全不同的知识点'})],'batch-two')));
});
test('vocabulary with distinct senses is not silently collapsed',()=>{
  const first=entry('v-bank-a',{kind:'vocabulary',title:'bank',en:'bank',zh:'银行',pos:'n.'});
  const second=entry('v-bank-b',{kind:'vocabulary',title:'bank',en:'bank',zh:'河岸',pos:'n.'});
  assert.equal(core.merge(null,pack([first,second]),1).state.entries.length,2);
});

test('large content exports as individually importable bounded batches',()=>{
  assert.equal(typeof core.exportPacks,'function');
  const values=Array.from({length:1205},(_,i)=>entry('export-'+i,{title:'知识点 '+i}));
  const batches=core.exportPacks(values,100);
  assert.ok(batches.length>1);
  assert.equal(batches.reduce((n,b)=>n+core.readPack(b).entries.length,0),values.length);
  for(const batch of batches)assert.ok(Buffer.byteLength(JSON.stringify(batch))<5*1024*1024);
});

test('personal wordbook import adds vocabulary and retains existing learning data',()=>{
  const original=[{id:'mine',en:'bank',zh:'我自己的银行释义',mastered:true,correctCount:5,appearances:8,example:{en:'My bank.',zh:'我的银行。'}}];
  const incoming=pack([entry('v-bank',{kind:'vocabulary',title:'bank',en:'bank',zh:'河岸'}),entry('v-new',{kind:'vocabulary',title:'engaging',en:'engaging',zh:'吸引人的',example:'The story is engaging.',categories:['speaking'],tags:['Movies']}),entry('v-check',{kind:'vocabulary',title:'pending',en:'pending',zh:'待核对',status:'needs-check'}),entry()]);
  const result=core.mergeWords(original,incoming,100);
  assert.equal(result.added,1);assert.equal(result.merged,1);assert.equal(result.pending,1);
  const bank=result.words.find(w=>w.en==='bank');
  for(const key of ['id','zh','mastered','correctCount','appearances','example'])assert.deepEqual(bank[key],original[0][key]);
  assert.ok(bank.studyMeanings.includes('河岸'));assert.equal(bank.studySources.length,1);
  const engaging=result.words.find(w=>w.en==='engaging');
  assert.equal(engaging.zh,'吸引人的');assert.equal(engaging.mastered,false);assert.equal(engaging.created,100);
  assert.deepEqual(engaging.studyCategories,['speaking']);
  assert.deepEqual(core.mergeWords(result.words,incoming,200).words,result.words);
  assert.equal(original.length,1);assert.equal(original[0].studySources,undefined);
});

test('large private libraries store compactly and reload without losing word or review data',()=>{
  assert.equal(typeof core.writeDb,'function');
  const base=entry('large',{explanation:'私人资料测试。'.repeat(200),kind:'vocabulary',en:'large',zh:'大的'});
  let data={words:[],knowledge:{entries:[],review:{},imports:[]},logs:[{answer:'original'}],mistakes:{large:{errors:3}}};
  for(let batch=0;batch<6;batch++){
    const p=pack(Array.from({length:900},(_,i)=>({...base,id:'large-'+batch+'-'+i,en:'word-'+batch+'-'+i,title:'知识点 '+batch+'-'+i})), 'large-batch-'+batch);
    data.knowledge=core.merge(data.knowledge,p,1).state;data.words=core.mergeWords(data.words,p,1).words;
  }
  data.knowledge.review['large-0-0']={stage:1,due:123,reviews:1,last:2,lapses:0};
  data.words[0].example={en:'My edited example.',zh:'自己的例句'};data.words[0].mastered=true;
  const compact=core.writeDb(data);
  assert.ok(JSON.stringify(compact).length<JSON.stringify(data).length/2);
  assert.deepEqual(core.readDb(compact),data);
  assert.deepEqual(core.readDb(data),data);
  const corrupt=structuredClone(compact);corrupt.knowledge.data='broken';
  assert.throws(()=>core.readDb(corrupt));
});
test('search includes corrections and source locators; cross-subject filters work',()=>{
  const values=[core.entry(entry('x',{categories:['reading','grammar'],correction:'Only after...',sources:[{path:'my-note.md',locator:'段落 75'}]})),core.entry(entry('y',{kind:'vocabulary',en:'rise',zh:'上升',title:'rise',status:'needs-check'}))];
  assert.equal(core.filter(values,{subject:'grammar',query:'ONLY'}).length,1);
  assert.equal(core.filter(values,{query:'段落 75'}).length,1);
  assert.equal(core.filter(values,{kind:'vocabulary',status:'needs-check'}).length,1);
});
test('review schedules move independently from wordbook schedules and skip unverified cards',()=>{
  const state=core.merge(null,pack([entry(),entry('pending',{title:'待核对内容',status:'needs-check'})]),1).state;
  assert.equal(core.due(state.entries,state.review,100).length,1);
  const graded=core.grade(state,'kp-one',true,100);
  assert.equal(graded.review['kp-one'].due,86400100);assert.equal(core.due(graded.entries,graded.review,101).length,0);
  const failed=core.grade(graded,'kp-one',false,200);
  assert.equal(failed.review['kp-one'].due,600200);assert.equal(failed.review['kp-one'].lapses,1);
  assert.equal(state.review['kp-one'],undefined);
});
test('invalid stored knowledge raises rather than silently dropping user content',()=>{
  assert.deepEqual(core.normalizeState(undefined),{entries:[],review:{},imports:[]});
  assert.throws(()=>core.normalizeState({entries:'broken'}));
  assert.throws(()=>core.normalizeState({entries:[entry(),entry()]}));
});
test('imported HTML-like text is escaped and source roles remain explicit',()=>{
  assert.equal(core.escape('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
  const e=core.entry(entry('x',{sources:[{path:'hand-note.md',locator:'第 1 节',role:'reference'}]}));
  assert.equal(e.sources[0].role,'reference');
});
test('all study modules are wired to the static build and private content is ignored',()=>{
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  for(const file of ['study-core.js','study-library.js','study-library.css'])assert.ok(html.includes('/assets/'+file));
  assert.match(html,/knowledge:studyLibraryPage/);assert.match(html,/knowledge:normalizeStudy\(x.knowledge\)/);
  assert.match(fs.readFileSync(path.join(__dirname,'../.gitignore'),'utf8'),/^private-study\/$/m);
});

test('the UI previews before saving, imports on demand and records only revealed recalls',async()=>{
  const vm=require('node:vm'),controls=new Map();let saved=core.normalizeState(null),writes=0;
  function control(selector){if(!controls.has(selector))controls.set(selector,{listeners:{},addEventListener(type,fn){this.listeners[type]=fn;}});return controls.get(selector);}
  const file=control('[data-study-file]');file.files=[{size:100,text:async()=>JSON.stringify(pack())}];
  const node={innerHTML:'',querySelector:control,querySelectorAll(selector){return selector==='[data-study-file]'?[file]:selector==='[data-study-grade]'?[Object.assign(control('grade'),{dataset:{studyGrade:'yes'}})]:[];}};
  const context=vm.createContext({WordlyStudyCore:core,module:{exports:{}},Date,URL,Blob,console});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/study-library.js'),'utf8'),context);
  const ui=context.module.exports;
  ui.configure({getState:()=>saved,setState(next){saved=structuredClone(next);writes++;return true;},notify(){},openBackup(){}});
  ui.mount(node);await file.onchange();
  assert.equal(writes,0);assert.match(node.innerHTML,/正在预览/);assert.match(node.innerHTML,/判断题的证据/);
  control('[data-study-commit]').listeners.click();assert.equal(writes,1);assert.equal(saved.entries.length,1);
  control('[data-study-review]').listeners.click();assert.match(node.innerHTML,/查看答案/);
  control('[data-study-reveal]').listeners.click();assert.match(node.innerHTML,/原解释/);
  control('grade').onclick();assert.equal(writes,2);assert.equal(saved.review['kp-one'].reviews,1);assert.match(node.innerHTML,/这一轮已完成/);
});
