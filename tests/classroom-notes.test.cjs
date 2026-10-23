const test=require('node:test');
const assert=require('node:assert/strict');
const notes=require('../assets/classroom-notes.js');
const entry=(id,path,title,explanation,subject='reading')=>({id,title,kind:'knowledge',categories:[subject],status:'ready',sources:[{path,locator:'原文'}],explanation,summary:'',application:'',example:'',pitfalls:'',original:'',correction:'',practice:'',question:''});
test('course archive separates classroom notes from handouts and retains exact source paths',()=>{
 const entries=[entry('a','笔记/阅读第二次课.md','阅读第二次课｜00. 课程说明','# 目录'),entry('b','笔记/阅读第二次课.md','阅读第二次课｜01. 规则','正文'),entry('c','讲义/强化-阅读-Lesson 1.pdf','定位方法','摘录')];
 const archive=notes.catalog(entries,'reading');assert.equal(archive.courses.length,1);assert.equal(archive.courses[0].count,2);assert.equal(archive.courses[0].path,'笔记/阅读第二次课.md');assert.equal(archive.handouts.length,1);
});
test('writing shows recovered classes alongside the existing October 17 note without inventing attendance',()=>{
 const entries=[entry('x','写作课堂_2026-10-16_饼图.md','课程说明','练习','writing'),entry('y','写作第三次课_2026-10-21_地图.md','课程说明','仅找回课程末段','writing')];
 const archive=notes.catalog(entries,'writing');assert.equal(archive.courses.length,3);assert.deepEqual(archive.courses.map(x=>x.date),['2026-10-21','2026-10-17','2026-10-16']);assert.equal(archive.courses[1].href,'./assets/writing-lesson-2026-10-17.html');
});
test('whole-class reader includes every chapter in numeric order and escapes uploaded HTML',()=>{
 const entries=[entry('b','阅读第二次课.md','阅读第二次课｜10. 后文','# 10. 后文\n<script>bad</script>'),entry('a','阅读第二次课.md','阅读第二次课｜02. 前文','# 02. 前文\n| A | B |\n|---|---|\n| x | y |')];
 const before=JSON.stringify(entries),html=notes.renderCourse(entries,'阅读第二次课.md');assert.ok(html.indexOf('02. 前文')<html.indexOf('10. 后文'));assert.match(html,/<table>/);assert.doesNotMatch(html,/<script>/);assert.match(html,/&lt;script&gt;/);assert.equal(JSON.stringify(entries),before);
});
test('reading and writing hubs expose course archives without saving or embedding personal text in public assets',()=>{
 const dashboard=require('../assets/study-dashboard.js');const data={knowledge:{entries:[entry('x','阅读第二次课.md','课笔记','SECRET_PRIVATE_TEXT')],review:{}}};let writes=0;dashboard.configure({getDb:()=>data,savePlan:()=>{writes++;return true;}});
 const html=dashboard.subjectMarkup('reading');assert.match(html,/阅读课堂复盘/);assert.match(html,/data-sd-course-source=/);assert.doesNotMatch(html,/SECRET_PRIVATE_TEXT/);assert.equal(writes,0);
 assert.match(dashboard.subjectMarkup('writing'),/写作课堂复盘/);
});
test('course links open a continuous reader without marking every chapter learned',()=>{
 const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),core=require('../assets/study-core.js');
 let state=core.normalizeState({entries:[entry('a','阅读第二次课.md','阅读第二次课｜01. 第一节','# 第一节\n第一节正文'),entry('b','阅读第二次课.md','阅读第二次课｜02. 第二节','# 第二节\n第二节正文')],review:{},imports:[]});
 const original=JSON.stringify(state.entries),ctx=vm.createContext({WordlyStudyCore:core,WordlyClassroomNotes:notes,module:{exports:{}},Date,URL,console});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/study-library.js'),'utf8'),ctx);const ui=ctx.module.exports;
 ui.configure({getState:()=>state,setState:next=>{state=next;return true;},notify(){}});const node={innerHTML:'',querySelector:()=>null,querySelectorAll:()=>[]};ui.mount(node);ui.open({sourcePath:'阅读第二次课.md',view:'course'});
 assert.match(node.innerHTML,/classroom-reader/);assert.match(node.innerHTML,/第一节正文/);assert.match(node.innerHTML,/第二节正文/);assert.equal(JSON.stringify(state.entries),original);assert.deepEqual(state.review,{});assert.equal(Object.keys(state.learning||{}).length,0);
});
