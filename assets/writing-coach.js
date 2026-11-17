(function(root,factory){const common=typeof module==='object'&&module.exports,api=factory(common?require('./study-core.js'):root.WordlyStudyCore);if(common)module.exports=api;else root.WordlyWritingCoach=api;})(typeof globalThis!=='undefined'?globalThis:this,function(core){
 'use strict';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let config={},generation=0;
 function configure(value){config={...config,...value};}
 function normalize(value){
  if(value==null)return null;
  const str=(s,max)=>typeof s==='string'&&s.length<=max;
  if(!str(value.title,500)||!value.title.trim()||!Array.isArray(value.sections)||!value.sections.length||value.sections.length>50||value.sections.some(s=>!s||!str(s.id,100)||!/^[a-z0-9-]+$/.test(s.id)||!str(s.title,500)||!s.title.trim()||!str(s.html,200000))||new Set(value.sections.map(s=>s.id)).size!==value.sections.length||value.sections.reduce((n,s)=>n+s.html.length,0)>2000000)throw Error('教练正文格式不正确，原学习记录保持不变。');
  if(value.entryIds!==undefined&&(!Array.isArray(value.entryIds)||value.entryIds.length>1000||value.entryIds.some(id=>typeof id!=='string'||!/^[\w-]{1,100}$/.test(id))||new Set(value.entryIds).size!==value.entryIds.length))throw Error('教练资料编号不正确。');
  return {title:value.title,subtitle:str(value.subtitle,2000)?value.subtitle:'',sections:value.sections.map(s=>({id:s.id,title:s.title,html:s.html})),...(value.entryIds?{entryIds:[...value.entryIds]}:{})};
 }
 function validate(value){const course=normalize(value);if(!course)throw Error('请选择完整教练包。');return {...course,pack:core.readPack(value.pack)};}
 function preserveMaterials(current,latest,course,baseline){
  const state=core.normalizeState(current);
  if(!course?.entryIds?.length)return state;
  const saved=core.normalizeState(latest),base=core.normalizeState(baseline),ids=new Set(course.entryIds),entries=new Map(state.entries.map(e=>[e.id,e])),original=new Map(base.entries.map(e=>[e.id,e])),review={...state.review};
  const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const choose=(a,b,old)=>{if(equal(a,old)||equal(a,b))return b;if(equal(b,old))return a;throw Error('其他标签页也修改了课程资料，请先保留当前编辑并重新打开资料库。');};
  for(const e of saved.entries)if(ids.has(e.id)){
   entries.set(e.id,choose(entries.get(e.id),e,original.get(e.id)));
   const progress=choose(review[e.id],saved.review[e.id],base.review[e.id]);if(progress)review[e.id]=progress;else delete review[e.id];
  }
  for(const id of ids)if(!entries.has(id))throw Error('课程配套资料已缺失，请重新打开资料库。');
  const imports=new Map(state.imports.map(item=>[item.id,item]));
  for(const item of saved.imports)imports.set(item.id,item);
  return core.normalizeState({...state,entries:[...entries.values()],review,imports:[...imports.values()]});
 }
 function resolveEntryIds(pack,entries){
  const canonical=s=>s.normalize('NFKC').toLowerCase().trim().replace(/\s+/g,' '),key=e=>e.kind+'|'+canonical(e.identity),byId=new Map(entries.map(e=>[e.id,e])),byKey=new Map(entries.map(e=>[key(e),e]));
  return [...new Set(pack.entries.map(e=>{const retained=byId.get(e.id)||byKey.get(key(e));if(!retained)throw Error('配套资料尚未合并。');return retained.id;}))];
 }
 function safeHtml(html){
  const template=document.createElement('template');template.innerHTML=html;
  const allowed=new Set(['P','DIV','SECTION','ARTICLE','SPAN','H1','H2','H3','H4','H5','H6','STRONG','B','EM','I','U','S','BR','HR','UL','OL','LI','BLOCKQUOTE','PRE','CODE','TABLE','THEAD','TBODY','TFOOT','TR','TH','TD','A','DETAILS','SUMMARY','SUP','SUB']);
  for(const element of template.content.querySelectorAll('*')){
   if(!allowed.has(element.tagName)){element.remove();continue;}
   for(const attribute of [...element.attributes])if(!(['colspan','rowspan'].includes(attribute.name)&&/^\d{1,2}$/.test(attribute.value))&&!(element.tagName==='A'&&attribute.name==='href'&&/^(https?:\/\/|#[a-z0-9-])/i.test(attribute.value)))element.removeAttribute(attribute.name);
   if(element.tagName==='A'&&/^https?:/.test(element.getAttribute('href')||'')){element.target='_blank';element.rel='noopener noreferrer';}
  }
  return template.innerHTML;
 }
 function download(data){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='Wordly完整写作教练包.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 async function mount(node){
  const current=++generation,local=['127.0.0.1','localhost'].includes(location.hostname);
  let data=config.getCourse?.()||null,selected=0,busy=false,localRead=null;
  const active=()=>generation===current&&node.isConnected!==false&&!!node.querySelector('[data-coach-content]');
  node.innerHTML='<div class="heading"><div><div class="eyebrow">WRITING COACH</div><h1>写作教练</h1><p>先读完整讲解，再用复习卡回忆。中文意思 → 英文表达 → 句子作用。</p></div></div><div class="wc-tools"><label class="btn light wc-import">导入完整教练包<input type="file" accept=".json,application/json" data-coach-file></label><button class="btn light" data-coach-export hidden>导出完整教练包</button>'+(local?'<button class="btn light" data-coach-local>合并本机最新课程</button>':'<a class="btn light" href="http://127.0.0.1:43142/#writing-coach" target="_blank" rel="noopener">打开本机教练</a>')+'</div><p class="wc-note" role="status" data-coach-status></p><div data-coach-content></div>';
  const status=message=>{if(active())node.querySelector('[data-coach-status]').textContent=message;};
  function show(index){
   if(!data||!active())return;selected=Math.max(0,Math.min(data.sections.length-1,index));const section=data.sections[selected];
   node.querySelector('[data-coach-body]').innerHTML=`<p class="wc-note">第 ${selected+1} / ${data.sections.length} 节</p><h2>${esc(section.title)}</h2>${safeHtml(section.html)}<div class="wc-tools"><button class="btn light" data-coach-step="-1" ${selected===0?'disabled':''}>上一课</button><button class="btn" data-coach-step="1" ${selected===data.sections.length-1?'disabled':''}>下一课</button></div>`;
   for(const b of node.querySelectorAll('[data-coach-section]')){const chosen=+b.dataset.coachSection===selected;b.classList.toggle('is-active',chosen);if(chosen)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');}
  }
  function draw(){
   if(!active())return;node.querySelector('[data-coach-export]').hidden=!data;
   node.querySelector('[data-coach-content]').innerHTML=data?`<p>${esc(data.subtitle)}</p><div class="wc-tools"><button class="btn light" data-coach-cards>复习配套资料（${data.entryIds?.length||0} 条）</button></div><div class="wc-layout"><nav class="wc-menu" aria-label="教练课目录">${data.sections.map((s,i)=>`<button type="button" data-coach-section="${i}">${i+1}. ${esc(s.title)}</button>`).join('')}</nav><article class="wc-lesson" data-coach-body></article></div>`:'<section class="panel"><h2>把完整教练课合并进来</h2><p>选择从本机 Wordly 导出的“Wordly完整写作教练包.json”，即可在这里阅读正文和复习配套资料。只有复习卡的资料包请到“资料复习”导入。</p><p>课程保存在当前浏览器，并随“设置与备份”的完整备份保留；不同网址的数据需要手动导入。</p></section>';
   show(selected);
  }
  function merge(raw){
   const next=validate(raw),course={...normalize(next),entryIds:next.pack.entries.map(e=>e.id)};
   if(!config.importPack(next.pack,course))throw Error('课程未能保存。请先导出备份并检查浏览器存储空间。');
   data=config.getCourse?.()||course;selected=0;draw();status(`已合并 ${data.sections.length} 节完整教学、${data.entryIds.length} 条资料。重复导入不增加副本；原学习记录保留，阅读不自动计为练习通过。`);
  }
  async function readLocal(){
   if(busy)return;busy=true;status('正在读取本机完整教练课…');
   try{const response=await fetch('/personal-writing/教练正文.json',{cache:'no-store'});if(!response.ok)throw Error('本机课程尚未载入，请运行 D 盘写作教练的“双击启动.cmd”，或导入完整教练包。');const raw=await response.json();if(active())merge(raw);}catch(error){status(error.message);}finally{busy=false;}
  }
  node.querySelector('[data-coach-file]').onchange=async e=>{
   const file=e.target.files[0];if(!file)return;if(localRead){await localRead;if(!active())return;}if(busy){e.target.value='';return;}busy=true;
   try{if(file.size>8*1024*1024)throw Error('教练包超过 8 MB，请检查是否选择了正确文件。');const raw=JSON.parse(await file.text());if(active())merge(raw);}catch(error){status('导入未完成：'+error.message);}finally{busy=false;e.target.value='';}
  };
  node.onclick=e=>{
   const section=e.target.closest('[data-coach-section]'),step=e.target.closest('[data-coach-step]');
   if(section||step){show(section?+section.dataset.coachSection:selected+ +step.dataset.coachStep);node.querySelector('[data-coach-body]')?.scrollIntoView({block:'start'});}
   if(e.target.closest('[data-coach-cards]')&&data)config.openCards(data.entryIds||[]);
   if(e.target.closest('[data-coach-local]'))localRead=readLocal();
   if(e.target.closest('[data-coach-export]')&&data){try{download(validate({...data,pack:config.getPack(data.entryIds||[])}));status('已导出完整教练包，可在其他 Wordly 网址导入。学习进度请另存完整备份。');}catch(error){status('导出未完成：'+error.message);}}
  };
  draw();if(data)status('已载入本浏览器保存的完整课程。课程正文随完整学习备份保留。');else if(local)await (localRead=readLocal());
 }
 return {configure,mount,normalize,validate,resolveEntryIds,preserveMaterials};
});
