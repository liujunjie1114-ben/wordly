// Local-only content audit. Writes summaries to private-study, never into public assets.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const review=require('../assets/card-review.js');
const backup=process.argv[2];if(!backup)throw Error('Provide a local Wordly backup path.');
const db=JSON.parse(fs.readFileSync(backup,'utf8').replace(/^\uFEFF/,'')),entries=db.knowledge?.entries;
if(!Array.isArray(entries))throw Error('Readable knowledge.entries required.');
const rows=[],counts={total:entries.length,knowledge:0,vocabulary:0,original:0,notes:0,pending:0,withExample:0,withPractice:0};
for(const e of entries){
 const before=JSON.stringify(e),v=review.analyze(e),html=review.card(e);
 assert.equal(JSON.stringify(e),before);assert.ok(html.includes('cr-spread'));assert.ok(html.includes(review.analyze(e).pending?'待核对':'自主对照'));
 for(const key of ['original','summary','explanation','application','example','pitfalls','correction','practice','en','zh','pos','collocations']){
   if(typeof e[key]==='string'&&e[key].trim()){
     const escaped=e[key].trim().replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
     // Vocabulary summary may supplement a separate translation; checked below.
     assert.ok(html.includes(escaped),e.id+': missing '+key);
   }
 }
 counts[e.kind]++;counts[v.sourceKind==='original'?'original':'notes']++;if(v.pending)counts.pending++;if(v.example)counts.withExample++;if(v.practice)counts.withPractice++;
 rows.push({id:e.id,title:e.title,kind:e.kind,status:e.status,sourceKind:v.sourceKind,hasConclusion:!!v.answer,gaps:['original','example','practice','pitfalls'].filter(k=>!e[k]?.trim()),sourceCount:v.sources.length});
}
const dir=path.resolve(__dirname,'../private-study/card-review-2026-11-05');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'coverage.json'),JSON.stringify({counts,cards:rows},null,2));
fs.writeFileSync(path.join(dir,'report.md'),'# 逐卡展示核对\n\n逐条检查备份中的内容字段、转义、原文/笔记标记和只读渲染；不等于已对每条资料完成外部事实核验。\n\n```json\n'+JSON.stringify(counts,null,2)+'\n```\n\n缺失字段保留提示，不生成冒充原文的内容。全部正文与原学习记录保持原结构。\n');
console.log(JSON.stringify(counts));
