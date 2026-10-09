const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

// Compile actual application functions, without starting the UI or using private user data.
function functionSource(name) {
  const start = html.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `Missing ${name}`);
  for (let end = html.indexOf('}', start); end >= 0; end = html.indexOf('}', end + 1)) {
    const source = html.slice(start, end + 1);
    try { new vm.Script(`(${source})`); return source; } catch {}
  }
  throw Error(`Cannot parse ${name}`);
}
function arraySource(name) {
  return JSON.parse(html.match(new RegExp(`const ${name}=(\\[[^\\n]*\\]);`))[1]);
}
function fixture() {
  const time = 1791330000000;
  return {
    words: [{id:'existing-word', en:'major', zh:'我的专业释义', book:'wang807-public-v1', page:1, created:time, appearances:11, correctCount:4, mastered:true, dismissed:false, example:{en:'My own example.',zh:'我的例句。'}}, {id:'personal-word',en:'my expression',zh:'个人表达',created:time,appearances:3,correctCount:1,mastered:false,dismissed:false}],
    logs: [{id:'old-log',date:time,title:'旧听写',results:[{en:'major',zh:'专业',entered:'majer',correct:false,imported:false}]}],
    mistakes: {major:{en:'major',zh:'专业',errors:3,last:time,addedAt:time}},
    settings:{mode:'audio',feedback:'end',plays:3,interval:4,auto:false,voice:''},
    daily:{'2026-10-06':{writing:true,listening1:true,listening2:false}},
    review:{major:{stage:3,due:time+604800000,last:time,lastDay:'2026-10-06',lapses:2,reviews:7,relearning:false,lastResult:'correct'},'my expression':{stage:1,due:time+172800000,last:time,lastDay:'2026-10-06',lapses:0,reviews:1,relearning:false,lastResult:'correct'}},
    memoryTyping:{major:{copies:6,recalls:4,errors:2,last:time}},
    vocabPractice:{'existing-word':{attempts:8,correct:6,last:time}},
    reading:{listening:{page:7,completed:[1,2,6],assignments:{'2026-10-06':[6,7]}},writing:{page:9,completed:[4,5],assignments:{'2026-10-06':9}}},
    lessonImports:{'first-dictation-2026-10-06':true},
    speaking:{bank:{},drafts:{cue:{notes:'保留口语草稿'}},logs:[{id:'speaking-log',topic:'My study',date:time,duration:87,notes:'旧复盘',next:'再次练习',checks:[true,false]}],custom:null}
  };
}
function app(initial) {
  const memory = new Map([['wordly_app_v1',JSON.stringify(initial)]]);
  const downloads=[];
  const context = vm.createContext({structuredClone,console,Blob,URL:{createObjectURL(blob){downloads.push(blob);return 'blob:test';},revokeObjectURL(){}},setTimeout(){},document:{createElement(){return {click(){}};}},WordlyStudyCore:require('../assets/study-core.js'),WordlyMonthPlan:require('../assets/month-plan-core.js'),localStorage:{getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value)},renderNav(){},toast(){},WANG807:arraySource('WANG807'),FIRST_DICTATION:arraySource('FIRST_DICTATION'),FIRST_LESSON_ID:'first-dictation-2026-10-06',FIRST_LESSON_TIME:1791244800000});
  const names = ['uid','validCalendarDay','safeReviewNumber','normalizeReview','normalizeMemory','normalizeVocabPractice','normalizeListening','normalizeReading','normalizeSpeakingBank','normalizeSpeakingMaterial','normalizeSpeakingMaterials','normalizeSpeakingMaterialDraft','normalizeStudy','normalizeDb','load','save','seed807','seedFirstDictation','migrateReview'];
  if(html.includes('function saveStudyMaterials('))names.push('saveStudyMaterials');
  for(const name of ['restoreLearningBackup','downloadRecoveryBackup','downloadBackup','saveStudyPlan'])if(html.includes(`function ${name}(`))names.push(name);
  vm.runInContext(`let storageReadFailed=false;const KEY='wordly_app_v1';const defaults={words:[],logs:[],mistakes:{},settings:{mode:'meaning',feedback:'instant',plays:2,interval:3,auto:false,voice:''}};${names.map(functionSource).join('\n')}let db=load();`,context);
  return {run:code=>vm.runInContext(code,context),saved:()=>JSON.parse(memory.get('wordly_app_v1')),downloads};
}
test('deployment continues using existing learning and recording storage identities',()=>{
  assert.match(html,/const KEY='wordly_app_v1'/);
  assert.match(html,/indexedDB\.open\('wordly_audio_v1',1\)/);
  assert.doesNotMatch(html,/localStorage\.clear\s*\(|indexedDB\.deleteDatabase\s*\(/);
});
test('compressed large words load, re-save and export as a readable complete backup',async()=>{
  const original=fixture();original.words=Array.from({length:6500},(_,i)=>({id:'private-'+i,en:'word '+i,zh:'我的意思',created:1791330000000+i,appearances:11,correctCount:3,mastered:true,dismissed:false,example:{en:'My edited English example to keep intact '+i,zh:'个人例句'}}));
  const core=require('../assets/study-core.js');original.knowledge=core.normalizeState(null);const stored=core.writeDb(original);assert.equal(stored.words.encoding,'lz-string-utf16-v1');
  const site=app(stored);site.run('save();db=load();downloadBackup(db);');
  const digest=value=>require('node:crypto').createHash('sha256').update(JSON.stringify(value)).digest('hex');
  assert.equal(digest(JSON.parse(site.run('JSON.stringify(db.words)'))),digest(original.words));
  const exported=JSON.parse(await site.downloads[0].text());assert.equal(digest(exported.words),digest(original.words));assert.deepEqual(exported.logs,original.logs);assert.deepEqual(exported.mistakes,original.mistakes);
});
test('old learning records survive loading, saving and another load',()=>{
  const original=fixture(),site=app(original);
  site.run('save();db=load();save();');
  const saved=site.saved();
  for(const field of ['words','logs','mistakes','daily','review','memoryTyping','vocabPractice','reading','lessonImports'])assert.deepEqual(saved[field],original[field],field);
  assert.deepEqual(saved.speaking.drafts,original.speaking.drafts);
  assert.deepEqual(saved.speaking.logs,original.speaking.logs);
});
test('repeated built-in imports keep mastered words, personal examples and existing schedules',()=>{
  const original=fixture(),site=app(original);
  site.run('seed807();seedFirstDictation();migrateReview();save();');
  const first=site.saved();
  site.run('db=load();seed807();seedFirstDictation();migrateReview();save();');
  assert.deepEqual(site.saved(),first);
  assert.deepEqual(first.words.find(w=>w.id==='existing-word'),original.words[0]);
  assert.deepEqual(first.words.find(w=>w.id==='personal-word'),original.words[1]);
  for(const field of ['logs','mistakes','review','memoryTyping','daily','reading'])assert.deepEqual(first[field],original[field],field);
});
test('personal speaking materials and unfinished drafts survive backup restoration and reload',()=>{
  const original=fixture();
  original.speaking.materials=[{id:'spm-course-note',part:2,title:'我的课程题补充',cue:'What did you learn?',keywords:'design, prototype',story:'暑期课程的具体经历',answer:'I learned to solve real problems.',corrections:'industry design → industrial design',next:'补充一个产品例子',tags:'课程，经历',status:'ready',sourceId:'course-impressed',created:1791330000000,updated:1791330100000}];
  original.speaking.materialDraft={id:null,part:3,title:'还没写完的题',cue:'Why is education important?',keywords:'',story:'',answer:'Education helps',corrections:'',next:'',tags:'',status:'draft',sourceId:'',created:0,updated:1791330200000};
  const site=app(original);
  site.run('save();db=load();seed807();seedFirstDictation();migrateReview();save();');
  assert.deepEqual(site.saved().speaking.materials,original.speaking.materials);
  assert.deepEqual(site.saved().speaking.materialDraft,original.speaking.materialDraft);
  for(const field of ['logs','mistakes','review','memoryTyping','daily','reading'])assert.deepEqual(site.saved()[field],original[field],field);
});

test('study knowledge edits, sources and due dates survive backup restoration and seeding',()=>{
  const core=require('../assets/study-core.js'),original=fixture();
  original.knowledge=core.normalizeState({entries:[{id:'kp-existing',title:'我的知识点',categories:['reading'],summary:'自己的解释',example:'My own example.',sources:[{path:'local-note.md',locator:'第 2 节'}]}],review:{'kp-existing':{stage:3,due:1791800000000,last:1791300000000,reviews:7,lapses:2}},imports:[{id:'my-pack',title:'私人整理',date:1791300000000,added:1,merged:0}]});
  const site=app(original);
  site.run('save();db=load();seed807();seedFirstDictation();migrateReview();save();');
  assert.deepEqual(site.saved().knowledge,original.knowledge);
  for(const field of ['logs','mistakes','review','memoryTyping','daily','reading'])assert.deepEqual(site.saved()[field],original[field],field);
});

test('missing study fields in old backups gain empty defaults without changing other learning',()=>{
  const original=fixture(),site=app(original);site.run('save()');
  assert.deepEqual(site.saved().knowledge,{entries:[],review:{},imports:[]});
  assert.deepEqual(site.saved().words,original.words);
});

test('a broken stored record is not overwritten by fallback initialization',()=>{
  const site=app(fixture());site.run("localStorage.setItem(KEY,'{broken');db=load();seed807();seedFirstDictation();migrateReview();save();");
  assert.equal(site.run('localStorage.getItem(KEY)'),'{broken');
  assert.equal(site.run('storageReadFailed'),true);
});

test('study and wordbook imports save together without changing historical progress',()=>{
  assert.ok(html.includes('function saveStudyMaterials('));
  const original=fixture(),site=app(original);
  const baseline=JSON.parse(site.run('JSON.stringify(db)'));
  const pack={schema:'wordly-study-pack',version:1,batch:{id:'new-topics',title:'主题词汇'},entries:[{id:'new-engaging',title:'engaging',kind:'vocabulary',en:'engaging',zh:'吸引人的',categories:['speaking'],sources:[{path:'Movies.docx',locator:'段落 5'}]}]};
  site.run(`const studyPack=${JSON.stringify(pack)};saveStudyMaterials(WordlyStudyCore.merge(db.knowledge,studyPack).state,studyPack);db=load();save();`);
  const saved=site.saved();
  assert.equal(saved.knowledge.entries.length,1);
  assert.equal(saved.words.find(w=>w.en==='engaging').studySources[0].path,'Movies.docx');
  for(const field of ['logs','mistakes','daily','review','memoryTyping','vocabPractice','reading','speaking'])assert.deepEqual(saved[field],baseline[field],field);
  assert.deepEqual(saved.words.slice(0,2),original.words);
  const before=site.run('JSON.stringify(db)');
  site.run('storageReadFailed=true;saveStudyMaterials(WordlyStudyCore.normalizeState(null),studyPack);');
  assert.equal(site.run('JSON.stringify(db)'),before);
});

test('application reloads compact private imports and refuses to overwrite damaged compressed data',()=>{
  const core=require('../assets/study-core.js'),original=fixture();
  original.knowledge={entries:[{id:'big-private',title:'大型私人资料',categories:['grammar'],explanation:'本机资料。'.repeat(2000),sources:[{path:'private.pdf',locator:'第 1 页'}]}],review:{},imports:[]};
  original.words.push(...Array.from({length:600},(_,i)=>({id:'study-bulk-'+i,en:'private word '+i,zh:'个人词条',created:1,appearances:2,correctCount:1,mastered:false,dismissed:false,studySources:[{path:'private.pdf',locator:'第 1 页'}],example:{en:'Example '+i+' '.repeat(1800),zh:'个人例句'}})));
  const site=app(original),baseline=JSON.parse(site.run('JSON.stringify(db)'));
  site.run('save();db=load();');
  assert.equal(site.saved().knowledge.encoding,'lz-string-utf16-v1');
  assert.deepEqual(JSON.parse(site.run('JSON.stringify(db)')),baseline);
  assert.deepEqual(core.readDb(site.saved()),baseline);
  site.run("const damaged=JSON.parse(localStorage.getItem(KEY));damaged.knowledge.data='broken';localStorage.setItem(KEY,JSON.stringify(damaged));db=load();save();");
  assert.equal(site.run('storageReadFailed'),true);
  assert.equal(site.saved().knowledge.data,'broken');
});

test('explicit valid restore recovers a blocked store',()=>{
  const original=fixture(),site=app(original);
  site.run('storageReadFailed=true;db=normalizeDb(defaults);');
  assert.equal(site.run(`restoreLearningBackup(${JSON.stringify(original)})`),true);
  assert.equal(site.run('storageReadFailed'),false);
  assert.deepEqual(site.saved().logs,original.logs);
  assert.deepEqual(site.saved().mistakes,original.mistakes);
});

test('quota failure rolls restore back',()=>{
  const original=fixture(),site=app(original),before=site.run('JSON.stringify(db)');
  site.run('storageReadFailed=true;localStorage.setItem=()=>{throw Error("QuotaExceededError")};');
  assert.equal(site.run(`restoreLearningBackup(${JSON.stringify({...original,logs:[]})})`),false);
  assert.equal(site.run('JSON.stringify(db)'),before);
  assert.equal(site.run('storageReadFailed'),true);
  assert.deepEqual(site.saved(),original);
});

test('recovery export retains malformed original bytes',async()=>{
  const site=app(fixture());
  site.run("localStorage.setItem(KEY,'{broken original');db=load();downloadRecoveryBackup();");
  assert.equal(await site.downloads[0].text(),'{broken original');
  assert.equal(site.run('localStorage.getItem(KEY)'),'{broken original');
});

test('old backups gain an empty month plan without changing history',()=>{
  const original=fixture(),site=app(original);
  assert.equal(site.run('db.studyPlan'),null);
  site.run('save();');
  for(const field of ['words','logs','mistakes','daily','review','reading'])assert.deepEqual(site.saved()[field],original[field]);
});

test('month plan completion survives reload and joint import failure rolls all three states back',()=>{
  const site=app(fixture());
  site.run("const lesson={id:'lesson',title:'阅读知识',categories:['reading'],kind:'knowledge',status:'ready',sources:[{path:'lesson.pdf',locator:'第1页'}]};db.knowledge=WordlyStudyCore.normalizeState({entries:[lesson]});let plan=WordlyMonthPlan.create({entries:[lesson],startDay:'2026-10-09',now:1});plan=WordlyMonthPlan.setTask(plan,plan.days[0].tasks.find(t=>t.subject==='reading').id,{selfReported:true,notes:'原文证据'});saveStudyPlan(plan);db=load();");
  assert.equal(site.saved().studyPlan.days[0].tasks.find(t=>t.subject==='reading').selfReported,true);
  const before=site.run('JSON.stringify(db)');
  site.run("localStorage.setItem=()=>{throw Error('quota')};const incoming={schema:'wordly-study-pack',version:1,batch:{id:'extra',title:'新增'},entries:[{id:'extra',title:'extra',kind:'vocabulary',en:'extra',zh:'额外的',categories:['reading'],sources:[{path:'extra.pdf',locator:'第1页'}]}]};saveStudyMaterials(WordlyStudyCore.merge(db.knowledge,incoming).state,incoming);");
  assert.equal(site.run('JSON.stringify(db)'),before);
});

test('nonexistent evidence cannot count as completed practice',()=>{
  const site=app(fixture());
  site.run("const plan=WordlyMonthPlan.create({entries:[{id:'lesson',title:'知识',kind:'knowledge',status:'ready',categories:['reading']}],startDay:'2026-10-09',now:1});plan.days[0].tasks[0].evidence=[{type:'dictation-log',id:'fake-log'}];");
  assert.equal(site.run('saveStudyPlan(plan)'),false);
  assert.equal(site.run('db.studyPlan'),null);
});

