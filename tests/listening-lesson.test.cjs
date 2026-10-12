const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
test('lesson renderer keeps numbered anchors stable across Q subheadings, fences and tables',async()=>{
  const {renderLesson}=await import('../scripts/build-listening-lesson.mjs');
  const result=renderLesson('# Title\n\n# 15. Research\n# Q21｜Why?\n\n```text\n<answer>\n**literal**\n```\n\n# 27. Training\n\n| A | B |\n|---|---|\n| source | answer |\n\n# 29. Summary');
  assert.deepEqual(result.toc.map(h=>h.id),['lesson-title','section-15','section-27','section-29']);
  assert.match(result.html,/<h3>Q21｜Why\?<\/h3>/);
  assert.match(result.html,/<pre><code>&lt;answer&gt;\n\*\*literal\*\*<\/code><\/pre>/);
  assert.match(result.html,/<th scope="col">A<\/th>/);
  assert.match(result.html,/<td>answer<\/td>/);
  assert.throws(()=>renderLesson('```text\nunclosed'),/Unclosed/);
});
test('uploaded text is inert, and complete chapter anchors match the navigation',async()=>{
  const {renderLesson}=await import('../scripts/build-listening-lesson.mjs');
  assert.doesNotMatch(renderLesson('# Title\n<script>alert(1)</script>\n<img onerror="bad()">').html,/<script>|<img/);
  const source=fs.readFileSync(path.join(__dirname,'../assets/listening-lesson-2026-10-12.md'),'utf8');
  const result=renderLesson(source);
  assert.deepEqual(result.toc.slice(1).map(h=>h.id),Array.from({length:30},(_,i)=>'section-'+i));
  const html=fs.readFileSync(path.join(__dirname,'../assets/listening-lesson-2026-10-12.html'),'utf8');
  for(const [,id] of html.matchAll(/href="#([^"]+)"/g))assert.ok(html.includes('id="'+id+'"'),'missing anchor '+id);
  for(const text of ['portraits','photographs','Bunk Room','Games Room','Crossword','Film Festival','70分钟','一页速记版'])assert.ok(result.html.includes(text),'missing '+text);
});
test('classroom links appear on home and listening hubs without writing learning data',()=>{
  const dashboard=require('../assets/study-dashboard.js');let writes=0;
  const data={knowledge:{entries:[],review:{}},words:[],logs:[],mistakes:{},speaking:{logs:[]},studyPlan:null};
  const before=JSON.stringify(data);dashboard.configure({getDb:()=>data,savePlan:()=>{writes++;return true;}});
  assert.match(dashboard.homeMarkup(),/listening-lesson-2026-10-12.html/);
  assert.match(dashboard.subjectMarkup('listening'),/listening-lesson-2026-10-12.html/);
  assert.doesNotMatch(dashboard.subjectMarkup('reading'),/listening-lesson-2026-10-12.html/);
  assert.match(dashboard.listeningLessonMarkup(),/target="_blank" rel="noopener"/);
  assert.equal(writes,0);assert.equal(JSON.stringify(data),before);
});
test('both older lessons retain all sections and use H2 chapter anchors with H3 subsections',async()=>{
  const {renderLesson,lessons}=await import('../scripts/build-listening-lesson.mjs');
  for(const lesson of lessons.slice(1)){
    const source=fs.readFileSync(path.join(__dirname,'../assets/listening-lesson-'+lesson.date+'.md'),'utf8');
    const result=renderLesson(source,lesson);
    assert.deepEqual(result.toc.slice(1).map(h=>h.id),Array.from({length:9},(_,i)=>'section-'+(i+1)));
    const html=fs.readFileSync(path.join(__dirname,'../assets/listening-lesson-'+lesson.date+'.html'),'utf8');
    for(const [,id] of html.matchAll(/href="#([^"]+)"/g))assert.ok(html.includes('id="'+id+'"'),'missing '+lesson.date+' '+id);
    assert.match(html,/历史课堂归档/);
    assert.match(html,/下载原始笔记/);
    assert.ok(result.html.includes(lesson.date==='2026-10-07'?'拼写、单复数、字数与单位逐项检查。':'本文件仅作为第一周执行方案。'),'missing ending');
    assert.match(result.html,/<h3>/);
  }
});
test('archive, all reading pages and dashboard link to every lesson using static paths',async()=>{
  const {lessons}=await import('../scripts/build-listening-lesson.mjs');
  const dashboard=require('../assets/study-dashboard.js').listeningLessonMarkup();
  const catalog=fs.readFileSync(path.join(__dirname,'../assets/listening-lessons.html'),'utf8');
  for(const lesson of lessons){
    const name='listening-lesson-'+lesson.date+'.html';
    assert.ok(dashboard.includes(name));assert.ok(catalog.includes(name));
    const html=fs.readFileSync(path.join(__dirname,'../assets',name),'utf8');
    assert.match(html,/href="listening-lessons.html"/);
    for(const other of lessons.filter(l=>l.date!==lesson.date))assert.ok(html.includes('listening-lesson-'+other.date+'.html'));
    assert.doesNotMatch(html,/<script\b|localStorage|indexedDB/);
  }
});
