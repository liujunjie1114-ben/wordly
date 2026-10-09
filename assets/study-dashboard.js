(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./month-plan-core.js'):root.WordlyMonthPlan);if(typeof module==='object'&&module.exports)module.exports=api;else root.WordlyStudyDashboard=api;})(typeof globalThis!=='undefined'?globalThis:this,function(planCore){
  'use strict';
  const subjects={listening:'听力',reading:'阅读',writing:'写作',speaking:'口语',words:'单词',grammar:'语法'};
  const primary=[['home','▦','今日计划'],...Object.entries(subjects).map(([id,name],i)=>['hub-'+id,String(i+1).padStart(2,'0'),name])];
  const guidance={
    words:['先英→中识义，再复习到期词；口语和写作词补一句自己的例句。','遮住中文快速回忆；读词不要强迫自己默写所有阅读词。','记下混淆义项、搭配和本次回忆结果。'],
    listening:['先读题，圈出限定和预测词性；注意同义替换与改口。','完成一个合适片段或题组，定位证据句，再重听错处。','区分没听到、没听懂与拼写错；保留首次答案。'],
    reading:['先明确题型，再找定位词和原文证据；不靠常识判断。','做限时题组；整理一组替换表达，拆一个长句。','写出答案的原文证据和排除理由，而不只记正确选项。'],
    writing:['先审题与立场，再组织段落；图表先选主要特征。','轮换提纲、主体段和完整作文；不每天堆一篇全文。','保存原句与修订句，说明逻辑、语法或搭配的改动。'],
    speaking:['用关键词组织经历和观点，不照搬整篇范文。','P1 直答加细节；P2 讲经历；P3 给理由、例子与限制。','保留录音，挑一个最影响理解的问题，重说一次。'],
    grammar:['先看规则的条件和例外，再对比容易混淆的结构。','自己写最小对比例句，再放回阅读、口语和作文中。','记录错误原句、建议修正及为什么这样改。']};
  const practice={listening:[['listening','TED / BBC 片段'],['study','单词听写'],['lessons','自建听写']],reading:[['knowledge','阅读题型与证据']],writing:[['knowledge','写作结构与修订']],speaking:[['speaking','计时与录音'],['speaking-library','口语素材整理']],words:[['book','我的单词词库'],['study','听写复测'],['readers','词汇书']],grammar:[['knowledge','语法对比练习']]};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let config={getDb:()=>({}),savePlan:()=>false,navigate:()=>false,openKnowledge:()=>false,notify:()=>{}},node=null,mode='home',selectedDay=null;
  const drafts=new Map();let preview=null;
  const getDb=()=>config.getDb()||{};
  const entries=()=>getDb().knowledge?.entries||[];
  const records=s=>entries().filter(e=>s==='words'?e.kind==='vocabulary':e.categories?.includes(s)&&e.kind!=='vocabulary');
  const ready=s=>records(s).filter(e=>e.status==='ready');
  const button=(label,attrs='',light=true)=>`<button type="button" class="btn${light?' light':''}" ${attrs}>${label}</button>`;
  function dueIds(day=planCore.chinaDay()){
    const at=day===planCore.chinaDay()?Date.now():Date.parse(day+'T23:59:59+08:00');
    const reviews=getDb().knowledge?.review||{};
    return entries().filter(e=>e.status==='ready'&&reviews[e.id]?.last&&reviews[e.id].due<=at).map(e=>e.id);
  }
  function navProgress(data=getDb(),day=planCore.chinaDay()){
    const p=planCore.progress(data.studyPlan,day);
    return `<section class="sd-nav-progress" aria-label="学习任务进度" aria-live="polite"><strong>学习进度</strong>${[['今日',p.today],['30 天',p.month]].map(([name,n])=>`<div class="sd-progress-label"><span>${name}</span><span>${n.done} / ${n.total} · ${n.percent}%</span></div><progress max="100" value="${n.percent}" aria-label="${name}自报任务完成率">${n.percent}%</progress>`).join('')}<small>${data.studyPlan?'按自报完成任务计数 · 休息不计':'尚未开始 · 在今日计划中设置'}</small></section>`;
  }
  function configure(value){config={...config,...value};}
  function updateTask(id,change){
    try{const next=planCore.setTask(getDb().studyPlan,id,change);if(!config.savePlan(next))return false;if(Object.hasOwn(change,'notes'))drafts.delete(id);config.onChange?.();return true;}
    catch(error){config.notify(error.message);return false;}
  }
  function continueTask(id){
    const task=getDb().studyPlan?.days.flatMap(d=>d.tasks).find(t=>t.id===id);if(!task){config.notify('任务不存在，请回到今日计划。');return false;}
    if(task.entryIds.length){const valid=task.entryIds.filter(id=>entries().some(e=>e.id===id&&e.status==='ready'));if(!valid.length){config.notify('本次资料已缺失或待核对，请先检查资料库。');return false;}return config.openKnowledge({reviewIds:valid});}
    if(task.subject==='reflection'){node?.querySelector(`[data-task-note="${task.id}"]`)?.focus();return true;}
    return config.navigate('hub-'+task.subject);
  }
  function subjectTiles(){return `<section data-dashboard-subjects class="sd-section"><div class="sd-section-heading"><h2>六科学习</h2><span>知识 → 练习 → 复盘</span></div><div class="sd-subject-grid">${Object.entries(subjects).map(([s,name],i)=>`<button class="sd-subject-tile" data-sd-route="hub-${s}"><span class="sd-index">0${i+1}</span><span><b>${name}</b><small>${ready(s).length} 条可复习 · ${records(s).filter(e=>e.status!=='ready').length} 条待核对</small></span><span aria-hidden="true">↗</span></button>`).join('')}</div></section>`;}
  function taskMarkup(task,index){
    if(task.subject==='break')return `<li class="sd-break"><span>${index+1}</span> 休息 · 10 分钟 <small>起身、喝水，给注意力留空</small></li>`;
    const note=drafts.has(task.id)?drafts.get(task.id):task.notes;
    return `<li class="sd-task${task.selfReported?' is-done':''}"><div class="sd-task-line"><label><input type="checkbox" data-task-toggle="${task.id}" ${task.selfReported?'checked':''} ${task.active?'':'disabled'}><span><b>${esc(planCore.names[task.subject])}</b><small>${task.minutes} 分钟 · ${task.entryIds.length?task.entryIds.length+' 条新学':'回忆 / 练习'}${task.active?'':' · 本科资料未导入，不计进度'}</small></span></label>${task.active?button('继续',`data-sd-task="${task.id}"`):button('导入资料','data-sd-route="knowledge"')}</div><details><summary>本次内容与复盘${task.selfReported?' · 自报完成':''}</summary><p>${esc(task.subject==='reflection'?'不看笔记回忆今天三个收获，记录一个明天优先改进的问题。':guidance[task.subject][1])}</p>${task.entryIds.length?`<ul class="sd-queue">${task.entryIds.map(id=>`<li>${esc(entries().find(e=>e.id===id)?.title||'资料缺失：'+id)}</li>`).join('')}</ul>`:''}<label class="sd-note-label">我的复盘（自报，不等于测评掌握）<textarea maxlength="4000" data-task-note="${task.id}" placeholder="写下证据句、错因、自己的例句或重练结果">${esc(note)}</textarea></label>${button('保存复盘',`data-task-save="${task.id}"`)}<small class="sd-evidence">实测证据：${task.evidence.length} 条已关联记录；勾选不会更改词汇熟练度。</small></details></li>`;
  }
  function planPreview(plan){
    const assigned=plan.days.reduce((n,d)=>n+d.tasks.reduce((m,t)=>m+t.entryIds.length,0),0),total=assigned+plan.unassigned.length;
    return `<div class="sd-notice">首轮安排 ${assigned} / ${total} 条可复习内容${plan.unassigned.length?`；${plan.unassigned.length} 条超出当前时间预算，保留待续学。`:'；最后 4 天留给模拟和累计复测。'}<br>这不是掌握保证；复习积压时先少学新内容，不把上千词强塞进一天。</div><div class="sd-month-list">${plan.days.map(d=>`<details><summary>第 ${d.index+1} 天 · ${d.day} <span>${d.phase} · 新学 ${d.tasks.reduce((n,t)=>n+t.entryIds.length,0)} 条</span></summary><ul>${d.tasks.filter(t=>t.subject!=='break').map(t=>`<li>${esc(planCore.names[t.subject])} · ${t.minutes} 分钟 · ${t.entryIds.length} 条新学${t.active?'':'（待导入）'}</li>`).join('')}</ul></details>`).join('')}</div>`;
  }
  function homeMarkup(today=planCore.chinaDay()){
    const data=getDb(),plan=data.studyPlan,day=plan?.days.find(d=>d.day===(selectedDay||today)),p=planCore.progress(plan,today),due=dueIds(today),mistakes=Object.keys(data.mistakes||{}).length;
    const next=day?.tasks.find(t=>planCore.eligible(t)&&!t.selfReported);
    const overdue=plan?planCore.daily(plan,today).overdue:[];
    return `<div class="sd-dashboard"><header class="sd-header"><span class="eyebrow">WORDLY · STUDY ROUTINE</span><h1>把今天学扎实。</h1><p>每天 6 小时，学知识、做练习、留复盘。一步一步，不把资料堆成负担。</p></header><section data-dashboard-today class="sd-today"><div class="sd-section-heading"><div><span class="eyebrow">先做这一件</span><h2>${plan?day?`第 ${day.index+1} 天 · ${day.phase}`:today<plan.startDay?'计划尚未开始':'30 天计划已结束，回看未完成项':'建立你的 30 天节奏'}</h2></div><span class="sd-budget">330 分钟学习 + 30 分钟休息</span></div>${plan?`<div class="sd-today-progress"><b>今日 ${p.today.done} / ${p.today.total} 项</b><progress max="100" value="${p.today.percent}" aria-label="今日自报任务完成率">${p.today.percent}%</progress><span>${p.today.percent}%</span></div><p class="sd-caption">进度按自报完成计数；实际回忆结果、听写和录音记录单独保存。</p>${day?`<div class="sd-next"><div><span class="eyebrow">下一步</span><h3>${next?esc(planCore.names[next.subject]):'今天的任务已自报完成'}</h3><p>${next?'先复习到期内容，再完成本次短队列。':'抽一个薄弱点复测，确认不是只看懂了。'}</p></div>${next?button('继续这项任务',`data-sd-task="${next.id}"`,false):button('查看到期复习','data-sd-due',false)}</div><ol class="sd-tasks">${day.tasks.map(taskMarkup).join('')}</ol>`:'<p>可以展开下方 30 天安排，回到相应日期继续；不会自动重置已有记录。</p>'}${overdue.length?`<details class="sd-overdue"><summary>还有 ${overdue.length} 项往日任务未自报完成</summary><p>先补薄弱内容，必要时减少今天新学；旧任务不会消失。</p>${overdue.map(t=>`<div class="sd-overdue-row"><span>${t.day} · ${esc(planCore.names[t.subject])}</span>${button('回到这一天',`data-sd-day="${t.day}"`)}</div>`).join('')}</details>`:''}<details class="sd-month"><summary>查看完整 30 天安排${selectedDay?' · 当前正在回看':''}</summary>${button('回到今天','data-sd-today')}${planPreview(plan)}<div class="sd-day-picker">${plan.days.map(d=>button(String(d.index+1),`data-sd-day="${d.day}" aria-label="查看第 ${d.index+1} 天"`)).join('')}</div></details>`:entries().some(e=>e.status==='ready')?`<p>阅读词重点英→中识义；写作和口语词再练主动表达。开始前可预览，不会自动改动记录。</p><div class="sd-start"><label>第 1 天 <input type="date" data-sd-start value="${today}"></label>${button('预览 30 天安排','data-sd-preview')}${button('开始 30 天计划','data-sd-start-plan',false)}</div>${preview?`<details open class="sd-month"><summary>开始前预览（尚未保存）</summary>${planPreview(preview)}${button('关闭预览','data-sd-close-preview')}</details>`:''}`:`<p>先导入资料包，才会按真实内容生成任务。原有听写、错题和录音记录不会清空。</p>${button('导入资料','data-sd-route="knowledge"',false)}`}</section><section data-dashboard-due class="sd-section sd-review-strip"><div><h2>到期复习与错题</h2><p>${due.length} 条已学知识到期 · ${mistakes} 个听写错词。未学卡不算积压。</p></div><div class="sd-actions">${button('复习到期知识','data-sd-due')}${button('错题本','data-sd-route="mistakes"')}</div></section>${subjectTiles()}<section class="sd-section sd-management"><h2>资料与学习证据</h2><p>待核对内容不进入背词；打开卡片不算掌握。资料只保存在当前浏览器，记得备份；录音需单独下载。</p><div class="sd-actions">${button('全部资料 / 导入','data-sd-route="knowledge"')}${button('听写历史','data-sd-route="logs"')}${button('备份设置','data-sd-route="settings"')}</div></section></div>`;
  }
  function subjectMarkup(subject){
    if(!Object.hasOwn(subjects,subject))return '<p>科目不存在，请回到今日计划。</p>';
    const list=ready(subject),pending=records(subject).length-list.length;
    return `<div class="sd-dashboard"><header class="sd-header"><button class="link" data-sd-route="home">← 今日计划</button><span class="eyebrow">WORDLY · ${esc(subject)}</span><h1>${subjects[subject]}</h1><p>${list.length} 条可复习 · ${pending} 条待核对。按“知识 → 练习 → 复盘”走一遍。</p></header><section class="sd-subject-section"><span class="sd-index">01</span><div><h2>学知识</h2><p>${guidance[subject][0]}</p><ul class="sd-preview-cards">${list.slice(0,4).map(e=>`<li><button data-sd-entry="${esc(e.id)}">${esc(e.title)}</button></li>`).join('')||'<li>尚无已核对内容，请导入资料。</li>'}</ul>${button('查看本科知识',`data-sd-subject="${subject}"`,false)}</div></section><section class="sd-subject-section"><span class="sd-index">02</span><div><h2>做练习</h2><p>${guidance[subject][1]}</p><div class="sd-actions">${practice[subject].map(([route,label])=>button(label,route==='knowledge'?`data-sd-subject="${subject}"`:`data-sd-route="${route}"`)).join('')}</div></div></section><section class="sd-subject-section"><span class="sd-index">03</span><div><h2>留复盘</h2><p>${guidance[subject][2]}</p><p class="sd-caption">知识卡可修改并保存回忆结果；当天任务可留下个人复盘。自报完成与实测证据分开。</p><div class="sd-actions">${button('本科到期回忆',`data-sd-review-subject="${subject}"`)}${button('回到今日任务','data-sd-route="home"')}</div></div></section></div>`;
  }
  function beforeNavigate(){if(drafts.size){config.notify('任务复盘尚未保存，请先点击“保存复盘”再切页。');return false;}return true;}
  function beforeRender(){node=null;}
  function redraw(){if(!node)return;node.innerHTML=mode==='home'?homeMarkup():subjectMarkup(mode);bind();}
  function bind(){
    if(!node)return;
    const on=(selector,event,fn)=>node.querySelectorAll(selector).forEach(el=>el.addEventListener(event,()=>fn(el)));
    on('[data-sd-route]','click',el=>config.navigate(el.dataset.sdRoute));
    on('[data-sd-entry]','click',el=>config.openKnowledge({entryId:el.dataset.sdEntry}));
    on('[data-sd-subject]','click',el=>config.openKnowledge(el.dataset.sdSubject==='words'?{kind:'vocabulary'}:{subject:el.dataset.sdSubject,kind:'knowledge'}));
    on('[data-sd-review-subject]','click',el=>{const ids=new Set(ready(el.dataset.sdReviewSubject).map(e=>e.id));config.openKnowledge({reviewIds:dueIds().filter(id=>ids.has(id))});});
    on('[data-sd-due]','click',()=>config.openKnowledge({reviewIds:dueIds()}));
    on('[data-sd-task]','click',el=>continueTask(el.dataset.sdTask));
    on('[data-task-toggle]','change',el=>{if(updateTask(el.dataset.taskToggle,{selfReported:el.checked}))redraw();else el.checked=!el.checked;});
    on('[data-task-note]','input',el=>drafts.set(el.dataset.taskNote,el.value));
    on('[data-task-save]','click',el=>{const id=el.dataset.taskSave;if(updateTask(id,{notes:drafts.get(id)??node.querySelector(`[data-task-note="${id}"]`)?.value??''})){config.notify('复盘已保存。');redraw();}});
    on('[data-sd-day]','click',el=>{if(beforeNavigate()){selectedDay=el.dataset.sdDay;redraw();}});
    on('[data-sd-today]','click',()=>{if(beforeNavigate()){selectedDay=null;redraw();}});
    const candidate=()=>planCore.create({entries:entries(),startDay:node.querySelector('[data-sd-start]')?.value||planCore.chinaDay()});
    on('[data-sd-preview]','click',()=>{try{preview=candidate();redraw();}catch(e){config.notify(e.message);}});
    on('[data-sd-close-preview]','click',()=>{preview=null;redraw();});
    on('[data-sd-start-plan]','click',()=>{try{const p=candidate();if(config.savePlan(p)){preview=null;selectedDay=null;config.onChange?.();redraw();}}catch(e){config.notify(e.message);}});
  }
  function mountHome(target){node=target;mode='home';redraw();}
  function mountSubject(target,subject){node=target;mode=subject;redraw();}
  return {primary,configure,mountHome,mountSubject,beforeRender,beforeNavigate,navProgress,homeMarkup,subjectMarkup,updateTask,continueTask};
});
