const test=require('node:test');
const assert=require('node:assert/strict');
const review=require('../assets/card-review.js');
const card={id:'cause',kind:'knowledge',title:'因果方向',question:'result in / from 如何区分？',summary:'原因 result in 结果；结果 result from 原因。',original:'Poor planning resulted in delays.',explanation:'先确定句子中的原因与结果。',example:'Delays resulted from poor planning.',pitfalls:'不能只背介词，忽略主语。',correction:'contribute to 不表示唯一原因。',application:'阅读定位与写作因果解释',practice:'交换主语重写例句。',status:'ready',sources:[{path:'私人/课堂.md',locator:'第2页'}]};
test('every field remains available and original evidence is distinguished from commentary',()=>{
 const before=structuredClone(card),v=review.analyze(card),html=review.card(card);
 assert.equal(v.sourceKind,'original');assert.equal(v.source,card.original);assert.equal(v.answer,card.summary);
 for(const field of ['summary','original','explanation','example','pitfalls','correction','application','practice'])assert.ok(html.includes(card[field]));
 assert.deepEqual(card,before);assert.match(html,/BACK TO THE SOURCE/);assert.match(html,/ANSWER &amp; EVIDENCE/);
});
test('sparse vocabulary and unverified cards never fabricate source text, examples or grading',()=>{
 const e={id:'word',kind:'vocabulary',en:'advice',zh:'建议',title:'advice',status:'needs-check',sources:[]};
 const v=review.analyze(e),h=review.card(e);assert.equal(v.sourceKind,'notes');assert.equal(v.answer,'建议');
 assert.match(h,/待核对/);assert.match(h,/整理笔记/);assert.match(h,/未提供/);assert.doesNotMatch(h,/本题答案句已自动定位|已掌握|已过关/);
});
test('recall conceals both source and answer until explicitly revealed, preserving escaped content',()=>{
 const e={...card,original:'SECRET ORIGINAL',summary:'SECRET ANSWER',title:'<img src=x onerror=alert(1)>'};
 const hidden=review.card(e,{concealed:true});assert.doesNotMatch(hidden,/SECRET ORIGINAL|SECRET ANSWER|<img/);
 assert.doesNotMatch(hidden,/&lt;img/);const h=review.card(e);assert.match(h,/&lt;img/);assert.match(h,/SECRET ORIGINAL/);assert.match(h,/SECRET ANSWER/);
});
test('large navigation is bounded but neighbours cover the complete filtered sequence',()=>{
 const entries=Array.from({length:12886},(_,i)=>({...card,id:'entry-'+i}));
 const n=review.navigation(entries,'entry-6000');assert.equal(n.total,12886);assert.equal(n.previous,'entry-5999');assert.equal(n.next,'entry-6001');assert.ok(n.items.length<=16);assert.ok(n.items.some(e=>e.id==='entry-6000'));
 assert.equal(review.navigation(entries,'entry-0').previous,null);assert.equal(review.navigation(entries,'entry-12885').next,null);
});
test('quiz review preserves first errors and latest correction without mixing quiz versions',()=>{
 const quiz={id:'q',version:2,questions:[{id:'in',type:'fill',prompt:'result ___ delays',answers:['in'],explanation:'主语是原因。'}]};
 const attempts=[{quizId:'q',version:1,results:[{id:'in',entered:'old',correct:true}]},{quizId:'q',version:2,results:[{id:'in',entered:'from',correct:false}]},{quizId:'q',version:2,results:[{id:'in',entered:'in',correct:true}]}];
 const v=review.quizResults(quiz,attempts);assert.equal(v[0].first.entered,'from');assert.equal(v[0].latest.entered,'in');assert.equal(v[0].count,2);assert.deepEqual(review.quizResults({...quiz,version:3},attempts)[0].first,null);
});
test('vocabulary keeps the translation and a separate summary rather than silently dropping either',()=>{
 const e={...card,kind:'vocabulary',en:'advice',zh:'建议',summary:'不可数名词，计数用 a piece of advice。'};
 const h=review.card(e);assert.match(h,/建议/);assert.ok(h.includes(e.summary));
});
test('real library opens all card kinds with split review and preserves grades, drafts and source filters',()=>{
 const vm=require('node:vm'),fs=require('node:fs'),core=require('../assets/study-core.js');
 let state=core.normalizeState({entries:[{...card,categories:['writing'],tags:[]},{...card,id:'second',kind:'vocabulary',en:'result',zh:'结果',categories:['reading'],tags:[]}],review:{cause:{stage:2,last:10,due:900,reviews:2,lapses:0}}});
 const reviewBefore=structuredClone(state.review),node={innerHTML:'',querySelector:()=>null,querySelectorAll:()=>[]};
 const c=vm.createContext({WordlyStudyCore:core,WordlyCardReview:review,module:{exports:{}},Date,URL,Blob,console});
 vm.runInContext(fs.readFileSync(require.resolve('../assets/study-library.js'),'utf8'),c);const ui=c.module.exports;
 ui.configure({getState:()=>state,setState(next){state=next;return true;},notify(){}});
 ui.open({entryId:'cause',subject:'writing',kind:'knowledge'});ui.mount(node);
 assert.match(node.innerHTML,/cr-spread/);assert.match(node.innerHTML,/逐卡复盘/);assert.deepEqual(state.review,reviewBefore);assert.equal(state.libraryView.lastId,'cause');
 ui.open({entryId:'second',subject:'reading',kind:'vocabulary'});assert.match(node.innerHTML,/WORD &amp; USAGE/);assert.deepEqual(state.review,reviewBefore);
});
