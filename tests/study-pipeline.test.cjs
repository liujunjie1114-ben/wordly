const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const core=require('../assets/study-core.js');
const item=(id,extra={})=>({id,title:'知识 '+id,kind:'knowledge',categories:['reading'],status:'ready',explanation:'说明 '+id,sources:[{path:'lesson.pdf',locator:'第 1 页',hash:'a'.repeat(64),role:'original'}],...extra});
const pack=entries=>({schema:'wordly-study-pack',version:1,batch:{id:'fixture',title:'合成测试'},entries});
function run(t,inputs,extra={}){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'wordly-pipeline-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  for(const [name,value] of Object.entries(inputs))fs.writeFileSync(path.join(dir,name),JSON.stringify(value));
  fs.writeFileSync(path.join(dir,'input.json'),JSON.stringify({packs:Object.keys(inputs),aliases:{},expectedOriginals:[],...extra}));
  const out=path.join(dir,'output');
  const result=spawnSync(process.env.WORDLY_PYTHON||'python',[path.join(__dirname,'../scripts/compile-study-packs.py'),'--manifest',path.join(dir,'input.json'),'--output',out],{encoding:'utf8'});
  return {result,out,read(){return fs.readdirSync(out).filter(n=>/^pack-\d+\.json$/.test(n)).flatMap(n=>core.readPack(JSON.parse(fs.readFileSync(path.join(out,n),'utf8'))).entries);}};
}
test('bounded batches remain importable',t=>{
  const r=run(t,{'a.json':pack(Array.from({length:900},(_,i)=>item('one-'+i))),'b.json':pack(Array.from({length:101},(_,i)=>item('two-'+i)))});
  assert.equal(r.result.status,0,r.result.stderr);
  assert.equal(r.read().length,1001);
  const names=fs.readdirSync(r.out).filter(n=>/^pack-\d+\.json$/.test(n));
  assert.ok(names.length>=2);
  for(const n of names){const raw=fs.readFileSync(path.join(r.out,n));assert.ok(raw.length<=5*1024*1024);assert.ok(JSON.parse(raw).entries.length<=1000);}
});
test('same English keeps distinct senses',t=>{
  const r=run(t,{'a.json':pack([item('bank-1',{kind:'vocabulary',en:'bank',zh:'银行'}),item('bank-2',{kind:'vocabulary',en:'bank',zh:'河岸'})])});
  assert.equal(r.result.status,0,r.result.stderr);assert.equal(r.read().length,2);
});
test('same knowledge title with different explanations remains distinct in the real importer',t=>{
  const r=run(t,{'a.json':pack([item('a',{title:'情态动词'}),item('b',{title:'情态动词',explanation:'纠正OCR，不是教师原文错误'})])});
  assert.equal(r.result.status,0,r.result.stderr);const entries=r.read();
  assert.equal(core.merge(null,pack(entries)).state.entries.length,2);
});
test('overflow provenance stays on separate importable source cards, never silently truncated',t=>{
  const many=(prefix)=>Array.from({length:70},(_,i)=>({path:'lesson.pdf',locator:prefix+i,hash:'a'.repeat(64)}));
  const r=run(t,{'a.json':pack([item('a',{title:'same',explanation:'same',sources:many('a')}),item('b',{title:'same',explanation:'same',sources:many('b')})])});
  assert.equal(r.result.status,0,r.result.stderr);const entries=r.read(),state=core.merge(null,pack(entries)).state;
  assert.equal(state.entries.length,2);assert.equal(state.entries.flatMap(e=>e.sources).length,140);
});
test('aliases merge all provenance without changing originals',t=>{
  const a=item('a'),b=item('b',{sources:[{path:'other.docx',locator:'段落 5',hash:'b'.repeat(64),role:'original'}]});
  const r=run(t,{'a.json':pack([a,b])},{aliases:{b:'a'}});
  assert.equal(r.result.status,0,r.result.stderr);const entries=r.read();assert.equal(entries.length,1);assert.equal(entries[0].sources.length,2);assert.equal(entries[0].explanation,'说明 a');
});
test('unreviewed OCR candidate is not a pack',t=>{
  const r=run(t,{'candidate.json':{candidates:[item('a')]}});assert.notEqual(r.result.status,0);assert.ok(!fs.existsSync(r.out));
});
test('missing or conflicting input fails without partial output',t=>{
  const r=run(t,{'a.json':pack([item('a')]),'b.json':pack([item('a',{explanation:'不同知识'})])});assert.notEqual(r.result.status,0);assert.ok(!fs.existsSync(r.out));
  const missing=run(t,{}, {packs:['absent.json']});assert.notEqual(missing.result.status,0);
  const escape=run(t,{}, {packs:['../outside.json']});assert.notEqual(escape.result.status,0);
});
