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
