const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
test('Chapter 6 replaces only its pending ranges with Test 1 through 10',()=>{
 const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/teacher-word-tasks.js'),'utf8'),context);
 const tasks=context.window.WordlyTeacherTasks;
 for(const [day,tests] of [['2026-10-29',[1]],['2026-10-30',[2,3]],['2026-11-02',[4,5]],['2026-11-03',[6,7]],['2026-11-04',[8,9]],['2026-11-05',[10]]]){
  const task=tasks.find(t=>t.day===day&&t.subject==='listening');
  assert.equal(task.pendingSource,false,day);
  assert.deepEqual(Array.from(task.audioRefs,a=>a.test),tests);
  assert.ok(task.items.some(i=>i.entryId.startsWith('teacher-ch6-')));
  assert.ok(!task.items.some(i=>i.key==='pending-chapter6'));
 }
 const on29=tasks.find(t=>t.day==='2026-10-29'&&t.subject==='listening');
 assert.ok(on29.items.some(i=>i.key==='l-ch5-39-1'),'Chapter 5 Test 12 remains');
 const on5=tasks.find(t=>t.day==='2026-11-05'&&t.subject==='listening');
 assert.ok(on5.libraryIds.length,'Number training remains');
});
test('public Chapter 6 data contains source references, never private vocabulary or media',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/teacher-chapter6-task-items.json'),'utf8'));
 assert.deepEqual(manifest.tests.map(t=>t.items.length),[163,153,95,127,124,102,82,64,94,38]);
 assert.equal(manifest.tests.reduce((n,t)=>n+t.items.length,0),1042);
 assert.equal(manifest.tests.flatMap(t=>t.items).filter(i=>i.optional).length,21);
 assert.doesNotMatch(JSON.stringify(manifest),/"(?:en|zh|entered|answer|blob|base64)"\s*:/);
});
test('teacher audio import rejects duplicate tests and invalid names before saving',()=>{
 const audio=require('../assets/teacher-audio.js');
 assert.equal(audio.trackKey('01 Cambridge 1-横向测试.mp3'),'chapter6-test-1');
 assert.equal(audio.trackKey('10 Cambridge 10-横向测试.mp3'),'chapter6-test-10');
 assert.equal(audio.trackKey('03 Cambridge 4-横向测试.mp3'),null);
 assert.equal(audio.trackKey('chapter 6文档.pdf'),null);
 const one={name:'01 Cambridge 1-横向测试.mp3',size:15326145,type:'audio/mpeg'};
 assert.throws(()=>audio.planFiles([one,one]),/重复/);
 assert.throws(()=>audio.planFiles([{...one,size:0}]),/空/);
 assert.equal(audio.planFiles([one])[0].key,'chapter6-test-1');
});
