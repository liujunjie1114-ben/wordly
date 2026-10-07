const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const library=require('../assets/speaking-library.js');
test('all built-in materials point to complete local course pages',()=>{
  assert.ok(library.builtins.length>=1);
  for(const entry of library.builtins){
    assert.match(entry.file,/^[\w-]+\.html$/);
    const html=fs.readFileSync(path.join(__dirname,'../assets',entry.file),'utf8');
    assert.match(html,/<title>.+<\/title>/);
    if(entry.id==='course-impressed'){
      assert.match(html,/稳定版答案/);
      assert.match(html,/高频错误/);
    }
  }
});
test('search and Part filters work across built-in and personal practice',()=>{
  const entries=[...library.builtins,{id:'spm-one',part:3,title:'教育的价值',keywords:'learning',answer:'Education opens new possibilities.'}];
  assert.ok(library.filterEntries(entries,{part:2,query:'industrial'}).some(e=>e.id==='course-impressed'));
  assert.ok(library.filterEntries(entries,{part:3,query:'EDUCATION'}).some(e=>e.id==='spm-one'));
  assert.equal(library.filterEntries(entries,{part:1,query:''}).length,28);
});
test('editing one practice keeps its creation date and all other saved entries',()=>{
  const existing=[{id:'spm-one',title:'旧题',created:10,updated:20,answer:'旧答案'},{id:'spm-two',title:'另一题',created:12,answer:'不要覆盖'}];
  const result=library.upsertEntry(existing,{id:'spm-one',title:'修改后',created:99,updated:30,answer:'新答案'});
  assert.equal(result.length,2);
  assert.equal(result[0].created,10);
  assert.equal(result[0].answer,'新答案');
  assert.deepEqual(result[1],existing[1]);
  assert.equal(existing[0].answer,'旧答案');
  assert.throws(()=>library.upsertEntry(existing,{id:'spm-new',title:'  '}));
});
test('personal answers and corrections render as text, including HTML-like input',()=>{
  assert.equal(library.escape('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
  assert.equal(library.escape('a & b'), 'a &amp; b');
});
