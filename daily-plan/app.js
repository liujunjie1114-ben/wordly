'use strict';
(() => {
  const STORAGE_KEY = 'jinri-youxu-web-v1';
  const $ = id => document.getElementById(id);
  const formatDate = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const today = () => formatDate(new Date());
  const dateValue = key => new Date(`${key}T12:00:00`);
  const shiftDate = (key, n) => { const d=dateValue(key); d.setDate(d.getDate()+n); return formatDate(d); };
  const dayDiff = (a,b) => { const parts=k=>k.split('-').map(Number); const x=parts(a),y=parts(b); return Math.round((Date.UTC(x[0],x[1]-1,x[2])-Date.UTC(y[0],y[1]-1,y[2]))/86400000); };
  const validDate = s => typeof s==='string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(dateValue(s).getTime()) && formatDate(dateValue(s))===s;
  const freshState = () => ({version:1,settings:{examDate:shiftDate(today(),30),writingAnchor:today(),template:normalizeTemplate(window.PLANNER_TEMPLATE)},settingsUpdatedAt:0,days:{},plans:{},submissions:{},timer:null});
  let state=freshState(), selected=today(), filter='all', storageOkay=true, toastTimeout, lastToday=today(), activeTimerDate=null;
  const sections=[['morning','上午 · 把重要的事放在前面'],['afternoon','下午 · 练习、订正、再练习'],['evening','晚上 · 上课与收尾'],['extra','临时事项 · 只安排在这一天']];
  const baseTasks=window.PLANNER_TEMPLATE.tasks;
  const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
  function cleanRecord(record){
    const clean={done:{},notes:{},extra:[],projectGoal:'',projectOutput:'',reflection:'',updatedAt:0,reviewReceipt:'',reflectionSavedAt:'',taskTemplate:null};
    if(!record||typeof record!=='object'||Array.isArray(record))return clean;
    for(const key of ['projectGoal','projectOutput','reflection'])if(typeof record[key]==='string')clean[key]=record[key].slice(0,20000);
    clean.updatedAt=Number(record.updatedAt)||0;clean.reviewReceipt=typeof record.reviewReceipt==='string'?record.reviewReceipt.slice(0,100):'';clean.reflectionSavedAt=typeof record.reflectionSavedAt==='string'?record.reflectionSavedAt.slice(0,40):'';
    if(Array.isArray(record.extra)) for(const t of record.extra.slice(0,100)){
      if(t&&typeof t.id==='string'&&/^extra-[a-zA-Z0-9-]{1,80}$/.test(t.id)&&typeof t.title==='string'&&t.title.trim()&&!clean.extra.some(x=>x.id===t.id)) clean.extra.push({id:t.id,title:t.title.slice(0,100),time:typeof t.time==='string'?t.time.slice(0,50):'',group:'extra',hint:'',custom:true});
    }
    if(Array.isArray(record.taskTemplate))clean.taskTemplate=normalizeTemplate({...window.PLANNER_TEMPLATE,tasks:record.taskTemplate}).tasks;
    const ids=new Set([...baseTasks.map(t=>t.id),...clean.extra.map(t=>t.id),...Object.keys(record.done||{}),...Object.keys(record.notes||{})].filter(id=>/^[a-zA-Z0-9-]{1,100}$/.test(id)));
    for(const id of ids){if(record.done&&own(record.done,id)&&record.done[id]===true)clean.done[id]=true;if(record.notes&&own(record.notes,id)&&typeof record.notes[id]==='string')clean.notes[id]=record.notes[id].slice(0,2000);}
    return clean;
  }
  function validateState(raw){
    if(!raw||raw.version!==1||!raw.settings||!validDate(raw.settings.examDate)||!validDate(raw.settings.writingAnchor)||!raw.days||typeof raw.days!=='object'||Array.isArray(raw.days))throw new Error('备份格式不正确');
    const clean=freshState();clean.settings={examDate:raw.settings.examDate,writingAnchor:raw.settings.writingAnchor,template:normalizeTemplate(raw.settings.template)};clean.settingsUpdatedAt=Number(raw.settingsUpdatedAt)||0;
    for(const [date,record] of Object.entries(raw.days)){if(validDate(date))clean.days[date]=cleanRecord(record);}
    for(const [date,plan]of Object.entries(raw.plans||{}))if(validDate(date)){const p=cleanPlan(plan,date);if(p)clean.plans[date]=p;}
    for(const [date,status]of Object.entries(raw.submissions||{})){if(!validDate(date)||!status||typeof status!=='object')continue;const text=(s,n)=>typeof s==='string'?s.slice(0,n):'';const history=(Array.isArray(status.history)?status.history:[]).slice(0,50).filter(x=>x&&typeof x.reflection==='string').map(x=>({id:text(x.id,100),savedAt:text(x.savedAt,40),reflection:text(x.reflection,20000)}));clean.submissions[date]={id:text(status.id,100),savedAt:text(status.savedAt,40),targetDate:validDate(status.targetDate)?status.targetDate:shiftDate(date,1),total:Math.max(history.length,Number(status.total)||0),history,latest:status.latest&&typeof status.latest==='object'?status.latest:null,analysis:status.analysis&&typeof status.analysis==='object'?{planDate:validDate(status.analysis.planDate)?status.analysis.planDate:shiftDate(date,1),summary:text(status.analysis.summary,5000),adjustments:Array.isArray(status.analysis.adjustments)?status.analysis.adjustments.filter(x=>typeof x==='string').slice(0,20):[]}:null};}
    const t=raw.timer;if(t&&validDate(t.date)&&Number.isFinite(t.remaining)&&t.remaining>=0&&t.remaining<=14400&&(t.endAt===null||Number.isFinite(t.endAt)))clean.timer={date:t.date,remaining:t.remaining,endAt:t.endAt};
    return clean;
  }
  let startupMessage='';
  try{const raw=localStorage.getItem(STORAGE_KEY);if(raw)state=validateState(JSON.parse(raw));}catch(e){storageOkay=false;startupMessage='暂时无法读取记录。原有记录未被覆盖，请先导出当前可见记录，并检查浏览器的本地存储设置。';}
  function recordFor(date=selected,create=true){if(!own(state.days,date)){if(!create)return cleanRecord(null);state.days[date]=cleanRecord(null);state.days[date].taskTemplate=JSON.parse(JSON.stringify(state.settings.template.tasks));}return state.days[date];}
  function tasksFor(date=selected){const record=recordFor(date,false),even=((dayDiff(date,state.settings.writingAnchor)%2)+2)%2===0;return [...(record.taskTemplate||state.settings.template.tasks).map(t=>{let original={...t};if(t.alternate){original.title=(even?t.alternate.evenTitle:t.alternate.oddTitle)||t.title;original.hint=(even?t.alternate.evenHint:t.alternate.oddHint)||t.hint;}return {...original,...(state.plans[date]?.overrides[t.id]||{})};}),...record.extra];}
  function summary(date=selected){const r=recordFor(date,false),tasks=tasksFor(date);return {total:tasks.length,done:tasks.filter(t=>r.done[t.id]).length};}
  function save(touch=true){
    if(touch)recordFor().updatedAt=Date.now();
    if(!storageOkay){updateSaveStatus(false);return false;}
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));updateSaveStatus(true);return true;}catch(e){updateSaveStatus(false);toast('保存失败，请导出备份，避免关闭后丢失这次修改。');return false;}
  }
  function updateSaveStatus(ok){const s=$('saveStatus');s.classList.toggle('error',!ok);s.replaceChildren();const dot=document.createElement('span');s.append(dot,document.createTextNode(ok?' 记录已自动保存':' 暂未保存，请先导出备份'));}
  function toast(message){clearTimeout(toastTimeout);$('toast').textContent=message;$('toast').hidden=false;toastTimeout=setTimeout(()=>{$('toast').hidden=true;},4500);}
  function confirmAction(title,message,action){$('confirmTitle').textContent=title;$('confirmMessage').textContent=message;$('confirmDialog').showModal();$('confirmProceed').onclick=()=>{$('confirmDialog').close();action();};}
  function renderDate(){
    templateUI();
    $('selectedDate').value=selected;const d=dateValue(selected);$('dateHeading').textContent=`${d.getMonth()+1} 月 ${d.getDate()} 日 · ${['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][d.getDay()]}`;
    const diff=dayDiff(selected,today());$('mainHeading').textContent=diff===0?'今天，稳稳向前。':diff<0?'回看走过的每一步。':'提前给这一天留个位置。';
    $('dayIntro').textContent=diff===0?'清楚下一步，完成一件，再做一件。':diff<0?'当时完成的事、留下的记录，都在这里。':'可以先写任务范围和项目目标，完成情况单独记录。';
    const remain=dayDiff(state.settings.examDate,today());$('daysLeft').textContent=Math.max(0,remain);$('countdownUnit').textContent=remain<0?'已到考试日':remain===0?'今天考试':'天';const exam=dateValue(state.settings.examDate);$('examLabel').textContent=`${exam.getFullYear()} / ${exam.getMonth()+1} / ${exam.getDate()}`;
    const r=recordFor();for(const id of ['projectGoal','projectOutput','reflection'])$(id).value=r[id];
  }
  function renderWeek(){const strip=$('weekStrip');strip.replaceChildren();for(let i=-6;i<=0;i++){const date=shiftDate(today(),i),s=summary(date),b=document.createElement('button');b.className=`week-day${date===selected?' current':''}${s.done?' started':''}${s.done===s.total?' finished':''}`;b.title=`${date}：完成 ${s.done}/${s.total} 项`;b.setAttribute('aria-label',b.title);if(date===selected)b.setAttribute('aria-current','date');const n=document.createElement('span');n.textContent=dateValue(date).getDate();const dot=document.createElement('span');dot.className='day-progress';b.append(n,dot);b.onclick=()=>selectDate(date);strip.append(b);}}
  function renderProgress(){const s=summary(),percent=Math.round(s.done/s.total*100);$('completedCount').textContent=s.done;$('totalCount').textContent=` / ${s.total} 项`;$('progressFill').style.width=`${percent}%`;$('progressBar').setAttribute('aria-valuenow',percent);$('percentLabel').textContent=`${percent}%`;$('remainingLabel').textContent=s.done===s.total?'今天的清单已全部完成':`还有 ${s.total-s.done} 件待完成`;$('progressMessage').textContent=s.done===0?'今天的进度，从第一件开始':s.done===s.total?'今天做得很扎实，给自己留点休息时间':'已经完成的每一步，都在帮你向前';const tasks=tasksFor(),r=recordFor(),next=tasks.find(t=>!r.done[t.id]);$('nextTaskTitle').textContent=next?next.title:'今天的清单完成了';$('nextTaskHint').textContent=next?next.hint||'先开始这一件。':'看看今天留下的成果，然后安心休息。';$('jumpNext').hidden=!next;$('jumpNext').dataset.id=next?.id||'';}
  function createTaskRow(t){
    const r=recordFor(),row=document.createElement('div');row.className=`task-row${r.done[t.id]?' is-done':''}`;row.id=`row-${t.id}`;
    const input=document.createElement('input');input.type='checkbox';input.className='task-check';input.id=`check-${t.id}`;input.checked=!!r.done[t.id];input.setAttribute('aria-label',t.title);
    input.onchange=()=>{const id=t.id,date=selected;recordFor(date).done[id]=input.checked;save();if(filter==='all'){row.classList.toggle('is-done',input.checked);renderProgress();renderWeek();}else{renderTasks();renderProgress();renderWeek();const target=$('taskList').querySelector('.task-check')||document.querySelector(`button[data-filter="${filter}"]`);target?.focus();}};
    const content=document.createElement('div'),label=document.createElement('label');label.className='task-title';label.htmlFor=input.id;label.textContent=t.title;const hint=document.createElement('p');hint.className='task-hint';hint.textContent=t.hint;content.append(label,hint);
    if(t.note){const note=document.createElement('textarea');note.className='task-note';note.rows=1;note.maxLength=2000;note.placeholder=`＋ ${t.note}`;note.setAttribute('aria-label',`${t.title}：${t.note}`);note.value=r.notes[t.id]||'';note.oninput=()=>{recordFor().notes[t.id]=note.value;save();};content.append(note);}
    const meta=document.createElement('div'),time=document.createElement('span');time.className='task-time';time.textContent=t.time;meta.append(time);
    if(t.custom){const del=document.createElement('button');del.className='custom-delete';del.textContent='移除';del.setAttribute('aria-label',`移除事项：${t.title}`);del.onclick=()=>{const date=selected;confirmAction('移除这件事？',`将从 ${date} 的清单移除「${t.title}」。`,()=>{const rec=recordFor(date);rec.extra=rec.extra.filter(x=>x.id!==t.id);delete rec.done[t.id];delete rec.notes[t.id];save();renderAll();});};meta.append(del);}
    row.append(input,content,meta);return row;
  }
  function renderTasks(){const list=$('taskList');list.replaceChildren();const tasks=tasksFor(),r=recordFor(),visible=tasks.filter(t=>filter==='all'||(filter==='done'?!!r.done[t.id]:!r.done[t.id]));$('listCount').textContent=filter==='all'?`${tasks.length} 项`:`${visible.length} 项`;
    for(const [id,title]of sections){const group=visible.filter(t=>t.group===id);if(!group.length)continue;const section=document.createElement('section');section.className='task-section';const label=document.createElement('h3');label.className='section-label';label.textContent=title;const box=document.createElement('div');box.className='task-group';group.forEach(t=>box.append(createTaskRow(t)));section.append(label,box);list.append(section);}
    $('emptyState').hidden=visible.length>0;$('emptyState').textContent=filter==='done'?'还没有勾选事项，完成第一件就会出现在这里。':'这一天的事项都完成了，安心收尾。';
  }
  function renderAll(){renderDate();renderTasks();renderProgress();renderWeek();renderTimer();renderReview();renderPlan();}
  function selectDate(date){if(!validDate(date)){toast('请选择有效日期。');return;}selected=date;renderAll();}
  function getRemaining(){const t=state.timer;return !t?focusSeconds():t.endAt?Math.max(0,Math.ceil((t.endAt-Date.now())/1000)):t.remaining;}
  function renderTimer(){const t=state.timer,remaining=getRemaining();$('timerDisplay').textContent=`${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`;
    $('timerToggle').textContent=t?.endAt?'暂停计时':remaining===0?'再专注一轮':remaining<focusSeconds()?'继续专注':'开始专注';
    if(t&&t.date!==selected)$('timerHint').textContent=`这轮专注属于 ${t.date}，切换日期不会重新计时。`;
    else if(remaining===0)$('timerHint').textContent=state.settings.template.focusMinutes+' 分钟到了。记录成果，再确认任务是否完成。';
    else $('timerHint').textContent=state.settings.template.focusHint;
  }
  $('timerToggle').onclick=()=>{let t=state.timer;const remaining=getRemaining();if(t?.endAt){t.remaining=remaining;t.endAt=null;}else{if(!t||remaining===0){t=state.timer={date:selected,remaining:focusSeconds(),endAt:null};}t.endAt=Date.now()+t.remaining*1000;}save();renderTimer();};
  $('timerReset').onclick=()=>{if(!state.timer)return;confirmAction('重置本轮计时？','本轮计时会恢复为 '+state.settings.template.focusMinutes+' 分钟，已写的成果和勾选不会改变。',()=>{state.timer=null;save();renderTimer();});};
  setInterval(()=>{if(state.timer?.endAt&&getRemaining()===0){activeTimerDate=state.timer.date;state.timer.endAt=null;state.timer.remaining=0;save();toast(`${activeTimerDate} 的专注时间已到，请记录成果。`);}renderTimer();if(today()!==lastToday){const wasToday=selected===lastToday;lastToday=today();if(wasToday)selected=lastToday;renderAll();}},1000);
  $('selectedDate').onchange=e=>selectDate(e.target.value);$('previousDate').onclick=()=>selectDate(shiftDate(selected,-1));$('nextDate').onclick=()=>selectDate(shiftDate(selected,1));for(const id of ['backToday','todayNav','brandHome'])$(id).onclick=e=>{e.preventDefault();selectDate(today());};
  document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});renderTasks();});
  for(const id of ['projectGoal','projectOutput','reflection'])$(id).oninput=()=>{recordFor()[id]=$(id).value;save();if(id==='reflection')$('reviewDraftStatus').textContent='草稿已保存在本机，点保存按钮后提交这次复盘。';};
  $('jumpNext').onclick=()=>{const id=$('jumpNext').dataset.id;if(filter==='done'){document.querySelector('[data-filter="pending"]').click();}const row=$(`row-${id}`);if(row){row.querySelector('input').focus();row.classList.add('highlight');setTimeout(()=>row.classList.remove('highlight'),1600);}};
  $('addTask').onclick=()=>{$('taskForm').reset();$('taskDialog').showModal();$('taskTitle').focus();};
  $('taskForm').onsubmit=e=>{e.preventDefault();const title=$('taskTitle').value.trim();if(!title){$('taskTitle').setCustomValidity('请填写事项名称。');$('taskTitle').reportValidity();return;}$('taskTitle').setCustomValidity('');recordFor().extra.push({id:`extra-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`,title,time:$('taskTime').value.trim(),group:'extra',hint:'',custom:true});save();$('taskDialog').close();if(filter==='done')document.querySelector('[data-filter="all"]').click();renderAll();toast('已添加到这一天的清单。');};
  $('taskTitle').oninput=()=>$('taskTitle').setCustomValidity('');
  $('editExam').onclick=()=>{$('examDateInput').value=state.settings.examDate;$('examDialog').showModal();};$('examForm').onsubmit=e=>{e.preventDefault();if(!validDate($('examDateInput').value))return;state.settings.examDate=$('examDateInput').value;state.settingsUpdatedAt=Date.now();save();$('examDialog').close();renderDate();};
  document.querySelectorAll('.close-dialog').forEach(b=>b.onclick=()=>b.closest('dialog').close());$('confirmCancel').onclick=()=>$('confirmDialog').close();
  $('exportData').onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`今日有序-备份-${today()}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);toast('备份文件已准备下载，包含所有日期的记录。');};
  $('importData').onclick=()=>$('importFile').click();$('importFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>5*1024*1024)throw new Error('文件超过 5 MB，请选择本工具导出的备份');const incoming=validateState(JSON.parse(await file.text()));confirmAction('合并这份备份？','会保留现有日期；同一天有记录时，使用备份中的整天记录。任务设置采用备份中的设置。',()=>{state.settings=incoming.settings;state.settingsUpdatedAt=Date.now();Object.assign(state.days,incoming.days);Object.assign(state.plans,incoming.plans);Object.assign(state.submissions,incoming.submissions);storageOkay=true;save();renderAll();toast('备份已合并。');});}catch(err){toast(`导入失败：${err.message}`);}finally{e.target.value='';}};
  window.addEventListener('storage',e=>{if(e.key!==STORAGE_KEY||!e.newValue)return;try{const incoming=validateState(JSON.parse(e.newValue));const active=document.activeElement;if(active?.tagName==='TEXTAREA')return;state=incoming;renderAll();}catch{toast('另一窗口的记录暂时无法读取。');}});
  window.addEventListener('pageshow',()=>{if(today()!==lastToday){lastToday=today();selected=lastToday;renderAll();}});
  // The file bridge preserves the original file URL and browser storage key.
  const bridge=null;
  const bridgeReady=false;
  function cleanPlan(raw,date){
    if(!raw||raw.date!==date||!raw.overrides||typeof raw.overrides!=='object'||Array.isArray(raw.overrides))return null;
    const str=(s,n)=>typeof s==='string'?s.slice(0,n):'';
    const p={date,basedOnReview:str(raw.basedOnReview,100),createdAt:str(raw.createdAt,40),headline:str(raw.headline,200),analysis:str(raw.analysis,5000),projectGoal:str(raw.projectGoal,2000),adjustments:Array.isArray(raw.adjustments)?raw.adjustments.filter(s=>typeof s==='string').slice(0,20).map(s=>s.slice(0,2000)):[],overrides:{}};
    for(const id of Object.keys(raw.overrides).filter(id=>/^[a-zA-Z0-9-]{1,100}$/.test(id))){const t={id};const o=raw.overrides[t.id];if(!o||typeof o!=='object')continue;const v={};for(const [key,max]of [['title',100],['time',100],['hint',2000]])if(typeof o[key]==='string')v[key]=str(o[key],max);p.overrides[t.id]=v;}
    return p;
  }
  function renderPlan(){const p=state.plans[selected];$('planBanner').hidden=!p;$('projectGoal').placeholder=p?.projectGoal?`建议：${p.projectGoal}`:'例如：完成一页草图、一组练习，或一个可以展示的具体成果。';if(!p)return;$('planHeadline').textContent=p.headline||'根据复盘调整的当日安排';$('planAnalysis').textContent=p.analysis;fillList('planAdjustments',p.adjustments);}
  function fillList(id,items){const list=$(id);list.replaceChildren();for(const item of items||[]){const li=document.createElement('li');li.textContent=item;list.append(li);}}
  function renderReview(){const r=recordFor(),status=state.submissions[selected],analysis=status?.analysis;$('reviewBadge').textContent=analysis?'已分析 · 计划已调整':status||r.reviewReceipt?'已保存 · 可导出给 AI':'还没有提交';$('reviewResult').hidden=!analysis;if(analysis){$('reviewSummary').textContent=analysis.summary||'';fillList('reviewChanges',analysis.adjustments);$('viewNextPlan').dataset.date=analysis.planDate||shiftDate(selected,1);$('viewNextPlan').textContent=`查看 ${analysis.planDate||shiftDate(selected,1)} 的计划 →`;}
    $('reviewDraftStatus').textContent=r.reflectionSavedAt?`最近提交：${new Date(r.reflectionSavedAt).toLocaleString('zh-CN')}。可以继续补充后再次保存。`:'输入时保存草稿；点击按钮后正式提交复盘。';
    $('reviewHistoryCount').textContent=status?.total?`${status.total} 次提交 · 显示最近 5 次`:'';
    const history=$('reviewHistory');history.replaceChildren();for(const item of status?.history||[]){const box=document.createElement('article');box.className='history-entry';const time=document.createElement('time');time.textContent=new Date(item.savedAt).toLocaleString('zh-CN');const p=document.createElement('p');p.textContent=item.reflection;box.append(time,p);history.append(box);}if(!status?.history?.length){const p=document.createElement('p');p.className='small muted';p.textContent='保存后，每次提交都会保留一份记录。';history.append(p);}
  }
  function bridgeMessage(message,error=false){$('bridgeStatus').textContent=message;$('bridgeStatus').classList.toggle('review-error',error);}
  function downloadJson(name,value){const blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
  $('saveReflection').onclick=()=>{
    const date=selected,r=recordFor();r.reflection=$('reflection').value;
    if(!r.reflection.trim()){toast('先写一点今天的情况，再保存复盘。');$('reflection').focus();return;}
    const submittedAt=new Date().toISOString(),id=date+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
    const review={id,date,targetDate:shiftDate(date,1),submittedAt,reflection:r.reflection.trim(),projectGoal:r.projectGoal,projectOutput:r.projectOutput,tasks:tasksFor().map(t=>({id:t.id,title:t.title,time:t.time,hint:t.hint,done:!!r.done[t.id],note:r.notes[t.id]||''}))};
    const prior=state.submissions[date];state.submissions[date]={id,savedAt:submittedAt,targetDate:review.targetDate,analysis:null,latest:review,history:[{id,savedAt:submittedAt,reflection:review.reflection},...(prior?.history||[])].slice(0,50),total:(prior?.total||0)+1};
    r.reviewReceipt=id;r.reflectionSavedAt=submittedAt;
    if(save()){renderReview();toast('复盘已保存到你自己的浏览器，可以继续补充，也可以导出给 AI 分析。');}else toast('本次尚未持久保存，请先导出备份。');
  };
  $('exportReview').onclick=()=>{
    const review=state.submissions[selected]?.latest;if(!review){toast('请先填写并保存一次复盘。');return;}
    const packet={type:'daily-review',version:1,review,planFormat:{date:review.targetDate,basedOnReview:review.id,headline:'下一天的重点',analysis:'结合复盘和完成情况给出分析',adjustments:['写出具体修改理由'],projectGoal:'建议的核心任务成果',overrides:Object.fromEntries(review.tasks.map(t=>[t.id,{title:t.title,time:t.time,hint:t.hint}]))},instructions:'请根据 review 中的真实反馈和任务完成情况，生成 planFormat 格式的下一天计划 JSON。只改需要调整的任务；保留原任务 id，不把所有未完成任务累积到次日，不覆盖实际勾选或用户填写的成果。请只返回一个可保存为 .json 文件的 JSON 对象。'};
    downloadJson('今日有序-复盘-'+selected+'.json',packet);toast('已导出复盘文件。由你自行发给自己的 AI 助手。');
  };
  $('importPlan').onclick=()=>$('planFile').click();
  $('planFile').onchange=async event=>{
    const file=event.target.files[0];if(!file)return;
    try{if(file.size>1024*1024)throw new Error('计划文件不能超过 1 MB');const raw=JSON.parse(await file.text()),candidate=raw.plan||raw;if(!validDate(candidate.date))throw new Error('计划缺少有效的 date 日期');const plan=cleanPlan(candidate,candidate.date);if(!plan)throw new Error('计划格式不正确，需要 date 和 overrides');
      confirmAction('导入这份调整计划？',`将更新 ${plan.date} 的任务说明和安排，保留实际勾选、成果和历史记录。`,()=>{state.plans[plan.date]=plan;for(const status of Object.values(state.submissions))if(status.id===plan.basedOnReview)status.analysis={planDate:plan.date,summary:plan.analysis,adjustments:plan.adjustments};if(save(false)){selectDate(plan.date);toast('计划已导入，页面上方可以查看调整理由。');}});
    }catch(error){toast('导入失败：'+error.message);}finally{event.target.value='';}
  };
  $('focusReflection').onclick=()=>$('reflection').focus();$('viewNextPlan').onclick=()=>selectDate($('viewNextPlan').dataset.date||shiftDate(selected,1));

// Loaded inside app.js, sharing the existing state and file bridge.
  function normalizeTemplate(raw){
    const initial=window.PLANNER_TEMPLATE,source=raw&&typeof raw==='object'?raw:initial;
    const result={};
    for(const [key,max]of [['brandName',30],['goalLabel',60],['focusName',60],['focusCategory',100],['focusTime',100],['focusHint',1000],['endTitle',120],['endHint',300]])result[key]=typeof source[key]==='string'?source[key].slice(0,max):initial[key];
    result.focusMinutes=Math.min(240,Math.max(5,Math.round(Number(source.focusMinutes)||initial.focusMinutes)));
    const seen=new Set();result.tasks=[];
    for(const item of Array.isArray(source.tasks)?source.tasks.slice(0,60):initial.tasks){
      if(!item||typeof item.id!=='string'||!/^[a-zA-Z0-9-]{1,100}$/.test(item.id)||seen.has(item.id)||typeof item.title!=='string'||!item.title.trim())continue;
      seen.add(item.id);const task={id:item.id,title:item.title.trim().slice(0,100),group:['morning','afternoon','evening'].includes(item.group)?item.group:'morning',time:typeof item.time==='string'?item.time.slice(0,100):'',hint:typeof item.hint==='string'?item.hint.slice(0,2000):'',note:typeof item.note==='string'?item.note.slice(0,100):''};
      if(item.alternate&&typeof item.alternate==='object'){task.alternate={};for(const key of ['evenTitle','oddTitle','evenHint','oddHint'])if(typeof item.alternate[key]==='string')task.alternate[key]=item.alternate[key].slice(0,key.endsWith('Title')?100:2000);}
      result.tasks.push(task);
    }
    if(!result.tasks.length)result.tasks=JSON.parse(JSON.stringify(initial.tasks));
    return result;
  }
  function focusSeconds(){return state.settings.template.focusMinutes*60;}
  function templateUI(){
    const t=state.settings.template;
    document.title=t.brandName+' · 每日清单';
    for(const [id,value]of Object.entries({brandName:t.brandName,goalLabel:t.goalLabel,focusName:t.focusName,focusCategory:t.focusCategory,focusSlot:t.focusTime,focusDurationTag:t.focusMinutes+' MIN',endTitle:t.endTitle,endHint:t.endHint}))$(id).textContent=value;
  }
  function editorRow(task){
    const row=document.createElement('section');row.className='editor-row';row.dataset.taskId=task.id;
    const field=(labelText,key,tag='input')=>{const label=document.createElement('label');label.textContent=labelText;const input=document.createElement(tag);input.dataset.field=key;input.value=task[key]||'';if(tag==='textarea')input.rows=2;else input.type='text';input.maxLength=key==='hint'?2000:100;label.append(input);row.append(label);return input;};
    const title=field('任务名称','title');title.required=true;
    field('时间或提醒','time');
    const label=document.createElement('label');label.textContent='时段';const select=document.createElement('select');select.dataset.field='group';for(const [value,text]of [['morning','上午'],['afternoon','下午'],['evening','晚上']]){const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option);}select.value=task.group;label.append(select);row.append(label);
    field('完成标准／提示','hint','textarea');field('备注输入框的提示（可留空）','note');
    const remove=document.createElement('button');remove.type='button';remove.className='plain-button';remove.textContent='移除此任务';remove.onclick=()=>row.remove();row.append(remove);if(task.alternate)row.dataset.alternate=JSON.stringify(task.alternate);return row;
  }
  function populateEditor(t){
    for(const [id,key]of Object.entries({templateBrand:'brandName',templateFocus:'focusName',templateMinutes:'focusMinutes',templateFocusTime:'focusTime',templateGoalLabel:'goalLabel'}))$(id).value=t[key];
    const box=$('templateTaskRows');box.replaceChildren();t.tasks.forEach(task=>box.append(editorRow(task)));
  }
  $('editTemplate').onclick=()=>{populateEditor(state.settings.template);$('templateDialog').showModal();};
  $('loadTemplateConfig').onclick=()=>populateEditor(normalizeTemplate(window.PLANNER_TEMPLATE));
  $('newTemplateTask').onclick=()=>{if($('templateTaskRows').children.length>=60){toast('默认任务最多 60 项。');return;}$('templateTaskRows').append(editorRow({id:'task-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6),title:'',group:'morning'}));};
  $('templateForm').onsubmit=e=>{
    e.preventDefault();const rows=[...$('templateTaskRows').children];if(!rows.length){toast('至少保留一项任务。');return;}
    const tasks=rows.map(row=>{const task={id:row.dataset.taskId};for(const input of row.querySelectorAll('[data-field]'))task[input.dataset.field]=input.value.trim();if(row.dataset.alternate)task.alternate=JSON.parse(row.dataset.alternate);return task;});
    if(tasks.some(t=>!t.title)){toast('请填好每一项的任务名称。');return;}
    const template=normalizeTemplate({...state.settings.template,brandName:$('templateBrand').value,focusName:$('templateFocus').value,focusMinutes:$('templateMinutes').value,focusTime:$('templateFocusTime').value,goalLabel:$('templateGoalLabel').value,tasks});
    const apply=()=>{if(template.focusMinutes!==state.settings.template.focusMinutes)state.timer=null;state.settings.template=template;state.settingsUpdatedAt=Date.now();for(const [date,r]of Object.entries(state.days))if(date>=today()){r.taskTemplate=JSON.parse(JSON.stringify(template.tasks));r.updatedAt=Date.now();}save(false);$('templateDialog').close();renderAll();toast('默认任务已更新，过去日期的清单保持原样。');};
    if(state.timer&&template.focusMinutes!==state.settings.template.focusMinutes)confirmAction('更改专注时长？','保存后会重置当前这轮计时，历史成果会保留。',apply);else apply();
  };

  renderAll();if(startupMessage){updateSaveStatus(false);toast(startupMessage);}else{save(false);}bridgeMessage('记录仅保存在当前浏览器。需要 AI 分析时，先导出复盘，再自行交给自己的 AI 助手。');
})();
