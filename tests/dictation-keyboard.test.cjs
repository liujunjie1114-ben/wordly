const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

function source(name) {
  const start = html.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `Missing ${name}`);
  for (let end = html.indexOf('}', start); end >= 0; end = html.indexOf('}', end + 1)) {
    const body = html.slice(start, end + 1);
    try { new vm.Script(`(${body})`); return body; } catch {}
  }
  throw Error(`Cannot parse ${name}`);
}

function panel({phase = 'recall', round = false} = {}) {
  let focused = 'body', saved = 0;
  const handlers = {};
  const input = {value:'suspension bridge',focus(){focused='memoryInput';},addEventListener(type,fn){handlers[type]=fn;}};
  const next = {disabled:false,focus(){focused=round?'memoryRoundNext':'next';}};
  const state = {en:'suspension bridge',zh:'悬索桥',phase,entered:'',error:'',hinted:false};
  const document = {querySelector(selector){
    if(selector==='#memoryInput')return state.phase==='done'?null:input;
    if(selector==='#memoryTypingHost')return {innerHTML:''};
    if(selector==='#memoryRound')return {innerHTML:''};
    if(selector==='#next')return round?null:next;
    if(selector==='#memoryRoundNext')return round?next:null;
    return null;
  }};
  const context = vm.createContext({document,session:round?null:{checked:true,memory:state,index:0,words:[{en:state.en},{en:'banking'}],answers:[{correct:false}]},memoryRound:round?{state,index:0,words:[{en:state.en}]}:null,db:{settings:{feedback:'instant',auto:false},memoryTyping:{}},save(){saved++;return true;},toast(){},cancelAudio(){},render(){},setTimeout});
  vm.runInContext(['activeMemoryState','bindMemoryPanel','updateMemoryPanel','checkMemoryTyping','normalizeAnswer','nextQuestion','nextMemoryWord'].map(source).join('\n')+'\nfunction memoryTypingMarkup(){return "";}',context);
  return {state,handlers,next,focus:()=>focused,saves:()=>saved,run:code=>vm.runInContext(code,context)};
}

test('finishing dictation recall puts keyboard focus on next question',()=>{
  const ui=panel();
  ui.run('bindMemoryPanel();checkMemoryTyping();');
  assert.equal(ui.state.phase,'done');
  assert.equal(ui.focus(),'next');
  assert.equal(ui.saves(),1);
});

test('finished memory round focuses its enabled next-word button',()=>{
  const ui=panel({round:true});
  ui.run('checkMemoryTyping();');
  assert.equal(ui.state.phase,'done');
  assert.equal(ui.next.disabled,false);
  assert.equal(ui.focus(),'memoryRoundNext');
});

test('Shift+Space allows phrase input and Enter submits only memory typing',()=>{
  const ui=panel({phase:'copy'});
  ui.run('bindMemoryPanel();');
  let prevented=0;
  ui.handlers.keydown({key:' ',shiftKey:true,preventDefault(){prevented++;}});
  assert.equal(prevented,0);
  assert.equal(ui.state.phase,'copy');
  ui.handlers.keydown({key:'Enter',preventDefault(){prevented++;}});
  assert.equal(prevented,1);
  assert.equal(ui.state.phase,'recall');
  assert.equal(ui.focus(),'memoryInput');
  assert.equal(ui.saves(),1);
});

for(const phase of ['copy','recall'])test(`Space skips ${phase} without recording a completed memory attempt`,()=>{
  const ui=panel({phase});
  ui.run('bindMemoryPanel();');
  let prevented=0;
  ui.handlers.keydown({key:' ',preventDefault(){prevented++;}});
  assert.equal(prevented,1);
  assert.equal(ui.run('session.index'),1);
  assert.equal(ui.run('session.checked'),false);
  assert.equal(ui.run('session.memory'),null);
  assert.equal(ui.saves(),0);
});

test('Space can defer an unfinished standalone memory-round word',()=>{
  const ui=panel({round:true,phase:'copy'});
  ui.run('bindMemoryPanel();');
  ui.handlers.keydown({key:' ',preventDefault(){}});
  assert.equal(ui.run('memoryRound'),null);
  assert.equal(ui.saves(),0);
});

test('composition and held keys cannot submit or skip memory steps',()=>{
  const ui=panel({phase:'copy'});
  ui.run('bindMemoryPanel();');
  for(const event of [{key:'Enter',isComposing:true},{key:'Enter',repeat:true},{key:' ',repeat:true},{key:' ',ctrlKey:true}])ui.handlers.keydown({...event,preventDefault(){}});
  assert.equal(ui.state.phase,'copy');
  assert.equal(ui.run('session.index'),0);
  assert.equal(ui.saves(),0);
});

test('dictation slows each utterance while preserving repeat count and pause',()=>{
  const calls=[];
  const context=vm.createContext({session:{index:0,checked:false,words:[{en:'environment'}]},db:{settings:{plays:2,interval:3}},playText(...args){calls.push(args);}});
  vm.runInContext(source('playCurrent')+'\nplayCurrent();',context);
  assert.deepEqual(calls,[['environment',2,3,0.8]]);
  vm.runInContext('session.checked=true;playCurrent();session=null;playCurrent();',context);
  assert.equal(calls.length,1);
});
