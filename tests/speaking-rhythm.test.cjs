const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const coach=require('../assets/speaking-coach.js'),lib=require('../assets/speaking-library.js');
const id='LESSON-2026-10-08-MOVIES';
test('movies lesson is searchable without changing original topics or personal versions',()=>{
 const entry=lib.builtins.find(e=>e.id===id);assert.ok(entry);assert.equal(entry.part,1);
 assert.ok(lib.filterEntries(lib.builtins,{part:1,query:'weak forms'}).some(e=>e.id===id));
 const old={old:{checks:[true],proof:'旧证据',updated:1}};
 const next=coach.saveAssessment(old,id+'--rhythm-v1',{checks:[false,true],proof:'只修一个重音',updated:2});
 assert.deepEqual(next.old,coach.normalizeReviewState(old).old);assert.equal(old[id+'--rhythm-v1'],undefined);
 const markup=coach.detailMarkup(entry,undefined,next);
 assert.match(markup,/稳定版/);assert.match(markup,/升级版/);assert.match(markup,/function words/);
 assert.match(markup,/data-coach-key="LESSON-2026-10-08-MOVIES--rhythm-v1"/);
 assert.match(markup,/没有自动语音评分/);
});
test('movies cue and checks use Part 1 timing while old evidence cues stay unchanged',()=>{
 const entry=lib.builtins.find(e=>e.id===id);assert.ok(entry);
 const cue=coach.practiceCue(entry);assert.equal(cue.part,1);assert.equal(cue.speakSeconds,30);
 assert.equal(cue.coachKey,id+'--rhythm-v1');assert.equal(cue.prompts.length,4);
 assert.match(coach.practiceChecksMarkup([true],cue.id),/restart ≤ 1/);
 assert.match(coach.historyChecksMarkup([true],cue.id),/function words/);
 assert.match(coach.practiceChecksMarkup([true]),/真正回答了题干/);
 assert.equal(coach.practiceCue({id:'P2-INTERVIEW-ZHANG',part:2}).speakSeconds,undefined);
});
test('timer configuration defaults to original Part 2 and caps movies at 30 seconds',()=>{
 const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
 const start=html.indexOf('function speakingTiming(');assert.ok(start>=0);
 let source;for(let end=html.indexOf('}',start);end>=0;end=html.indexOf('}',end+1)){try{const candidate=html.slice(start,end+1);new vm.Script('('+candidate+')');source=candidate;break;}catch{}}
 const fn=vm.runInNewContext('('+source+')');
 assert.equal(fn({}).speak,120);assert.equal(fn({part:1,speakSeconds:30}).speak,30);
 assert.equal(fn({part:2,speakSeconds:30}).speak,120);
 assert.match(html,/practiceChecksMarkup\(draft.coachChecks\|\|\[\],currentCue\(\).id\)/);
 assert.match(html,/historyChecksMarkup\(l.coachChecks,l.cueId\)/);
});
