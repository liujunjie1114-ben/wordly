const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const file=path.join(__dirname,'../assets/speaking-structure.js');
let api={};if(fs.existsSync(file))api=require(file);
function engine(){assert.equal(typeof api.classify,'function','The new structure-practice engine must exist');return api;}

test('classifies the answering task and time axis, rather than only the first question word',()=>{
 const a=engine();
 for(const [q,group] of [
  ['Do you like buying shoes? How often?','A'],['What films do you like?','A'],
  ['How often do you watch films?','C'],['How do you remember names?','E'],
  ['How much do you spend on shoes?','D'],['How long have you lived there?','D'],
  ['How do you feel when people forget your name?','A'],
  ['What did you like to do as a child?','G'],['Why did you choose that subject?','G'],
  ['Have you ever bought shoes online?','G'],['How has your hometown changed?','H'],
  ['What changes would you like to see in your school?','I'],
  ['Do you think you will live there in the future?','I'],
  ['Do you prefer books or websites?','B'],['Do people in your country like planting vegetables?','A'],
  ['What do people usually buy at street markets?','D'],['Why do some people wear expensive watches?','F']
  ,['How regularly do you watch a film?','C'],['How interested are you in art?','A'],
  ['Have the places where you meet friends changed over time?','H'],
  ['When was the first time you used a computer or tablet?','G'],
  ['What usually makes you feel tired?','A'],['How to memorise others’ names?','E'],
  ['How much does having breakfast matter to you?','F'],
  ['What are the differences between handwriting and typing?','B'],
  ['Who taught you to be polite when you were young?','G'],
  ['How might journeys into space change over the next few decades?','I']
  ,['Is the city friendly to children and old people?','F'],
  ['Would you want children to learn vegetable gardening at school?','I'],
  ['Which foods did you enjoy growing up?','G']
  ,['Would you describe yourself as ambitious?','A'],
  ['Given the choice, would you watch a film at home or at a cinema?','B'],
  ['Given the choice, would you type or write by hand?','B'],
  ['Would you rather live somewhere historic or in a recently built home?','B'],
  ['Do you enjoy seeing one friend at a time or getting together in a group?','B']
 ])assert.equal(a.classify(q),group,q);
});

test('deduplication keeps provenance and stable IDs when the bank is reordered or imported twice',()=>{
 const a=engine(),rows=[{question:'What is your favourite website?',topic:'Websites',sources:['one']},{question:"What's your favorite website?",topic:'Internet',sources:['two']}];
 const first=a.makeBank(rows),second=a.makeBank([...rows].reverse());
 assert.equal(first.length,1);assert.equal(second[0].id,first[0].id);assert.equal(first[0].sources.length,2);
 let state=a.importPack({}, {schema:'wordly-speaking-structure',version:1,questions:rows});
 state=a.importPack(state,{schema:'wordly-speaking-structure',version:1,questions:rows});assert.equal(state.questions.length,1);
 assert.throws(()=>a.importPack(state,{schema:'something-else',questions:rows}));
 assert.throws(()=>a.importPack(state,{schema:'wordly-speaking-structure',version:1,questions:[{question:42}]}));
});

test('a session chooses at most 20 different questions and spreads across topics before repeating a topic',()=>{
 const a=engine();const bank=a.makeBank(Array.from({length:40},(_,i)=>({question:`Do you like activity number ${i}?`,topic:'topic-'+(i%8)})));
 const session=a.chooseSession(bank,'A',{},20);
 assert.equal(session.length,20);assert.equal(new Set(session.map(q=>q.id)).size,20);
 assert.equal(new Set(session.slice(0,8).map(q=>q.topics[0])).size,8);
 const small=bank.slice(0,3);assert.equal(a.chooseSession(small,'A',{},20).length,3);
});

test('first answers and retest history remain append-only while drafts stay editable',()=>{
 const a=engine(),q=a.makeBank([{question:'Do you like music?',topic:'Music'}])[0];
 let s=a.saveDraft({},q.id,{draft:'First independent answer',correction:'I enjoy music.'},10);
 s=a.submit(s,q.id,{id:'attempt-one',at:11,status:'again'});
 s=a.saveDraft(s,q.id,{draft:'Second independent answer'},20);
 s=a.submit(s,q.id,{id:'attempt-two',at:21,status:'practised'});
 assert.equal(s.progress[q.id].firstAnswer,'First independent answer');
 assert.deepEqual(s.progress[q.id].attempts.map(x=>x.answer),['First independent answer','Second independent answer']);
 const restored=a.importPack({},a.exportPack(s,[q]));
 assert.deepEqual(restored.progress[q.id],s.progress[q.id]);
 assert.throws(()=>a.submit(s,q.id,{id:'empty',at:30,status:'practised',answer:''}));
});

test('merging another tab preserves independent notes, framework edits and distinct attempts',()=>{
 const a=engine();
 let left=a.saveDraft({},'p1-q-one',{draft:'Left'},10);left=a.submit(left,'p1-q-one',{id:'left',at:11,status:'again'});
 let right=a.saveDraft({},'p1-q-two',{draft:'Right'},20);right=a.submit(right,'p1-q-two',{id:'right',at:21,status:'practised'});
 const merged=a.mergeState(left,right);assert.equal(merged.progress['p1-q-one'].firstAnswer,'Left');assert.equal(merged.progress['p1-q-two'].firstAnswer,'Right');
 assert.deepEqual(a.mergeState(merged,merged),merged);
});

test('frequency claims require count, date range, source and sample context; missing evidence stays unknown',()=>{
 const a=engine(),r=a.makeBank([{question:'Do you like music?',topic:'Music',examFrequency:99}])[0];
 assert.equal(r.examFrequency,null);
 assert.equal(a.priority(r).kind,'guidance');
 assert.ok(a.frequencySource.url.startsWith('https://ielts.idp.com/'));
 assert.ok(!a.renderOverview([r],{}).includes('99%'));
});

test('new entry is separately routed, linked from the speaking hub and protected by existing storage',()=>{
 engine();const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 const dashboard=fs.readFileSync(path.join(__dirname,'../assets/study-dashboard.js'),'utf8');
 assert.ok(/'speaking-structure':speakingStructurePage/.test(html),'Independent structure-practice route');
 assert.ok(/structures:.*WordlySpeakingStructure/.test(html),'Preserved structure-practice state');
 assert.ok(/speaking-structure','口语结构练习'/.test(dashboard),'Separate speaking-hub entry');
 assert.ok(html.includes('wordly_app_v1'));assert.ok(html.includes('wordly_audio_v1'));
});

test('all existing 335 bank prompts and the generic supplement are available without uploading private materials',()=>{
 const a=engine(),html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),start=html.indexOf('const SPEAKING_BANK='),end=html.indexOf('\nconst KEY=',start),c=vm.createContext({window:{}});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/speaking-bank-supplement-2026-sep-dec.js'),'utf8'),c);
 const original=vm.runInContext(html.slice(start,end)+'\nSPEAKING_BANK.part1',c);
 const first=Array.from(original,card=>Array.from(card.questions,q=>({question:q.text,topic:card.title}))).flat();
 const extra=require('../assets/speaking-structure-questions.js');assert.equal(first.length,335);assert.equal(extra.length,90);
 assert.ok(extra.every(q=>Object.keys(q).every(k=>['question','topic','sources'].includes(k))));
 assert.ok(!/[A-Z]:[\\/]|xwechat_files|firstAnswer|corrections/.test(JSON.stringify(extra)),'Supplement contains no private paths or answers');
 const all=a.makeBank([...first,...extra]);assert.equal(all.length,425);assert.equal(new Set(all.map(q=>q.id)).size,425);
 for(const q of first)assert.ok(all.some(r=>r.id===a.stableId(q.question)),q.question);
 for(const group of Object.keys(a.groups)){const session=a.chooseSession(all,group,{},20);assert.equal(session.length,Math.min(20,all.filter(q=>q.group===group).length));}
});

test('childhood practice stays on one time axis and review exports retain first answers',()=>{
 const a=engine(),rows=a.makeBank([{question:'Did you like parks as a child?',topic:'Parks'},{question:'Did you watch films as a child?',topic:'Films'},{question:'Have you ever lost your keys?',topic:'Keys'}]);
 const section=a.subtype(rows[0].question,'G'),chosen=a.chooseSession(rows,'G',{},20,section);assert.equal(chosen.length,2);assert.ok(chosen.every(q=>a.subtype(q.question,'G')===section));
 let s=a.saveDraft({},rows[0].id,{draft:'My original words',error:'Past tense'},10);s=a.submit(s,rows[0].id,{id:'first',at:11});s.session={group:'G',section,ids:[rows[0].id],index:0,updated:11};
 const md=a.contextMarkdown(s,rows);assert.ok(md.includes('My original words'));assert.ok(md.includes('Past tense'));assert.ok(md.includes(rows[0].question));
});

test('likes practice keeps feelings and ability prompts in separate subgroups with suitable English starts',()=>{
 const a=engine();assert.notEqual(a.subtype('Do you like shoes?','A'),a.subtype('How do you feel when people forget your name?','A'));
 assert.notEqual(a.subtype('Do you like shoes?','A'),a.subtype('Are you good at telling jokes?','A'));
 assert.ok(a.frame({question:'How do you feel when people forget your name?',group:'A'}).stems[0].includes('I feel'));
 assert.ok(a.frame({question:'How long have you lived there?',group:'D'}).stems[0].includes('have'));
 assert.ok(a.subtype('Who taught you to be polite when you were young?','G').startsWith('童年'));
});

test('structure practice has direct hash routing, refresh routing and a synchronous unload save guard',()=>{
 engine();const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 const lists=[...html.matchAll(/if\(\['study','book','mistakes'[^;]*?\.includes\(/g)].map(m=>m[0]);
 assert.equal(lists.length,2,'Both navigation and initial-load allowlists');
 assert.ok(lists.every(s=>s.includes("'speaking-structure'")),'Direct links and refresh must resolve to the new entry');
 assert.ok(/addEventListener\('beforeunload',[\s\S]{0,300}?WordlySpeakingStructure/.test(html),'Pending structure drafts must flush on unload');
});

test('malformed progress and attempt histories are rejected without replacing existing records',()=>{
 const a=engine(),q=a.makeBank([{question:'Do you like music?',topic:'Music'}])[0];let state=a.saveDraft({},q.id,{draft:'Keep my words'},10);state=a.submit(state,q.id,{id:'keep-first',at:11});const before=JSON.stringify(state);
 for(const fields of [{progress:'broken'},{frameworks:[]},{progress:{[q.id]:{draft:'x',attempts:'broken'}}},{session:{group:'A',ids:'broken'}}])assert.throws(()=>a.importPack(state,{schema:'wordly-speaking-structure',version:1,questions:[],...fields}));
 assert.equal(JSON.stringify(state),before);
});

test('same-question edits in different tabs preserve changes to independent fields',()=>{
 const a=engine(),q=a.makeBank([{question:'Do you like music?',topic:'Music'}])[0],base=a.saveDraft({},q.id,{draft:'Base answer'},1);
 const left=a.saveDraft(base,q.id,{correction:'Correction from tab A',error:'Grammar note from A'},20);
 const right=a.saveDraft(base,q.id,{draft:'New answer from tab B'},30);
 const merged=a.mergeState(left,right);assert.equal(merged.progress[q.id].draft,'New answer from tab B');assert.equal(merged.progress[q.id].correction,'Correction from tab A');assert.equal(merged.progress[q.id].error,'Grammar note from A');
 const cleared=a.saveDraft(merged,q.id,{correction:''},40);assert.equal(a.mergeState(merged,cleared).progress[q.id].correction,'');
});

test('review export includes edited wording alongside the unchanged original question',()=>{
 const a=engine(),q=a.makeBank([{question:'Do you like music?',topic:'Music'}])[0];let s=a.saveDraft({},q.id,{draft:'My answer',prompt:'Do you enjoy classical music?'},10);s.session={group:'A',ids:[q.id],index:0,updated:10};
 const md=a.contextMarkdown(s,[q]);assert.ok(md.includes('Do you like music?'));assert.ok(md.includes('Do you enjoy classical music?'));
});

test('inherited property names cannot become question or progress categories',()=>{
 const a=engine(),q=a.makeBank([{question:'Do you like music?',topic:'Music'}])[0];
 for(const group of ['constructor','__proto__','toString','not-a-group']){
  assert.throws(()=>a.importPack({}, {schema:'wordly-speaking-structure',version:1,questions:[{question:q.question,group}]}));
  assert.throws(()=>a.importPack({}, {schema:'wordly-speaking-structure',version:1,questions:[],progress:{[q.id]:{group,attempts:[]}}}));
  assert.throws(()=>a.normalize({session:{group,ids:[q.id],index:0}}));
 }
});
