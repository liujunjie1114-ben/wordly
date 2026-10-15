const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const coach=require('../assets/speaking-coach.js');
const bank=require('../assets/speaking-storybank.json');
test('wording distinguishes future medical careers and the interview viewer role',()=>{
  assert.equal(coach.detectWording('Describe someone who would like to choose a career in the medical field').medical,'future');
  assert.equal(coach.detectWording('Describe someone who works in the medical field').medical,'working');
  assert.equal(coach.detectWording('Describe a time you watched a famous person being interviewed').role,'viewer');
  assert.equal(coach.detectWording('Describe a time you interviewed someone').role,'interviewer');
});
test('latest advice supersedes unsafe recommendations without rewriting old answers',()=>{
  const entry=bank.entries.find(e=>e.id==='P2-LIBRARY-BORING');
  const before=JSON.stringify(entry),profile=coach.profileFor(entry);
  assert.equal(profile.severity,'important');
  assert.match(profile.status,/Showroom/);
  assert.match(profile.pending.join(' '),/真实/);
  assert.equal(JSON.stringify(entry),before);
  assert.equal(coach.profiles['P2-MEDICAL-UNCLE'].variants.length,2);
  assert.equal(coach.profiles['P2-INTERVIEW-ZHANG'].variants.length,2);
  assert.equal(coach.profiles['P2-SWIMMING-SKILL'].variants.length,2);
  const sports=coach.profiles['P2-SPORTS-EVENT'];
  assert.match(sports.confirmed.join(' '),/羽毛球/);
  assert.match(sports.vocabulary.join(' '),/singles match/);
  assert.match(sports.pending.join(' '),/时间/);
});
test('topic variants change the target and evidence instead of just the opening sentence',()=>{
  const p=coach.profiles['P2-BUSINESS-UNCLE'];
  assert.equal(p.variants.length,3);
  assert.notEqual(p.variants[0].focus,p.variants[1].focus);
  assert.notDeepEqual(p.variants[0].evidence,p.variants[1].evidence);
  assert.match(p.pending.join(' '),/第二家/);
  const special=coach.profiles['P2-SAVED-MOTORCYCLE'];
  assert.match(special.diagnosis,/special.*expensive/);
  assert.match(special.pending.join(' '),/杯.*示例/);
});
test('checks are isolated by question and version and never imply an exam score',()=>{
  const existing={old:{checks:[true,false],proof:'我的旧证据',logic:'storyline',updated:1}};
  const one=coach.saveAssessment(existing,'medical--future',{checks:Array(8).fill(true),proof:'真实的学习经历',logic:'claim',updated:2});
  const two=coach.saveAssessment(one,'medical--working',{checks:[false],updated:3});
  assert.deepEqual(two.old,coach.normalizeReviewState(existing).old);
  assert.ok(two['medical--future'].checks.every(Boolean));
  assert.equal(two['medical--working'].checks[0],false);
  assert.equal(existing['medical--future'],undefined);
  assert.equal(coach.checklist.length,8);
  const stats=coach.summary(bank.entries,two,'2026-10-11');
  assert.deepEqual([stats.total,stats.good,stats.important,stats.critical,stats.unreviewed],[20,6,6,3,5]);
  assert.equal(stats.examScore,undefined);
});

test('showroom is the current searchable answer while the library source and old reviews remain intact',()=>{
  const library=require('../assets/speaking-library.js');
  const original=bank.entries.find(e=>e.id==='P2-LIBRARY-BORING');
  const entry=library.builtins.find(e=>e.id===original.id);
  assert.match(original.answer,/library at my university/);
  assert.match(entry.answer,/furniture showroom/);
  assert.equal(entry.cluster,'SHOWROOM');
  assert.ok(library.filterEntries(library.builtins,{query:'showroom',part:2}).some(e=>e.id===original.id));
  const profile=coach.profileFor(entry),variant=coach.variantFor(entry);
  assert.equal(variant.id,'showroom-20261015');
  assert.match(profile.material.answerZh,/家具展厅/);
  assert.equal(profile.material.memory.length,6);
  const html=coach.detailMarkup(entry);
  assert.ok(html.includes(coach.escape(entry.answer)));
  assert.match(html,/中文版本/);
  assert.match(html,/记忆版本/);
  assert.match(html,/2026-10-15/);
  assert.doesNotMatch(html,/当前没有可直接替换/);
  assert.notEqual(coach.reviewKey(entry,variant),entry.id+'--replace');
  const saved=coach.saveAssessment({[entry.id+'--replace']:{proof:'旧自查',checks:[true],updated:1}},coach.reviewKey(entry,variant),{proof:'新自查',updated:2});
  assert.equal(saved[entry.id+'--replace'].proof,'旧自查');
});
test('every Part 2 receives all four evidence questions; old personal records remain usable',()=>{
  for(const e of bank.entries.filter(e=>e.part===2)){
    const p=coach.profileFor(e);
    assert.equal(p.questions.length,4);
    assert.ok(p.variants[0].focus);
    assert.ok(['storyline','claim'].includes(p.logic));
  }
  const normalized=coach.normalizeReviewState({'safe':{checks:Array(20).fill(true),proof:'<b>my text</b>',updated:2},'__proto__':{checks:[true]}});
  assert.equal(normalized.safe.checks.length,8);
  assert.equal(normalized.safe.proof,'<b>my text</b>');
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert.match(html,/spCoachCheck/);
  assert.match(html,/coachReview/);
  assert.match(html,/coachChecks/);
});
test('practice cues keep stable per-version drafts without replacing a custom personal cue',()=>{
  const entry=bank.entries.find(e=>e.id==='P2-INTERVIEW-ZHANG'),before=JSON.stringify(entry);
  const interviewer=coach.practiceCue(entry,'interviewer'),viewer=coach.practiceCue(entry,'viewer');
  assert.notEqual(interviewer.id,viewer.id);
  assert.match(viewer.title,/watched.*being interviewed/);
  assert.equal(viewer.prompts.length,4);
  assert.equal(coach.practiceCue(entry,'viewer').id,viewer.id);
  assert.equal(JSON.stringify(entry),before);
});

test('saved practice history shows all eight checks without treating old records as unchecked',()=>{
  assert.equal(coach.historyChecksMarkup(undefined),'');
  const markup=coach.historyChecksMarkup([true,false,false,false,false,false,false,true]);
  assert.match(markup,/真正回答了题干的关键词/);
  assert.match(markup,/检查了时态、人物角色和题目条件/);
  assert.match(markup,/本次已检查 2 \/ 8/);
  assert.doesNotMatch(markup,/<input/);
});
