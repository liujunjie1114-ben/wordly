const test=require('node:test'),assert=require('node:assert/strict');
const tasks=require('../assets/word-tasks.js'),core=require('../assets/study-core.js');
const vocab=(id,extra={})=>({id,kind:'vocabulary',title:id,categories:['reading'],status:'ready',en:'word '+id,zh:'释义 '+id,sources:[{path:'C:/lessons/notes.docx',locator:'1'}],...extra});

test('task learning shows both languages in teacher order, pages long lists and does not grade',()=>{
 const entries=Array.from({length:25},(_,i)=>vocab('v'+i)),task={id:'task',title:'阅读任务',items:entries.map((e,i)=>({key:'r-'+i,entryId:e.id,label:'第'+(i+51)+'词'}))};
 const before=structuredClone(entries),html=tasks.learningMarkup(task,entries,{page:0});
 assert.match(html,/word v0/);assert.match(html,/释义 v0/);assert.doesNotMatch(html,/word v20/);
 assert.match(tasks.learningMarkup(task,entries,{page:1}),/word v24/);
 assert.doesNotMatch(tasks.learningMarkup(task,entries,{hidden:'meaning'}),/释义 v0/);
 assert.match(tasks.learningMarkup(task,entries,{hidden:'meaning'}),/word v0/);
 assert.match(html,/看过不计入自测成绩/);assert.deepEqual(entries,before);
 assert.equal(tasks.summary(task,{tasks:{}},entries).attempted,0);
 const missing=tasks.learningMarkup({...task,items:[{key:'missing',entryId:'absent',label:'第1词'}]},[],{});
 assert.match(missing,/未导入/);assert.doesNotMatch(missing,/data-wt-learn-play/);
});

test('source shelf groups imported documents by full path, preserving all file types and exact filters',()=>{
 const entries=[vocab('one'),vocab('two',{sources:[{path:'C:/lessons/notes.docx',locator:'2'},{path:'C:/lessons/notes.docx',locator:'3'},{path:'C:/pdf/book.pdf',locator:'1'}]}),vocab('three',{kind:'knowledge',en:'',zh:'',sources:[{path:'D:/other/notes.docx',locator:'1'}]})];
 const before=structuredClone(entries),books=core.sourceCatalog(entries);
 assert.equal(books.length,3);assert.equal(books.find(b=>b.path==='C:/lessons/notes.docx').total,2);
 assert.equal(books.filter(b=>b.type==='Word').length,2);
 assert.deepEqual(core.filter(entries,{source:'C:/lessons/notes.docx'}).map(e=>e.id),['one','two']);
 assert.deepEqual(core.filter(entries,{source:'D:/other/notes.docx'}).map(e=>e.id),['three']);
 assert.deepEqual(entries,before);
 const state=core.normalizeState({entries,review:{}}),next=core.setLibraryView(state,{source:'D:/other/notes.docx'},1);
 assert.equal(core.normalizeState(next).libraryView.source,'D:/other/notes.docx');
 assert.deepEqual(core.normalizeState(next).entries,state.entries);
});

test('file shelf and file-specific list open without marking documents or words mastered',()=>{
 const library=require('../assets/study-library.js');let state=core.normalizeState({entries:[vocab('word'),vocab('other',{sources:[{path:'other.pdf',locator:'1'}]})]});
 library.configure({getState:()=>state,setState:next=>{state=next;return true;},notify(){}});
 const node={innerHTML:'',querySelectorAll:()=>[],querySelector:()=>null};
 library.open({view:'sources'});library.mount(node);assert.match(node.innerHTML,/我的资料书架/);assert.match(node.innerHTML,/notes.docx/);
 library.open({sourcePath:'C:/lessons/notes.docx'});assert.match(node.innerHTML,/data-study-open="word"/);assert.doesNotMatch(node.innerHTML,/data-study-open="other"/);
 assert.equal(state.libraryView.source,'C:/lessons/notes.docx');
 assert.deepEqual(state.review,{});assert.equal(state.learning,undefined);
 assert.throws(()=>library.open({sourcePath:'absent.docx'}),/来源/);
});
