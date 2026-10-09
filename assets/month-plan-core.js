(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WordlyMonthPlan=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const minutes={words:65,listening:50,reading:55,speaking:60,writing:55,grammar:25,reflection:20};
  const names={words:'单词与旧卡回忆',listening:'听力',reading:'阅读',speaking:'口语',writing:'写作',grammar:'语法',reflection:'当日复盘',break:'休息'};
  const validId=s=>typeof s==='string'&&/^[\w-]{1,150}$/.test(s)&&!['__proto__','constructor','prototype'].includes(s);
  function parseDay(day){if(typeof day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(day))throw Error('计划日期格式错误');const stamp=Date.parse(day+'T12:00:00Z');if(!Number.isFinite(stamp)||new Date(stamp).toISOString().slice(0,10)!==day)throw Error('计划日期无效');return stamp;}
  const addDay=(day,n)=>new Date(parseDay(day)+n*86400000).toISOString().slice(0,10);
  function chinaDay(now=Date.now()){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(now));const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));return `${p.year}-${p.month}-${p.day}`;}
  const ready=entries=>entries.filter(e=>e&&e.status==='ready'&&validId(e.id));
  const subject=e=>e.kind==='vocabulary'?'words':e.categories?.find(k=>Object.hasOwn(minutes,k))||null;
  const cost=e=>e.kind==='vocabulary'?(e.categories?.some(s=>['speaking','writing'].includes(s))?45:15):90;
  const phase=index=>index<7?'基础与诊断':index<14?'题型专项':index<21?'迁移与限时':index<26?'整合与补漏':'模拟与累计复测';
  function capacity(task,index){if(index>=26||task.subject==='reflection'||task.subject==='break')return 0;const base=task.subject==='words'?30*60:Math.floor(task.minutes*30);return Math.floor(base*([6,13,20].includes(index)?.4:1));}
  const eligible=t=>t.active===true&&t.subject!=='break';
  function normalize(value){
    if(value==null)return null;
    if(!value||value.version!==1||!validId(value.id)||!Array.isArray(value.days)||value.days.length!==30)throw Error('学习计划格式异常，请保留备份');
    parseDay(value.startDay);const ids=new Set(),newIds=new Set();
    const days=value.days.map((d,index)=>{
      if(d.day!==addDay(value.startDay,index)||!Array.isArray(d.tasks)||d.tasks.length!==10)throw Error('学习计划日期或任务不完整');
      const tasks=d.tasks.map(t=>{
        if(!validId(t.id)||ids.has(t.id)||!Object.hasOwn(names,t.subject)||!Array.isArray(t.entryIds)||t.entryIds.some(id=>!validId(id)||newIds.has(id)))throw Error('学习计划任务编号异常');
        ids.add(t.id);t.entryIds.forEach(id=>newIds.add(id));
        if(t.minutes!==(t.subject==='break'?10:minutes[t.subject]))throw Error('学习计划时长与六小时预算不一致');
        if(typeof t.notes==='string'&&t.notes.length>4000)throw Error('任务笔记请控制在4000字以内');
        const evidence=Array.isArray(t.evidence)?t.evidence:[];
        if(evidence.some(e=>!['knowledge-review','dictation-log','speaking-log'].includes(e.type)||typeof e.id!=='string'||e.id.length>200))throw Error('计划练习证据格式异常');
        return {...t,entryIds:[...t.entryIds],active:t.active===true,selfReported:t.selfReported===true,notes:typeof t.notes==='string'?t.notes:'',evidence:evidence.map(e=>({type:e.type,id:e.id}))};
      });
      const learning=tasks.filter(t=>t.subject!=='break');
      if(new Set(learning.map(t=>t.subject)).size!==7||tasks.filter(t=>t.subject==='break').length!==3)throw Error('学习计划科目不完整');
      return {...d,index,phase:phase(index),tasks};
    });
    if(!Array.isArray(value.unassigned)||value.unassigned.some(id=>!validId(id)||newIds.has(id)))throw Error('学习计划待排内容异常');
    return {...value,days,unassigned:[...new Set(value.unassigned)],missing:Array.isArray(value.missing)?value.missing.filter(validId):[]};
  }
  function allocate(plan,entries,fromDay,appendOnly){
    const byId=new Map(ready(entries).map(e=>[e.id,e]));
    const assigned=new Set(plan.days.flatMap(d=>d.tasks.flatMap(t=>t.entryIds)));
    const pools={};for(const key of Object.keys(minutes))pools[key]=[];
    for(const entry of byId.values()){const key=subject(entry);if(key&&!assigned.has(entry.id))pools[key].push(entry);}
    for(const pool of Object.values(pools))pool.sort((a,b)=>(a.tags?.join(' ')||'').localeCompare(b.tags?.join(' ')||'','zh-CN')||a.id.localeCompare(b.id));
    for(const day of plan.days){
      if(day.day<fromDay||day.index>=26)continue;
      for(const task of day.tasks){
        if(!eligible(task)||task.selfReported||task.evidence.length)continue;
        const pool=pools[task.subject];if(!pool?.length)continue;
        const later=plan.days.filter(d=>d.index>=day.index&&d.index<26&&d.day>=fromDay&&d.tasks.some(t=>t.subject===task.subject&&eligible(t)&&!t.selfReported&&!t.evidence.length)).length;
        const used=task.entryIds.reduce((sum,id)=>sum+(byId.has(id)?cost(byId.get(id)):0),0);
        const budget=Math.max(0,capacity(task,day.index)-used);
        const target=appendOnly?budget:Math.min(budget,Math.max(cost(pool[0]),Math.ceil(pool.reduce((sum,e)=>sum+cost(e),0)/Math.max(1,later))));
        let spent=0;
        while(pool.length&&spent+cost(pool[0])<=target){const entry=pool.shift();task.entryIds.push(entry.id);spent+=cost(entry);assigned.add(entry.id);}
      }
    }
    plan.unassigned=Object.values(pools).flat().map(e=>e.id);
    plan.missing=[...assigned].filter(id=>!byId.has(id));
    return plan;
  }
  function create({entries,startDay=chinaDay(),now=Date.now()}){
    const data=ready(entries);if(!data.length)throw Error('请先导入可复习资料，再开始计划');parseDay(startDay);
    const id='month-'+Math.max(0,Math.floor(now));
    const active=new Set(data.map(subject));
    const days=Array.from({length:30},(_,index)=>{
      const tasks=Object.entries(minutes).map(([key,n])=>({id:`${id}-${index}-${key}`,subject:key,minutes:n,entryIds:[],active:key==='reflection'||active.has(key),selfReported:false,notes:'',evidence:[]}));
      for(const [offset,at] of [[0,2],[1,5],[2,8]])tasks.splice(at,0,{id:`${id}-${index}-break${offset}`,subject:'break',minutes:10,entryIds:[],active:true,selfReported:false,notes:'',evidence:[]});
      return {day:addDay(startDay,index),index,phase:phase(index),tasks};
    });
    return normalize(allocate({version:1,id,startDay,created:now,days,unassigned:[],missing:[]},data,startDay,false));
  }
  function append(value,entries,today=chinaDay()){
    const plan=normalize(value);if(!plan)return null;parseDay(today);
    const active=new Set(ready(entries).map(subject));
    for(const d of plan.days)if(d.day>today)for(const t of d.tasks)if(!t.selfReported&&!t.evidence.length&&active.has(t.subject))t.active=true;
    return normalize(allocate(plan,entries,addDay(today,1),true));
  }
  function setTask(value,id,{selfReported,notes,evidence}={}){
    const plan=normalize(value);if(!plan)throw Error('请先开始学习计划');
    const task=plan.days.flatMap(d=>d.tasks).find(t=>t.id===id);if(!task)throw Error('计划任务不存在');
    if(selfReported!==undefined)task.selfReported=selfReported===true;
    if(notes!==undefined)task.notes=notes;
    if(evidence!==undefined)task.evidence=evidence;
    return normalize(plan);
  }
  const done=t=>t.selfReported===true;
  function progress(value,day=chinaDay()){
    const plan=normalize(value),empty={done:0,total:0,percent:0};if(!plan)return {today:{...empty},month:{...empty}};
    const count=tasks=>{const all=tasks.filter(eligible),finished=all.filter(done).length;return {done:finished,total:all.length,percent:all.length?Math.round(finished/all.length*100):0};};
    return {today:count(plan.days.find(d=>d.day===day)?.tasks||[]),month:count(plan.days.flatMap(d=>d.tasks))};
  }
  function daily(value,day=chinaDay(),review={}){
    const plan=normalize(value);if(!plan)return {day:null,overdue:[],dueIds:[],progress:progress(null,day)};
    parseDay(day);const at=Date.parse(day+'T16:00:00+08:00');
    return {day:plan.days.find(d=>d.day===day)||null,overdue:plan.days.filter(d=>d.day<day).flatMap(d=>d.tasks.filter(t=>eligible(t)&&!done(t)).map(t=>({...t,day:d.day}))),dueIds:Object.entries(review).filter(([,r])=>r.last&&r.due<=at).map(([id])=>id),progress:progress(plan,day)};
  }
  return {minutes,names,normalize,chinaDay,create,append,setTask,daily,progress,eligible};
});
