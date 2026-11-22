(function(root,factory){const data=typeof module==='object'&&module.exports?require('./speaking-vocab-data.js'):root.WordlySpeakingVocabData;const api=factory(data);if(typeof module==='object'&&module.exports)module.exports=api;else root.WordlySpeakingVocab=api;})(typeof globalThis!=='undefined'?globalThis:this,function(data){
 'use strict';
 const {items,groups,levels}=data,byId=new Map(items.map(e=>[e.id,e])),grades=['smooth','stuck','missed'];
 const text=v=>typeof v==='string'?v:'',num=v=>Number.isFinite(+v)?Math.max(0,+v):0;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const uid=()=>globalThis.crypto?.randomUUID?.()||'sv-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
 const empty=()=>({version:1,attempts:[],draft:null});
 function normalize(value){
  const s=empty(),seen=new Set();
  for(const a of Array.isArray(value?.attempts)?value.attempts:[]){
   if(!a||!text(a.id)||seen.has(a.id)||!byId.has(a.itemId)||!grades.includes(a.grade)||!text(a.roundId))continue;
   seen.add(a.id);s.attempts.push({id:a.id,itemId:a.itemId,grade:a.grade,roundId:a.roundId,date:num(a.date),answer:text(a.answer).slice(0,2000),typedMatch:a.typedMatch===true,seconds:num(a.seconds)});
  }
  const d=value?.draft;
  if(d&&text(d.roundId)&&Array.isArray(d.queue)&&d.queue.length&&d.queue.every(id=>byId.has(id))&&new Set(d.queue).size===d.queue.length){
   s.draft={roundId:d.roundId,queue:[...d.queue],index:Math.min(d.queue.length,Math.floor(num(d.index))),revealed:d.revealed===true,answer:text(d.answer).slice(0,2000),startedAt:num(d.startedAt),revealedAt:num(d.revealedAt),updated:num(d.updated)};
  }
  return s;
 }
 function merge(a,b){a=normalize(a);b=normalize(b);return normalize({attempts:[...a.attempts,...b.attempts],draft:!a.draft?b.draft:!b.draft?a.draft:a.draft.updated>b.draft.updated?a.draft:b.draft});}
 function shuffle(list,random=Math.random){const r=[...list];for(let i=r.length-1;i>0;i--){const j=Math.min(i,Math.max(0,Math.floor(random()*(i+1))));[r[i],r[j]]=[r[j],r[i]];}return r;}
 function select({group='',level='',limit=20,ids=null}={},random=Math.random){const set=ids?new Set(ids):null;return shuffle(items.filter(e=>(!group||e.group===group)&&(!level||e.level===level)&&(!set||set.has(e.id))).map(e=>e.id),random).slice(0,Math.max(0,Math.floor(+limit||120)));}
 function normAnswer(s){return text(s).normalize('NFKC').toLowerCase().replace(/[’‘]/g,"'").replace(/[.!?。！？]+$/,'').replace(/\s+/g,' ').trim().replace(/[.!?。！？]+$/,'').trim();}
 function match(item,answer){const n=normAnswer(answer);return !!n&&[item.en,...item.alternatives].some(e=>normAnswer(e)===n);}
 function weakIds(state){const latest=new Map();for(const a of normalize(state).attempts){if(!latest.has(a.itemId)||latest.get(a.itemId).date<=a.date)latest.set(a.itemId,a);}return [...latest.values()].filter(a=>a.grade!=='smooth').map(a=>a.itemId);}
 function start(state,options={},now=Date.now(),random=Math.random){const s=normalize(state),queue=select(options,random);if(!queue.length)throw Error('这个范围还没有可练的表达。');return {...s,draft:{roundId:uid(),queue,index:0,revealed:false,answer:'',startedAt:now,revealedAt:0,updated:now}};}
 function reveal(state,answer='',now=Date.now()){const s=normalize(state);if(!s.draft||s.draft.index>=s.draft.queue.length)throw Error('请先开始练习。');return {...s,draft:{...s.draft,revealed:true,answer:text(answer).slice(0,2000),revealedAt:now,updated:now}};}
 function grade(state,result,{now=Date.now(),id=uid()}={}){
  const s=normalize(state),d=s.draft;if(!d?.revealed||d.index>=d.queue.length)throw Error('请先揭晓参考表达。');if(!grades.includes(result))throw Error('请选择真实的口头自评。');
  const item=byId.get(d.queue[d.index]);return {...s,attempts:[...s.attempts,{id,itemId:item.id,grade:result,roundId:d.roundId,date:now,answer:d.answer,typedMatch:match(item,d.answer),seconds:Math.max(0,(d.revealedAt-d.startedAt)/1000)}],draft:{...d,index:d.index+1,revealed:false,answer:'',startedAt:now,revealedAt:0,updated:now}};
 }
 function roundResults(state){const s=normalize(state);return s.attempts.filter(a=>a.roundId===s.draft?.roundId);}
 let config=null,container=null,tick=null,state=empty(),view='home',filters={group:'',level:'',limit:20},startedAt=0,unsavedAnswer='';
 function configure(c){config=c;}
 function load(){state=normalize(config?.getState());}
 function persist(next){if(!config?.saveState(next)){config?.notify('保存失败，请保留当前页面；本题尚未计入结果。');return false;}load();return true;}
 function stopTimer(){clearInterval(tick);tick=null;}
 function mount(node){stopTimer();container=node;load();view=state.draft?(state.draft.index<state.draft.queue.length?'practice':'summary'):'home';draw();}
 function beforeRender(){stopTimer();container=null;}
 function heading(){return '<div class="sv-head"><div><span class="material-kicker">SPEAKING · CHINESE TO ENGLISH</span><h1>口语词汇转换记忆</h1><p>先用最顺口的说法讲出来，再多掌握一种表达。卡住时，也有路可走。</p></div><button class="btn light small" data-page="hub-speaking">口语首页</button></div>';}
 function stats(){const latest=new Map();for(const a of state.attempts)if(!latest.has(a.itemId)||latest.get(a.itemId).date<=a.date)latest.set(a.itemId,a);return {tried:latest.size,smooth:[...latest.values()].filter(a=>a.grade==='smooth').length,weak:weakIds(state).length};}
 function home(){const s=stats(),unfinished=state.draft&&state.draft.index<state.draft.queue.length;
  return `<div class="sv-intro"><div class="sv-intro-main"><span class="sv-eyebrow">不追求难，追求说得出来</span><h2>中文想到了，<br>英文接得上。</h2><p>120 条常用表达，覆盖感受、决定、习惯、学习、人际、经历、地点、兴趣、论证与接话。例句为通用练习示例。</p><div class="sv-stats"><span><b>${s.tried}</b> 已练词条</span><span><b>${s.smooth}</b> 最近自评顺利</span><span><b>${s.weak}</b> 待复练</span></div></div><div class="sv-plan"><h3>这轮练什么</h3><label>表达程度<select id="svLevel"><option value="">简单与中等混合</option>${levels.map(e=>`<option ${filters.level===e?'selected':''}>${esc(e)}</option>`).join('')}</select></label><label>使用场景<select id="svGroup"><option value="">全部场景</option>${groups.map(e=>`<option ${filters.group===e?'selected':''}>${esc(e)}</option>`).join('')}</select></label><label>每轮数量<select id="svLimit">${[10,20,120].map(n=>`<option value="${n}" ${filters.limit===n?'selected':''}>${n===120?'当前范围全部':n+' 条'}</option>`).join('')}</select></label><button class="btn" id="svStart">乱序开始 →</button>${unfinished?'<button class="btn light" id="svResume">继续未完成的一轮</button>':''}<button class="btn light" id="svWeak" ${s.weak?'':'disabled'}>只练卡住的词 · ${s.weak}</button><button class="sv-text-button" id="svBrowse">先看看表达表</button></div></div><p class="sv-footnote">建议先开口，再揭晓。三秒是可参考的启动目标，不是倒计时限制；说得合理但不在参考列表中，也可以按真实表现自评。记录随原 Wordly 学习备份保存。</p>`;
 }
 function exercise(){const d=state.draft,e=byId.get(d.queue[d.index]);startedAt=d.startedAt;unsavedAnswer=d.answer;
  return `<div class="sv-toolbar"><button class="sv-text-button" id="svHome">← 选择范围</button><span>第 ${d.index+1} / ${d.queue.length} 条 · 随机顺序</span><span id="svClock" aria-label="揭晓前用时"></span></div><progress class="sv-progress" value="${d.index}" max="${d.queue.length}"></progress><section class="sv-card"><div class="sv-tags"><span>${esc(e.group)}</span><span>${esc(e.level)}</span></div><p class="sv-prompt-label">看到这个意思，你会怎么说？</p><h2 class="sv-prompt">${esc(e.zh)}</h2>${!d.revealed?`<p class="sv-prompt-help">先开口说一句。想练拼写，也可以输入英文。</p><label class="sv-sr" for="svAnswer">可选：输入英文表达</label><input id="svAnswer" class="search full" autocomplete="off" spellcheck="false" placeholder="可不填，直接开口说…" value="${esc(d.answer)}"><button class="btn sv-reveal" id="svReveal">${d.answer?'核对参考表达':'我说完了，揭晓参考表达'}</button><p class="sv-hint">不认识也可以直接揭晓；先别急着追求更难的词。</p>`:answerMarkup(e,d)} </section>`;
 }
 function answerMarkup(e,d){const typed=d.answer.trim();return `<div class="sv-answer" aria-live="polite">${typed?`<div class="sv-typed"><span>你输入的</span><p>${esc(d.answer)}</p><small>${match(e,d.answer)?'与已收录表达一致。':'未与已收录表达完全匹配；可能有其他合理说法，请结合含义自评。'}</small></div>`:''}<div class="sv-main-answer"><span>先把这个说顺</span><h3>${esc(e.en)}</h3></div><div class="sv-answer-row"><span>也可以说</span><p>${e.alternatives.map(esc).join(' / ')}</p></div><div class="sv-answer-row"><span>放进一句话</span><p>${esc(e.example)}</p></div><div class="sv-rescue"><span>卡住时，这样接下去</span><p>${esc(e.rescue)}</p></div><p class="sv-tip">${esc(e.tip)}</p><p class="sv-grade-label">回想揭晓前的表现 · 口头自评</p><div class="sv-grades"><button class="btn" data-sv-grade="smooth">顺利说出</button><button class="btn light" data-sv-grade="stuck">卡了一下</button><button class="btn light" data-sv-grade="missed">没想起来</button></div><p class="sv-hint">揭晓前用时 ${Math.round(Math.max(0,d.revealedAt-d.startedAt)/100)/10} 秒，仅作参考；这里没有自动语音评分。</p></div>`;}
 function results(){const rows=roundResults(state),weak=rows.filter(a=>a.grade!=='smooth'),smooth=rows.filter(a=>a.grade==='smooth');return `<section class="sv-summary"><span class="sv-eyebrow">这一轮完成了</span><h2>${rows.length} 条表达，下一轮更顺口。</h2><p>口头自评：${smooth.length} 条顺利 · ${weak.length} 条值得再练。首次回答和每次复练记录都会保留。</p><div class="actions"><button class="btn" id="svRetry" ${weak.length?'':'disabled'}>重练本轮卡词 · ${weak.length}</button><button class="btn light" id="svHome">选一轮新的</button></div>${rows.map(a=>{const e=byId.get(a.itemId);return `<article class="sv-result"><div><span class="sv-result-grade">${{smooth:'顺利',stuck:'卡住',missed:'未想起'}[a.grade]}</span><strong>${esc(e.zh)}</strong><p>${esc(e.en)}</p></div><div><small>卡住时的自然说法</small><p>${esc(e.rescue)}</p>${a.answer?`<small>原输入：${esc(a.answer)}</small>`:''}</div></article>`;}).join('')}</section>`;}
 function browse(){const list=items.filter(e=>(!filters.group||e.group===filters.group)&&(!filters.level||e.level===filters.level));return `<div class="sv-toolbar"><button class="sv-text-button" id="svHome">← 选择范围</button><span>${list.length} 条表达</span><button class="btn small" id="svStart">按当前范围练习</button></div><div class="sv-browse">${list.map(e=>`<article><div class="sv-tags"><span>${esc(e.group)}</span><span>${esc(e.level)}</span></div><h2>${esc(e.zh)}</h2><h3>${esc(e.en)}</h3><p>${e.alternatives.map(esc).join(' / ')}</p><p class="sv-example">${esc(e.example)}</p><p class="sv-rescue"><small>卡住时可以说</small><br>${esc(e.rescue)}</p><p class="sv-hint">${esc(e.tip)}</p></article>`).join('')}</div>`;}
 function draw(){if(!container)return;stopTimer();container.innerHTML=`<div class="sv-wrap">${heading()}${view==='practice'&&state.draft?exercise():view==='summary'?results():view==='browse'?browse():home()}</div>`;bind();if(view==='practice'&&!state.draft.revealed){const update=()=>{const c=container?.querySelector('#svClock');if(c){const seconds=Math.floor(Math.max(0,Date.now()-startedAt)/1000);c.textContent=seconds<3?`${seconds} 秒 · 试着开口`:`${seconds} 秒 · 慢一点也可以`;}};update();tick=setInterval(update,1000);} }
 function begin(ids=null){try{if(persist(start(state,{...filters,...(ids?{ids,limit:120,group:'',level:''}:{})}))){view='practice';draw();}}catch(e){config?.notify(e.message);}}
 function bind(){
  container.querySelector('#svStart')?.addEventListener('click',()=>begin());
  container.querySelector('#svLevel')?.addEventListener('change',e=>filters.level=e.target.value);
  container.querySelector('#svGroup')?.addEventListener('change',e=>filters.group=e.target.value);
  container.querySelector('#svLimit')?.addEventListener('change',e=>filters.limit=+e.target.value);
  container.querySelector('#svBrowse')?.addEventListener('click',()=>{view='browse';draw();});
  container.querySelector('#svHome')?.addEventListener('click',()=>{view='home';draw();});
  container.querySelector('#svResume')?.addEventListener('click',()=>{view='practice';draw();});
  container.querySelector('#svWeak')?.addEventListener('click',()=>begin(weakIds(state)));
  container.querySelector('#svRetry')?.addEventListener('click',()=>begin([...new Set(roundResults(state).filter(a=>a.grade!=='smooth').map(a=>a.itemId))]));
  const answer=container.querySelector('#svAnswer');answer?.addEventListener('input',e=>unsavedAnswer=e.target.value);
  function showAnswer(){const next=reveal(state,answer?.value||'');if(persist(next))draw();}
  container.querySelector('#svReveal')?.addEventListener('click',showAnswer);
  answer?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();showAnswer();}});
  container.querySelectorAll('[data-sv-grade]').forEach(b=>b.addEventListener('click',()=>{if(persist(grade(state,b.dataset.svGrade))){view=state.draft.index<state.draft.queue.length?'practice':'summary';draw();container.querySelector('#svReveal')?.focus({preventScroll:true});}}));
 }
 function beforeNavigate(){if(container&&view==='practice'&&!state.draft?.revealed&&unsavedAnswer!==state.draft?.answer){const next=normalize(state);next.draft.answer=unsavedAnswer;next.draft.updated=Date.now();if(!persist(next))return false;}return true;}
 return {title:data.title,items,groups,levels,empty,normalize,merge,select,shuffle,match,weakIds,start,reveal,grade,roundResults,configure,mount,beforeRender,beforeNavigate};
});
