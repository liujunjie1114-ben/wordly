const test=require('node:test');
const assert=require('node:assert/strict');
const coach=require('../assets/writing-coach.js');
const course=()=>({title:'完整写作课',subtitle:'中英对照',sections:[{id:'start',title:'第一课',html:'<p>完整正文</p>'}]});
test('course validation preserves full lessons and accepts old backups without a course',()=>{
 assert.equal(coach.normalize(null),null);
 assert.deepEqual(coach.normalize(course()),course());
 for(const value of [{...course(),sections:[]},{...course(),sections:[...course().sections,...course().sections]},{...course(),sections:[{id:'../x',title:'课',html:'x'}]},{...course(),sections:[{id:'valid',title:'课',html:'x'.repeat(200001)}]}])assert.throws(()=>coach.normalize(value));
});
test('complete coach packs require valid study material and never accept truncated or duplicate cards',()=>{
 const entry={id:'one',title:'第一条',kind:'knowledge',categories:['writing'],sources:[{path:'personal.md'}]};
 const pack={schema:'wordly-study-pack',version:1,batch:{id:'complete',title:'写作教练'},entries:[entry]};
 assert.equal(coach.validate({...course(),pack}).pack.entries.length,1);
 for(const invalid of [{...pack,version:2},{...pack,entries:[]},{...pack,entries:[entry,entry]}])assert.throws(()=>coach.validate({...course(),pack:invalid}));
});

test('interactive lessons and validated progress survive normalization and old course imports',()=>{
 const lesson={id:'lesson-2026-11-18',title:'11月18日课堂复盘',type:'interactive',html:'<div>trusted fixture</div>'};
 const progress={revision:'nov18-v1',updated:10,state:{family:'priority',rating:'TR',case:'museum',caseOpen:false,paragraph:0,sentence:0,wordGroup:'function',word:2,flipped:true,grammar:0,grammarOpen:false,quiz:1,answers:[1,null],tab:'er-tab-quiz'}};
 const next={...course(),sections:[...course().sections,lesson],lessonProgress:{[lesson.id]:progress}};
 assert.equal(coach.normalize(next).sections[1].type,'interactive');
 assert.deepEqual(coach.normalize(next).lessonProgress,next.lessonProgress);
 assert.equal(coach.mergeCourses(next,course()).sections.length,2);
 assert.deepEqual(coach.mergeCourses(next,course()).lessonProgress,next.lessonProgress);
 assert.equal(coach.mergeCourses(next,next).sections.length,2);
 const refreshed=coach.mergeCourses(next,{...next,sections:[{...lesson,html:'reviewed update'}]});
 assert.equal(refreshed.sections[1].html,'reviewed update');assert.deepEqual(refreshed.lessonProgress,next.lessonProgress);
 for(const bad of [{...lesson,id:'unknown-script'},{...lesson,type:'arbitrary-code'}])assert.throws(()=>coach.normalize({...course(),sections:[bad]}));
 assert.throws(()=>coach.normalize({...next,lessonProgress:{[lesson.id]:{...progress,state:{...progress.state,answers:[999]}}}}));
});

test('lesson progress merges independent lessons and rejects a stale overwrite',()=>{
 const a={revision:'nov18-v1',updated:10,state:{answers:[1],quiz:0}};
 const b={...a,updated:20,state:{answers:[1,0],quiz:1}};
 assert.deepEqual(coach.mergeProgress({one:a},{two:b}),{one:a,two:b});
 assert.deepEqual(coach.mergeProgress({one:b},{one:a}),{one:b});
});
