const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

// Compile actual application functions, without starting the UI or using private user data.
function functionSource(name) {
  const start = html.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `Missing ${name}`);
  for (let end = html.indexOf('}', start); end >= 0; end = html.indexOf('}', end + 1)) {
    const source = html.slice(start, end + 1);
    try { new vm.Script(`(${source})`); return source; } catch {}
  }
  throw Error(`Cannot parse ${name}`);
}
function arraySource(name) {
  return JSON.parse(html.match(new RegExp(`const ${name}=(\\[[^\\n]*\\]);`))[1]);
}
function fixture() {
  const time = 1791330000000;
  return {
    words: [{id:'existing-word', en:'major', zh:'我的专业释义', book:'wang807-public-v1', page:1, created:time, appearances:11, correctCount:4, mastered:true, dismissed:false, example:{en:'My own example.',zh:'我的例句。'}}, {id:'personal-word',en:'my expression',zh:'个人表达',created:time,appearances:3,correctCount:1,mastered:false,dismissed:false}],
    logs: [{id:'old-log',date:time,title:'旧听写',results:[{en:'major',zh:'专业',entered:'majer',correct:false,imported:false}]}],
    mistakes: {major:{en:'major',zh:'专业',errors:3,last:time,addedAt:time}},
    settings:{mode:'audio',feedback:'end',plays:3,interval:4,auto:false,voice:''},
    daily:{'2026-10-06':{writing:true,listening1:true,listening2:false}},
    review:{major:{stage:3,due:time+604800000,last:time,lastDay:'2026-10-06',lapses:2,reviews:7,relearning:false,lastResult:'correct'},'my expression':{stage:1,due:time+172800000,last:time,lastDay:'2026-10-06',lapses:0,reviews:1,relearning:false,lastResult:'correct'}},
    memoryTyping:{major:{copies:6,recalls:4,errors:2,last:time}},
    vocabPractice:{'existing-word':{attempts:8,correct:6,last:time}},
    reading:{listening:{page:7,completed:[1,2,6],assignments:{'2026-10-06':[6,7]}},writing:{page:9,completed:[4,5],assignments:{'2026-10-06':9}}},
    lessonImports:{'first-dictation-2026-10-06':true},
    speaking:{bank:{},drafts:{cue:{notes:'保留口语草稿'}},logs:[{id:'speaking-log',topic:'My study',date:time,duration:87,notes:'旧复盘',next:'再次练习',checks:[true,false]}],custom:null}
  };
}
function app(initial) {
  const memory = new Map([['wordly_app_v1',JSON.stringify(initial)]]);
  const context = vm.createContext({structuredClone,console,localStorage:{getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value)},renderNav(){},toast(){},WANG807:arraySource('WANG807'),FIRST_DICTATION:arraySource('FIRST_DICTATION'),FIRST_LESSON_ID:'first-dictation-2026-10-06',FIRST_LESSON_TIME:1791244800000});
  const names = ['uid','validCalendarDay','safeReviewNumber','normalizeReview','normalizeMemory','normalizeVocabPractice','normalizeListening','normalizeReading','normalizeSpeakingBank','normalizeDb','load','save','seed807','seedFirstDictation','migrateReview'];
  vm.runInContext(`const KEY='wordly_app_v1';const defaults={words:[],logs:[],mistakes:{},settings:{mode:'meaning',feedback:'instant',plays:2,interval:3,auto:false,voice:''}};${names.map(functionSource).join('\n')}let db=load();`,context);
  return {run:code=>vm.runInContext(code,context),saved:()=>JSON.parse(memory.get('wordly_app_v1'))};
}
test('deployment continues using existing learning and recording storage identities',()=>{
  assert.match(html,/const KEY='wordly_app_v1'/);
  assert.match(html,/indexedDB\.open\('wordly_audio_v1',1\)/);
  assert.doesNotMatch(html,/localStorage\.clear\s*\(|indexedDB\.deleteDatabase\s*\(/);
});
test('old learning records survive loading, saving and another load',()=>{
  const original=fixture(),site=app(original);
  site.run('save();db=load();save();');
  const saved=site.saved();
  for(const field of ['words','logs','mistakes','daily','review','memoryTyping','vocabPractice','reading','lessonImports'])assert.deepEqual(saved[field],original[field],field);
  assert.deepEqual(saved.speaking.drafts,original.speaking.drafts);
  assert.deepEqual(saved.speaking.logs,original.speaking.logs);
});
test('repeated built-in imports keep mastered words, personal examples and existing schedules',()=>{
  const original=fixture(),site=app(original);
  site.run('seed807();seedFirstDictation();migrateReview();save();');
  const first=site.saved();
  site.run('db=load();seed807();seedFirstDictation();migrateReview();save();');
  assert.deepEqual(site.saved(),first);
  assert.deepEqual(first.words.find(w=>w.id==='existing-word'),original.words[0]);
  assert.deepEqual(first.words.find(w=>w.id==='personal-word'),original.words[1]);
  for(const field of ['logs','mistakes','review','memoryTyping','daily','reading'])assert.deepEqual(first[field],original[field],field);
});

