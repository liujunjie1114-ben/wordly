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
  function queue(task,state,entries,mode='remaining'){const s=state.tasks?.[task.id]?.items||{};return resolve(task,entries).filter(r=>r.available&&(mode==='all'||(mode==='wrong'?s[r.key]?.latest.correct===false:!s[r.key]||!s[r.key].latest.correct)));}
  function summary(task,state,entries){const rows=resolve(task,entries),records=state.tasks?.[task.id]?.items||{};const attempted=rows.filter(r=>records[r.key]).length,correct=rows.filter(r=>r.available&&records[r.key]?.latest.correct).length,wrong=rows.filter(r=>records[r.key]?.latest.correct===false).length,missing=rows.filter(r=>!r.available).length;return {total:rows.length,attempted,correct,wrong,missing,complete:rows.length>0&&!missing&&correct===rows.length};}
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
  let config={getDb:()=>({}),saveState:()=>false,notify:()=>{},speak:()=>{},stop:()=>{},openLibrary:()=>{}},node=null,run=null,localAudioURL=null,selectedDay=null;
  const db=()=>config.getDb();
  const state=()=>db().wordTasks||{tasks:{}};
  const entries=()=>db().knowledge?.entries||[];
  const tasks=()=>config.tasks||[];
  function configure(value){config={...config,...value};}
  function taskCard(t){const p=summary(t,state(),entries());return `<article class="wt-task"><div><span class="wt-label">${esc(t.subject==='reading'?'阅读':t.subject==='writing'?'写作':'听力')} · ${p.complete?'本批练习完成':'待练习'}</span><h3>${esc(t.title)}</h3><p>${p.correct}/${p.total} 项最新答对 · 已练 ${p.attempted} 项 · ${p.wrong} 项待复测${p.missing?` · ${p.missing} 项未导入或待核对`:''}</p><progress max="${p.total||1}" value="${p.correct}" aria-label="${esc(t.title)}最新答对进度"></progress><p class="wt-note">${esc(t.note)}</p></div><div class="wt-actions"><button class="btn small" data-wt-start="${t.id}" data-wt-mode="remaining" ${p.total===p.missing||p.complete?'disabled':''}>${p.attempted?'继续未完成':'开始练习'}</button><button class="btn light small" data-wt-start="${t.id}" data-wt-mode="wrong" ${p.wrong?'':'disabled'}>错词复测</button><button class="link" data-wt-start="${t.id}" data-wt-mode="all" ${p.total===p.missing?'disabled':''}>整批再测</button></div>${t.subject==='listening'?'<label class="wt-local">老师原声横向测试（仅本机播放）<input type="file" accept="audio/*" data-wt-audio></label><audio controls data-wt-player hidden></audio>':''}<details><summary>错词与复测记录</summary>${historyMarkup(t)}</details></article>`;}
  function historyMarkup(t){const rows=resolve(t,entries()),records=state().tasks[t.id]?.items||{};const tried=rows.filter(r=>records[r.key]);return tried.length?`<p class="wt-note">首次答案保留；阅读和手动判定标记为自评，拼写自动核对标记为实测。表中同时保留已复测通过的旧错词。</p><div class="wt-table"><table><thead><tr><th>词项</th><th>首次答案</th><th>最新结果</th><th>复测次数</th></tr></thead><tbody>${tried.map(r=>{const p=records[r.key];return `<tr><td>${esc(r.entry?.en||r.label)}</td><td>${esc(p.first.entered||'（未输入）')} · ${p.first.correct?'对':'错'}</td><td>${p.latest.correct?'通过':'待复测'} · ${p.latest.judgement==='auto'?'拼写核对':'自评'}</td><td>${p.attempts-1}</td></tr>`;}).join('')}</tbody></table></div>`:'<p class="wt-note">还没有练习结果，打开任务不算完成。</p>';}
  function markup(today){const day=selectedDay||today,availableDays=[...new Set(tasks().map(t=>t.day))].sort().reverse(),list=tasks().filter(t=>t.day===day),overdue=tasks().filter(t=>t.day<today&&!summary(t,state(),entries()).complete);return `<section class="wt-panel" aria-label="老师布置的单词任务"><div class="wt-heading"><div><span class="eyebrow">DAILY WORD TASKS</span><h2>老师布置的单词任务</h2></div><label>任务日期 <select data-wt-day>${[...new Set([today,...availableDays])].sort().reverse().map(d=>`<option value="${d}" ${day===d?'selected':''}>${d}${d===today?' · 今天':''}</option>`).join('')}</select></label></div><p class="wt-note">先回忆，再检查，错词再测。完成状态只属于当前浏览器；不会清空旧词库或替换30天计划。</p>${list.length?list.map(taskCard).join(''):'<p>这一天尚未添加老师任务。把当天任务截图发来后，会按实际范围更新。</p>'}${overdue.length?`<details class="wt-overdue"><summary>${overdue.length} 项往日任务尚未完成</summary>${overdue.map(t=>`<button class="link" data-wt-past="${t.day}">${t.day} · ${esc(t.title)}</button>`).join('')}</details>`:''}<p class="wt-note">这是网站内的提醒；关闭网页后不会自动推送，也不会自动读取聊天中的新截图。</p></section>`;}
  function renderPractice(){const row=run.rows[run.index];if(!row){const t=run.task;run=null;draw();node?.querySelector(`[data-wt-start="${t.id}"]`)?.focus();config.notify('本轮结果已保存；可查看错词并复测。');return;}
    const e=row.entry,mode=run.task.mode;node.innerHTML=`<section class="wt-panel wt-practice" aria-label="每日单词任务练习"><div class="wt-heading"><div><span class="eyebrow">${esc(run.task.title)}</span><h2>第 ${run.index+1} / ${run.rows.length} 项</h2></div><button class="btn light small" data-wt-end>结束本轮</button></div><p class="wt-note">${esc(row.label)} · ${mode==='meaning'?'看英文，先回忆中文，再揭晓自评':mode==='audio'?'点击播放，听音写英文':'看中文，写出对应英文表达'}</p>${mode==='audio'?'<button class="btn" data-wt-play>▶ 播放词音</button><p id="studyAudioStatus" class="wt-note" hidden role="status"></p>':`<div class="wt-prompt">${esc(mode==='meaning'?e.en:e.zh)}</div>`}<p class="wt-note">每次判定后自动保存；结束本轮不会把未判定答案算作完成。</p><form data-wt-form><label>${mode==='meaning'?'我的中文回忆':'我的英文答案'}<input data-wt-answer maxlength="1000" autocomplete="off" ${mode==='meaning'?'':'spellcheck="false" autocapitalize="off"'}></label><button class="btn" type="submit">${mode==='meaning'?'揭晓并自评':'检查答案'}</button></form><div data-wt-feedback aria-live="polite"></div></section>`;
    const input=node.querySelector('[data-wt-answer]');input.focus();node.querySelector('[data-wt-end]').onclick=()=>{config.stop();run=null;draw();};const play=node.querySelector('[data-wt-play]');if(play)play.onclick=()=>config.speak(e.en);
    let checked=false;node.querySelector('[data-wt-form]').onsubmit=event=>{event.preventDefault();if(checked)return;const entered=input.value.trim();if(!entered){config.notify('请先尝试输入答案；不会的可输入“不会”。');return;}checked=true;config.stop();input.disabled=true;node.querySelector('button[type="submit"]').disabled=true;
      const auto=mode==='meaning'?null:checkSpelling(entered,e.en),feedback=node.querySelector('[data-wt-feedback]');feedback.innerHTML=`<div class="wt-answer"><b>${esc(e.en)}</b><p>${esc(e.zh)}</p>${e.correction?`<p class="wt-note">资料纠正：${esc(e.correction)}</p>`:''}<p>${auto===null?'请核对核心义或并列表达，自评本次回忆。':auto?'拼写一致。':'拼写不同，请核对；其他正确表达可选自评通过。'}</p><div class="wt-actions"><button class="btn" data-wt-result="true">${auto===null?'记得 / 自评通过':auto?'保存并继续':'我的表达正确（自评）'}</button><button class="btn light" data-wt-result="false">${auto===null?'还不熟':'记录错词'}</button></div></div>`;
      for(const b of feedback.querySelectorAll('[data-wt-result]'))b.onclick=()=>{const correct=b.dataset.wtResult==='true',judgement=auto!==null&&auto===correct?'auto':'self';const next=record(state(),run.task,row.key,{entered,correct,judgement,at:Date.now()});if(!config.saveState(next)){config.notify('保存失败，答案仍留在这里，请重试或导出备份。');return;}run.index++;renderPractice();};
    };
  }
  function releaseAudio(){if(localAudioURL){URL.revokeObjectURL(localAudioURL);localAudioURL=null;}}
  function draw(){if(!node)return;if(run){renderPractice();return;}releaseAudio();node.innerHTML=markup(config.today());
    node.querySelector('[data-wt-day]').onchange=e=>{selectedDay=e.target.value;draw();};
    node.querySelectorAll('[data-wt-past]').forEach(b=>b.onclick=()=>{selectedDay=b.dataset.wtPast;draw();});
    node.querySelectorAll('[data-wt-start]').forEach(b=>b.onclick=()=>{const task=tasks().find(t=>t.id===b.dataset.wtStart),rows=queue(task,state(),entries(),b.dataset.wtMode);if(!rows.length){config.notify('没有可练词项；未导入或待核对内容不会算作完成。');return;}node.querySelectorAll('audio').forEach(a=>a.pause());run={task,rows,index:0};renderPractice();});
    node.querySelectorAll('[data-wt-audio]').forEach(input=>input.onchange=()=>{const file=input.files?.[0];if(!file)return;node.querySelectorAll('audio').forEach(a=>a.pause());config.stop();releaseAudio();localAudioURL=URL.createObjectURL(file);const audio=input.parentElement.nextElementSibling;audio.src=localAudioURL;audio.hidden=false;});
  }
  function mount(target){node=target;draw();}
  function beforeNavigate(){if(run){config.notify('请先结束本轮单词任务，再切换页面。');return false;}node?.querySelectorAll('audio').forEach(a=>a.pause());config.stop();releaseAudio();return true;}
  function beforeRender(){node=null;}
  return {normalizeState,resolve,queue,summary,record,mergeState,checkSpelling,configure,mount,markup,beforeNavigate,beforeRender,isPracticing:()=>!!run};
});
