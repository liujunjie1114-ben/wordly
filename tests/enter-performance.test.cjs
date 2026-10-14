const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const lz=require('../assets/lz-string.js');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
function freshCore(){
  const compressed=[];
  const ctx=vm.createContext({module:{exports:{}},TextEncoder,structuredClone,require:()=>({...lz,compressToUTF16(raw){compressed.push(raw);return lz.compressToUTF16(raw);}})});
  vm.runInContext(fs.readFileSync(path.join(root,'assets/study-core.js'),'utf8'),ctx);
  return {core:ctx.module.exports,compressed};
}
function fixture(){return {words:Array.from({length:4200},(_,i)=>({id:'sample-'+i,en:'sample word '+i,zh:'Synthetic definition. '.repeat(12),appearances:i%5,correctCount:i%3,mastered:false,dismissed:false,studySources:[{path:'Synthetic source '+i,locator:'1'}]})),knowledge:{entries:Array.from({length:90},(_,i)=>({id:'kp-'+i,title:'Synthetic '+i,original:'Synthetic note. '.repeat(700)})),review:{},learning:{},libraryView:{}},memoryTyping:{},review:{},mistakes:{},logs:[],settings:{},wordTasks:{tasks:{}}};}

test('Enter saves changed progress without recompressing unchanged dictionary or notes',()=>{
  const {core,compressed}=freshCore(),db=fixture();let stored=core.writeDb(db);
  for(let i=0;i<3;i++){
    db.words[i].appearances++;db.words[i].correctCount++;db.memoryTyping['word-'+i]={copies:1,recalls:1,errors:0,last:i+1};
    compressed.length=0;stored=core.writeDb(db);
    assert.equal(compressed.some(raw=>raw.includes('"zh":')||raw.includes('"original":')||raw.includes('"studySources":')),false,'unchanged content must stay compressed');
    assert.deepEqual(JSON.parse(JSON.stringify(core.readDb(stored))),db);
  }
  const next=freshCore(),reloaded=next.core.readDb(JSON.parse(JSON.stringify(stored)));next.compressed.length=0;
  reloaded.words[4].appearances++;next.core.writeDb(reloaded);
  assert.equal(next.compressed.some(raw=>raw.includes('"zh":')||raw.includes('"original":')),false,'reload must prime the stable content cache');
});

test('split progress rejects mismatched words, duplicate rows and content-overwrite fields',()=>{
  const {core}=freshCore(),stored=core.writeDb(fixture());assert.ok(stored.studyWordProgress);
  for(const rows of [[[0,'wrong-id',1,9]],[[0,'sample-0',16,'overwrite']],[[0,'sample-0',1,1],[0,'sample-0',1,2]],[[0,'sample-0',4,'yes']]]){
    assert.throws(()=>core.readDb({...stored,studyWordProgress:rows}),/进度/);
  }
});

test('practice-only saves reuse validated stored content and preserve all unrelated learning',()=>{
  const {core,compressed}=freshCore(),db=fixture();
  db.daily={'2026-10-14':{writing:true}};db.speaking={drafts:{topic:{notes:'Synthetic draft'}}};
  let stored=core.writeDb(db);assert.equal(typeof core.writeProgressDb,'function');
  db.words[0].appearances++;db.words[0].correctCount++;db.review[db.words[0].en]={stage:2,due:999};
  db.mistakes[db.words[1].en]={errors:3};db.memoryTyping[db.words[0].en]={copies:1,recalls:2,errors:0,last:3};
  compressed.length=0;stored=core.writeProgressDb(db,JSON.parse(JSON.stringify(stored)));
  assert.equal(compressed.length,0,'one changed word should not recompress even the complete progress table');
  assert.deepEqual(JSON.parse(JSON.stringify(core.readDb(stored))),db);
  db.words[1].appearances++;db.words[1].correctCount++;
  stored=core.writeProgressDb(db,stored);
  const fresh=freshCore();
  assert.deepEqual(JSON.parse(JSON.stringify(fresh.core.readDb(stored))),db,'multiple answers survive a cold reload');
  const folded=core.readDb(core.writeDb(core.readDb(stored)));
  assert.deepEqual(JSON.parse(JSON.stringify(folded)),db,'a complete save folds practice changes');
  for(const changes of [[[0,'wrong-id',1,9]],[[0,'sample-0',4,'yes']],[[0,'sample-0',1,1],[0,'sample-0',1,2]]])assert.throws(()=>core.readDb({...stored,studyWordProgressChanges:changes}),/进度/);
  assert.throws(()=>core.readDb({words:db.words,studyWordProgressChanges:[]}),/快照/);
  const reordered=structuredClone(db);reordered.words.reverse();
  assert.deepEqual(JSON.parse(JSON.stringify(core.readDb(core.writeProgressDb(reordered,stored)))),reordered);
});

test('the first practice save of a legacy packed library does not recompress its content',()=>{
  const {core,compressed}=freshCore(),db=fixture();
  const raw=JSON.stringify(db.words);let hash=2166136261;for(let i=0;i<raw.length;i++)hash=Math.imul(hash^raw.charCodeAt(i),16777619);
  const legacy={...db,words:{encoding:'lz-string-utf16-v1',length:raw.length,checksum:(hash>>>0).toString(16),data:lz.compressToUTF16(raw)}};
  const loaded=core.readDb(legacy);loaded.words[0].appearances++;
  compressed.length=0;
  const stored=core.writeProgressDb(loaded,legacy);
  assert.equal(compressed.some(raw=>raw.includes('"zh":')||raw.includes('"original":')||raw.includes('"studySources":')),false);
  assert.deepEqual(JSON.parse(JSON.stringify(core.readDb(stored))),JSON.parse(JSON.stringify(loaded)));
});

function source(name){const p=html.indexOf('function '+name+'(');assert.ok(p>=0);for(let e=html.indexOf('}',p);e>=0;e=html.indexOf('}',e+1)){const s=html.slice(p,e+1);try{new vm.Script('('+s+')');return s;}catch{}}throw Error(name);}
for(const correct of [true,false])test('a scored word persists once with its counters, mistakes and review together: '+correct,()=>{
  const word={en:'test',zh:'测试',correctCount:2,appearances:2,mastered:false,dismissed:false},snapshots=[];
  const ctx=vm.createContext({db:{words:[word],mistakes:{test:{errors:1}},review:{}},Date,save(){snapshots.push(JSON.parse(JSON.stringify(ctx.db)));return true;},scheduleWordReview(w,c){ctx.db.review[w.en]={lastResult:c?'correct':'wrong'};}});
  vm.runInContext(['updateWordProgress','addMistake','removeMistake'].map(source).join('\n')+';updateWordProgress(db.words[0],'+correct+');',ctx);
  assert.equal(snapshots.length,1);assert.equal(snapshots[0].words[0].appearances,3);
  assert.equal(snapshots[0].words[0].correctCount,correct?3:0);
  assert.equal(snapshots[0].review.test.lastResult,correct?'correct':'wrong');
});
