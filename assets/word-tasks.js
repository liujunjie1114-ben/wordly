(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WordlyWordTasks=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const valid=s=>typeof s==='string'&&/^[\w-]{1,150}$/.test(s)&&!['__proto__','constructor','prototype'].includes(s);
  const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function normalizeState(value){
    if(value==null)return {tasks:{}};
    if(!object(value)||!object(value.tasks))throw Error('单词任务记录损坏，请保留备份');
    const tasks={};
    for(const [id,t] of Object.entries(value.tasks)){
      if(!valid(id)||!object(t)||!object(t.items)||!Array.isArray(t.history))throw Error('单词任务格式异常');
      const items={};
      const answer=a=>{if(!object(a)||typeof a.entered!=='string'||a.entered.length>1000||typeof a.correct!=='boolean'||!['auto','self'].includes(a.judgement)||!Number.isFinite(a.at)||a.at<0)throw Error('单词任务答案异常');return {...a};};
      for(const [key,r] of Object.entries(t.items)){if(!valid(key)||!object(r)||!Number.isInteger(r.attempts)||r.attempts<1||!Number.isInteger(r.errors)||r.errors<0||r.errors>r.attempts)throw Error('单词任务次数异常');items[key]={first:answer(r.first),latest:answer(r.latest),attempts:r.attempts,errors:r.errors};}
      const history=t.history.map(e=>{if(!valid(e.key))throw Error('单词任务历史异常');return {key:e.key,...answer(e)};});
      tasks[id]={items,history};
    }
    return {tasks};
  }
  function resolve(task,entries){const byId=new Map(entries.map(e=>[e.id,e]));return task.items.map(item=>{const entry=byId.get(item.entryId);return {...item,entry,available:entry?.kind!=='knowledge'&&entry?.status==='ready'&&!!entry.en&&!!entry.zh};});}
  function queue(task,state,entries,mode='remaining'){const s=state.tasks?.[task.id]?.items||{};return resolve(task,entries).filter(r=>!r.optional&&r.available&&(mode==='all'||(mode==='wrong'?s[r.key]?.latest.correct===false:!s[r.key]||!s[r.key].latest.correct)));}
  function summary(task,state,entries){const rows=resolve(task,entries),required=rows.filter(r=>!r.optional),records=state.tasks?.[task.id]?.items||{};const attempted=required.filter(r=>records[r.key]).length,correct=required.filter(r=>r.available&&records[r.key]?.latest.correct).length,wrong=required.filter(r=>records[r.key]?.latest.correct===false).length,missing=required.filter(r=>!r.available).length;return {total:required.length,attempted,correct,wrong,missing,skipped:rows.length-required.length,complete:required.length>0&&!missing&&correct===required.length};}
  function record(state,task,key,result){
    if(!task.items.some(r=>r.key===key))throw Error('词项不属于本次任务');
    const next=normalizeState(state.tasks?state:{tasks:{}}),t=next.tasks[task.id]||{items:{},history:[]};
    if(!valid(task.id))throw Error('任务编号异常');
    const r={entered:result.entered,correct:result.correct,judgement:result.judgement,at:result.at};
    const prev=t.items[key];t.items[key]={first:prev?.first||r,latest:r,attempts:(prev?.attempts||0)+1,errors:(prev?.errors||0)+(r.correct?0:1)};
    t.history.push({key,...r});next.tasks[task.id]=t;return normalizeState(next);
  }
  const spelling=s=>String(s).normalize('NFKC').toLowerCase().trim().replace(/[’‘]/g,"'").replace(/[-–—]/g,' ').replace(/\s+/g,' ');
  function mergeState(current,incoming){
    const next=normalizeState(current),other=normalizeState(incoming);
    for(const [id,t] of Object.entries(other.tasks)){
      if(!next.tasks[id]){next.tasks[id]=t;continue;}
      const seen=new Set(),history=[...next.tasks[id].history,...t.history].filter(e=>{const key=JSON.stringify([e.key,e.entered,e.correct,e.judgement,e.at]);if(seen.has(key))return false;seen.add(key);return true;}).sort((a,b)=>a.at-b.at),items={};
      for(const e of history){const old=items[e.key],a={entered:e.entered,correct:e.correct,judgement:e.judgement,at:e.at};items[e.key]={first:old?.first||a,latest:a,attempts:(old?.attempts||0)+1,errors:(old?.errors||0)+(e.correct?0:1)};}
      next.tasks[id]={items,history};
    }
    return normalizeState(next);
  }
  function checkSpelling(entered,expected){if(expected.includes('/'))return null;return spelling(entered)===spelling(expected);}
  let config={getDb:()=>({}),saveState:()=>false,notify:()=>{},speak:()=>{},stop:()=>{},openLibrary:()=>{}},node=null,run=null,learning=null,localAudioURL=null,selectedDay=null;
  const learningPositions=new Map();
  const db=()=>config.getDb();
  const state=()=>db().wordTasks||{tasks:{}};
  const entries=()=>db().knowledge?.entries||[];
  const tasks=()=>config.tasks||[];
  function configure(value){config={...config,...value};}
  function nextTrackTask(today,all,current,library){return all.find(t=>['oct16-19','oct26-plan'].includes(t.track)&&t.items.length&&t.day<=today&&!summary(t,current,library).complete)||null;}
  function nextPage(task,current,library){const pending=queue(task,current,library,'remaining')[0];return Math.max(0,Math.floor(resolve(task,library).findIndex(r=>r.key===pending?.key)/20));}
  function resourceLinks(t){return (t.libraryIds||[]).map(id=>`<button class="btn light small" data-wt-resource="${esc(id)}">查看专项讲解</button>`).join('');}
  function localPlayer(){return '<label class="wt-local">老师原声训练（仅本机播放）<input type="file" accept="audio/*" data-wt-audio></label><audio controls data-wt-player hidden></audio>';}
  function taskCard(t){if(!t.items.length)return `<article class="wt-task"><span class="wt-label">听力 · ${t.pendingSource?'待补资料':'专项原声训练'}</span><h3>${esc(t.title)}</h3><p class="wt-note">${esc(t.note)}</p><div class="wt-actions">${resourceLinks(t)}</div>${localPlayer()}<p class="wt-note">此项不按单词检测计分，打开讲解或播放录音不会自动记为完成。</p></article>`;const p=summary(t,state(),entries());return `<article class="wt-task"><div><span class="wt-label">${esc(t.subject==='reading'?'阅读':t.subject==='writing'?'写作':'听力')} · ${p.complete?'本批练习完成':'待练习'}</span><h3>${esc(t.title)}</h3><p>${p.correct}/${p.total} 项最新答对 · 已练 ${p.attempted} 项 · ${p.wrong} 项待复测${p.missing?` · ${p.missing} 项未导入或待核对`:''}${p.skipped?` · ${p.skipped} 项原资料待核对（不计分）`:''}</p><progress max="${p.total||1}" value="${p.correct}" aria-label="${esc(t.title)}最新答对进度"></progress><p class="wt-note">${esc(t.note)}</p></div><div class="wt-actions"><button class="btn small" data-wt-learn="${t.id}">先学词表</button><button class="btn light small" data-wt-start="${t.id}" data-wt-mode="next20" ${p.total===p.missing||p.complete?'disabled':''}>${p.attempted?'继续检测下一组':'检测前20项'}</button><button class="btn light small" data-wt-start="${t.id}" data-wt-mode="wrong" ${p.wrong?'':'disabled'}>错词复测</button><button class="link" data-wt-start="${t.id}" data-wt-mode="all" ${p.total===p.missing?'disabled':''}>整批再测</button></div>${resourceLinks(t)}${teacherPlayers(t)}<details><summary>错词与复测记录</summary>${historyMarkup(t)}</details></article>`;}
  function historyMarkup(t){const rows=resolve(t,entries()),records=state().tasks[t.id]?.items||{};const tried=rows.filter(r=>records[r.key]);return tried.length?`<p class="wt-note">首次答案保留；阅读和手动判定标记为自评，拼写自动核对标记为实测。表中同时保留已复测通过的旧错词。</p><div class="wt-table"><table><thead><tr><th>词项</th><th>首次答案</th><th>最新结果</th><th>复测次数</th></tr></thead><tbody>${tried.map(r=>{const p=records[r.key];return `<tr><td>${esc(r.entry?.en||r.label)}</td><td>${esc(p.first.entered||'（未输入）')} · ${p.first.correct?'对':'错'}</td><td>${p.latest.correct?'通过':'待复测'} · ${p.latest.judgement==='auto'?'拼写核对':'自评'}</td><td>${p.attempts-1}</td></tr>`;}).join('')}</tbody></table></div>`:'<p class="wt-note">还没有练习结果，打开任务不算完成。</p>';}
  function teacherPlayers(t){
    if(t.subject!=='listening')return '';
    const refs=t.audioRefs||[],other=t.items.some(i=>!i.key.startsWith('l-ch6-'));
    return (!refs.length||other?localPlayer():'')+refs.map(ref=>`<div class="wt-local"><button class="btn light small" data-wt-track="chapter6-test-${ref.test}">播放 Cambridge ${ref.test} 原声</button><audio controls hidden></audio><small>${esc(ref.fileName)} · 保存在当前浏览器</small></div>`).join('');
  }
  function audioImportMarkup(){return typeof WordlyTeacherAudio==='undefined'?'':`<div class="wt-actions"><label class="btn light small">导入 Chapter 6 原声<input type="file" data-wt-audio-import accept="audio/mpeg,.mp3" multiple hidden></label><span class="wt-note" data-wt-audio-status role="status">读取本机原声状态…</span></div><p class="wt-note">可一次选择10份 Cambridge MP3，自动按Test编号对应。音频仅保存在当前浏览器，学习备份不包含音频，请保留原文件。</p>`;}
  function markup(today){
    const day=selectedDay||today,reviewSource=config.reviewDays?.[day],plan=config.plan?.find(p=>p.day===day);
    const reviewDates=Array.isArray(reviewSource)?reviewSource:reviewSource?[reviewSource]:[];
    const availableDays=[...new Set([...tasks().flatMap(t=>[t.day,...(t.displayDays||[])]),...(config.plan||[]).map(p=>p.day),...Object.keys(config.reviewDays||{}),today])].sort().reverse();
    const list=tasks().filter(t=>reviewDates.length?reviewDates.includes(t.day):t.day===day||t.displayDays?.includes(day));
    const overdue=tasks().filter(t=>t.items.length&&t.day<today&&!list.includes(t)&&!summary(t,state(),entries()).complete);
    const track=tasks().filter(t=>['oct16-19','oct26-plan'].includes(t.track)&&t.day<=today),next=nextTrackTask(today,tasks(),state(),entries());
    const done=track.reduce((n,t)=>n+summary(t,state(),entries()).correct,0),total=track.reduce((n,t)=>n+summary(t,state(),entries()).total,0);
    const path=track.length?`<div class="wt-path"><span class="wt-label">老师计划递进学习 · ${done}/${total} 项最新答对</span><h3>${next?`接下来：${esc(next.title)}`:'已完成当前可检测词表'}</h3><p class="wt-note">每天按下方日期安排学习，每组检测最多20项；错词需复测通过。专项原声训练和待补资料另见当天任务。</p>${next?`<button class="btn small" data-wt-path-next="${esc(next.id)}">先看下一组</button>`:''}</div>`:'';
    const note=reviewDates.length?`${day} · ${plan?.title||'复习单词'}：复习本周 ${reviewDates[0]} 至 ${reviewDates.at(-1)} 的词表，成绩仍保存在原任务中。`:plan?.kind==='intro'?'查收／熟悉单词：先熟悉阅读、写作和听力资料，次日开始按表学习。':plan?`${day} · 按老师安排表学习：阅读重在识义，写作看中文写英文，听力结合原声训练。`:'';
    return `<section class="wt-panel" aria-label="老师布置的单词任务"><div class="wt-heading"><div><span class="eyebrow">DAILY WORD TASKS</span><h2>老师布置的单词任务</h2></div><label>任务日期 <select data-wt-day>${availableDays.map(d=>`<option value="${d}" ${day===d?'selected':''}>${d}${d===today?' · 今天':''}${config.plan?.find(p=>p.day===d)?.kind==='dictation'?' · 听写':config.reviewDays?.[d]?' · 复习':''}</option>`).join('')}</select></label></div><p class="wt-note">26年10月大师班单词计划 · 阅读每日约20分钟 · 写作每日约20分钟 · 听力每日约30分钟。学习浏览不计成绩，旧答题记录保留。</p>${path}${audioImportMarkup()}${note?`<p class="wt-review-note">${esc(note)}</p>`:''}${list.length?list.map(taskCard).join(''):plan?.kind==='intro'?'':'<p>该日没有新增范围，可继续上方已安排的词表。</p>'}${overdue.length?`<details class="wt-overdue"><summary>${overdue.length} 项往日任务尚未完成</summary>${overdue.map(t=>`<button class="link" data-wt-past="${t.day}">${t.day} · ${esc(t.title)}</button>`).join('')}</details>`:''}<p class="wt-note">任务按安排表列到2026年11月22日。听力目标为会发音、会含义、会词性、会拼写；关闭网页后不会推送。</p></section>`;
  }
  function renderPractice(){const row=run.rows[run.index];if(!row){const t=run.task;run=null;draw();node?.querySelector(`[data-wt-start="${t.id}"]`)?.focus();config.notify('本轮结果已保存；可查看错词并复测。');return;}
    const e=row.entry,mode=run.task.mode;node.innerHTML=`<section class="wt-panel wt-practice" aria-label="每日单词任务练习"><div class="wt-heading"><div><span class="eyebrow">${esc(run.task.title)}</span><h2>第 ${run.index+1} / ${run.rows.length} 项</h2></div><div class="wt-actions"><button class="btn light small" data-wt-return-learn>返回学习</button><button class="link" data-wt-end>结束本轮</button></div></div><p class="wt-note">${esc(row.label)} · ${mode==='meaning'?'看英文，先回忆中文，再揭晓自评':mode==='audio'?'点击播放，听音写英文':'看中文，写出对应英文表达'}</p>${mode==='audio'?'<button class="btn" data-wt-play>▶ 播放词音</button><p id="studyAudioStatus" class="wt-note" hidden role="status"></p>':`<div class="wt-prompt">${esc(mode==='meaning'?e.en:e.zh)}</div>`}<p class="wt-note">每次判定后自动保存；结束本轮不会把未判定答案算作完成。</p><form data-wt-form><label>${mode==='meaning'?'我的中文回忆':'我的英文答案'}<input data-wt-answer maxlength="1000" autocomplete="off" ${mode==='meaning'?'':'spellcheck="false" autocapitalize="off"'}></label><button class="btn" type="submit">${mode==='meaning'?'揭晓并自评':'检查答案'}</button></form><div data-wt-feedback aria-live="polite"></div></section>`;
    const input=node.querySelector('[data-wt-answer]');input.focus();node.querySelector('[data-wt-end]').onclick=()=>{config.stop();run=null;draw();};node.querySelector('[data-wt-return-learn]').onclick=()=>openLearning(run.task);const play=node.querySelector('[data-wt-play]');if(play)play.onclick=()=>config.speak(e.en);
    let checked=false;node.querySelector('[data-wt-form]').onsubmit=event=>{event.preventDefault();if(checked)return;const entered=input.value.trim();if(!entered){config.notify('请先尝试输入答案；不会的可输入“不会”。');return;}checked=true;config.stop();input.disabled=true;node.querySelector('button[type="submit"]').disabled=true;
      const auto=mode==='meaning'?null:checkSpelling(entered,e.en),feedback=node.querySelector('[data-wt-feedback]');feedback.innerHTML=`<div class="wt-answer"><b>${esc(e.en)}</b><p>${esc(e.zh)}</p>${e.correction?`<p class="wt-note">资料纠正：${esc(e.correction)}</p>`:''}<p>${auto===null?'请核对核心义或并列表达，自评本次回忆。':auto?'拼写一致。':'拼写不同，请核对；其他正确表达可选自评通过。'}</p><div class="wt-actions"><button class="btn" data-wt-result="true">${auto===null?'记得 / 自评通过':auto?'保存并继续':'我的表达正确（自评）'}</button><button class="btn light" data-wt-result="false">${auto===null?'还不熟':'记录错词'}</button></div></div>`;
      for(const b of feedback.querySelectorAll('[data-wt-result]'))b.onclick=()=>{const correct=b.dataset.wtResult==='true',judgement=auto!==null&&auto===correct?'auto':'self';const next=record(state(),run.task,row.key,{entered,correct,judgement,at:Date.now()});if(!config.saveState(next)){config.notify('保存失败，答案仍留在这里，请重试或导出备份。');return;}run.index++;renderPractice();};
    };
  }
  function learningMarkup(task,all,{page=0,hidden=''}={}){
    const rows=resolve(task,all),pages=Math.max(1,Math.ceil(rows.length/20)),current=Math.min(pages-1,Math.max(0,Math.floor(page)||0)),start=current*20,slice=rows.slice(start,start+20),pending=new Set(queue(task,state(),all,'remaining').map(r=>r.key));
    return `<section class="wt-panel wt-learning" aria-label="每日单词任务学习"><div class="wt-heading"><div><span class="eyebrow">先学 · 再测</span><h2>${esc(task.title)}</h2></div><button class="btn light small" data-wt-learn-back>返回任务</button></div><p class="wt-note">可以反复看词、听音，再遮住一侧试着回忆。看过不计入自测成绩，也不会修改熟练度或复习日期。</p><div class="wt-actions"><button class="btn light small" data-wt-hide="english" aria-pressed="${hidden==='english'}">${hidden==='english'?'显示英文':'遮住英文'}</button><button class="btn light small" data-wt-hide="meaning" aria-pressed="${hidden==='meaning'}">${hidden==='meaning'?'显示释义':'遮住释义'}</button><button class="btn small" data-wt-learn-test ${slice.some(r=>pending.has(r.key))?'':'disabled'}>检测本组（最多20项）</button></div><p class="wt-note">第 ${rows.length?start+1:0}–${start+slice.length} / ${rows.length} 项 · 词义和例子来自你已导入的资料库</p><ol class="wt-learn-list" aria-label="本次任务词表" start="${start+1}">${slice.map(r=>{const e=r.entry;return `<li class="wt-learn-row"><div class="wt-learn-index">${esc(r.label)}</div>${e?`<div class="wt-learn-content"><strong>${hidden==='english'?'••••••':esc(e.en)}</strong><p>${hidden==='meaning'?'释义已遮住':esc(e.zh)}</p>${e.example||e.collocations||e.correction?`<details><summary>例子与用法</summary>${e.example?`<p>${esc(typeof e.example==='string'?e.example:e.example.en||'')}</p>`:''}${e.collocations?`<p>搭配：${esc(e.collocations)}</p>`:''}${e.correction?`<p>资料纠正：${esc(e.correction)}</p>`:''}</details>`:''}${!r.available?`<p class="wt-note">${esc(r.note||'此项待核对')}，暂不进入自测。</p>`:r.optional?`<p class="wt-note">${esc(r.note||'原资料待核对')}（不计分）</p>`:''}</div>${r.available?`<button class="btn light small" data-wt-learn-play="${esc(r.key)}" aria-label="播放${esc(r.label)}的发音">▶ 听发音</button>`:''}`:`<p>${esc(r.optional?r.note||'原资料待核对，暂不进入自测': '此项未导入，请从资料复习导入原资料包。')}</p>`}</li>`;}).join('')}</ol><div class="wt-actions wt-learn-pager"><button class="btn light small" data-wt-learn-page="${current-1}" ${current===0?'disabled':''}>上一组</button><span>第 ${current+1} / ${pages} 组</span><button class="btn light small" data-wt-learn-page="${current+1}" ${current===pages-1?'disabled':''}>下一组</button><button class="link" data-wt-learn-back>返回任务</button></div><p id="studyAudioStatus" role="status" class="wt-note"></p></section>`;
  }
  function openLearning(task){if(!task)return;config.stop();node?.querySelectorAll('audio').forEach(a=>a.pause());releaseAudio();run=null;learning={task,...(learningPositions.get(task.id)||{page:0,hidden:''})};renderLearning();}
  function startPractice(task,mode='all',page=null){
    if(!task)return;let rows=queue(task,state(),entries(),mode==='next20'?'remaining':mode);
    if(page!==null){const keys=new Set(resolve(task,entries()).slice(page*20,page*20+20).map(r=>r.key));rows=rows.filter(r=>keys.has(r.key));}
    if(mode==='next20')rows=rows.slice(0,20);
    if(!rows.length){config.notify('没有可练词项；未导入或待核对内容不会算作完成。');return;}
    config.stop();node?.querySelectorAll('audio').forEach(a=>a.pause());releaseAudio();learning=null;run={task,rows,index:0};renderPractice();
  }
  function renderLearning(){
    if(!node||!learning)return;learningPositions.set(learning.task.id,{page:learning.page,hidden:learning.hidden});node.innerHTML=learningMarkup(learning.task,entries(),learning);
    node.querySelectorAll('[data-wt-learn-back]').forEach(b=>b.onclick=()=>{config.stop();learning=null;draw();});
    node.querySelector('[data-wt-learn-test]').onclick=()=>startPractice(learning.task,'remaining',learning.page);
    node.querySelectorAll('[data-wt-hide]').forEach(b=>b.onclick=()=>{learning.hidden=learning.hidden===b.dataset.wtHide?'':b.dataset.wtHide;renderLearning();});
    node.querySelectorAll('[data-wt-learn-page]').forEach(b=>b.onclick=()=>{config.stop();learning.page=+b.dataset.wtLearnPage;renderLearning();node.querySelector('.wt-learning')?.scrollIntoView?.({block:'start'});});
    const rows=resolve(learning.task,entries());node.querySelectorAll('[data-wt-learn-play]').forEach(b=>b.onclick=()=>{b.insertAdjacentElement('afterend',node.querySelector('#studyAudioStatus'));config.speak(rows.find(r=>r.key===b.dataset.wtLearnPlay).entry.en);});
  }

  function releaseAudio(){if(localAudioURL){URL.revokeObjectURL(localAudioURL);localAudioURL=null;}}
  function draw(){if(!node)return;if(run){renderPractice();return;}if(learning){renderLearning();return;}releaseAudio();node.innerHTML=markup(config.today());
    node.querySelector('[data-wt-day]').onchange=e=>{selectedDay=e.target.value;draw();};
    node.querySelectorAll('[data-wt-past]').forEach(b=>b.onclick=()=>{selectedDay=b.dataset.wtPast;draw();});
    node.querySelector('[data-wt-path-next]')?.addEventListener('click',e=>{const task=tasks().find(t=>t.id===e.currentTarget.dataset.wtPathNext);if(task){learningPositions.set(task.id,{page:nextPage(task,state(),entries()),hidden:''});openLearning(task);}});
    const sourceStatus=node.querySelector('[data-wt-audio-status]');
    const refreshSources=()=>{if(sourceStatus&&typeof WordlyTeacherAudio!=='undefined')WordlyTeacherAudio.list().then(keys=>{if(sourceStatus.isConnected)sourceStatus.textContent='已保存 '+keys.length+'/10 份原声';}).catch(error=>{if(sourceStatus.isConnected)sourceStatus.textContent=error.message;});};refreshSources();
    const importAudio=node.querySelector('[data-wt-audio-import]');if(importAudio)importAudio.onchange=async()=>{if(!importAudio.files.length)return;importAudio.disabled=true;try{await WordlyTeacherAudio.importFiles(importAudio.files);config.notify('原声已保存在本机，可按Test编号播放。');refreshSources();}catch(error){config.notify(error.message);}finally{importAudio.disabled=false;importAudio.value='';}};
    node.querySelectorAll('[data-wt-track]').forEach(b=>b.onclick=async()=>{try{const saved=await WordlyTeacherAudio.get(b.dataset.wtTrack);if(!saved){config.notify('请先用上方“导入 Chapter 6 原声”选择对应MP3。');return;}node.querySelectorAll('audio').forEach(a=>a.pause());config.stop();releaseAudio();localAudioURL=URL.createObjectURL(saved.blob);const audio=b.nextElementSibling;audio.src=localAudioURL;audio.hidden=false;audio.play().catch(()=>config.notify('原声已加载，请点击播放器开始播放。'));}catch(error){config.notify(error.message);}});
    node.querySelectorAll('[data-wt-resource]').forEach(b=>b.onclick=()=>config.openLibrary({subject:'listening',entryId:b.dataset.wtResource}));
    node.querySelectorAll('[data-wt-learn]').forEach(b=>b.onclick=()=>openLearning(tasks().find(t=>t.id===b.dataset.wtLearn)));
    node.querySelectorAll('[data-wt-start]').forEach(b=>b.onclick=()=>startPractice(tasks().find(t=>t.id===b.dataset.wtStart),b.dataset.wtMode));
    node.querySelectorAll('[data-wt-audio]').forEach(input=>input.onchange=()=>{const file=input.files?.[0];if(!file)return;node.querySelectorAll('audio').forEach(a=>a.pause());config.stop();releaseAudio();localAudioURL=URL.createObjectURL(file);const audio=input.parentElement.nextElementSibling;audio.src=localAudioURL;audio.hidden=false;});
  }
  function mount(target){node=target;draw();}
  function beforeNavigate(){if(run){config.notify('请先结束本轮单词任务，再切换页面。');return false;}node?.querySelectorAll('audio').forEach(a=>a.pause());config.stop();releaseAudio();learning=null;return true;}
  function beforeRender(){node=null;}
  return {normalizeState,resolve,queue,summary,nextTrackTask,nextPage,record,mergeState,checkSpelling,learningMarkup,configure,mount,markup,beforeNavigate,beforeRender,isPracticing:()=>!!run||!!learning};
});
