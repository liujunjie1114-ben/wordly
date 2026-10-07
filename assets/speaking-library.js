(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WordlySpeakingLibrary=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const builtins=[{
    id:'course-impressed',part:2,title:'一门让你印象深刻的课程',
    titleEn:'Describe a course that impressed you a lot',file:'speaking-part2-course.html',
    description:'工业设计暑期课程：题卡四问、关键词、故事线、稳定版答案、高频纠错和串题思路。',
    keywords:'summer school, industrial design, university, lecture + projects, basic electronics, solve real problems',
    cue:'What the course was about\nWhere you took the course\nWhat you did during the course\nExplain why it impressed you a lot',
    tags:'课程，设计，经历',related:'课程 · 重要决定 · 敬佩的人 · 成功人士 · 有用技能 · 改变想法的经历',status:'ready'
  }];
  const storybank=typeof module==='object'&&module.exports?require('./speaking-storybank.js'):(globalThis.WordlySpeakingStorybank||[]);
  const originalCourse=builtins[0];
  if(storybank.length)builtins.splice(0,1,...storybank.map(e=>e.id===originalCourse.id?{...originalCourse,...e,cue:originalCourse.cue}:e));
  const fields=[
    ['title','题目名称',200,'例如：一门让我印象深刻的课程','input'],
    ['cue','题卡／问题',4000,'写下英文题卡或这次练习的问题。'],
    ['keywords','关键词',1000,'例如：summer school, design, prototype','input'],
    ['story','故事线／内容提纲',12000,'背景 → 具体经历 → 细节 → 原因与影响。可以先写中文。'],
    ['answer','我的答案',30000,'写下你练过的版本，后面可以继续修改。'],
    ['corrections','这次的错误与修改',12000,'原表达 → 修改后的表达 → 原因；每行记录一个。'],
    ['next','下次练习重点',4000,'例如：统一过去时、减少重复词、补充一个具体例子。'],
    ['tags','主题标签',300,'例如：课程，经历，设计','input']
  ];
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function filterEntries(entries,{part=0,query='',cluster='',status='',source=''}={}){const q=query.trim().toLowerCase();return entries.filter(e=>(!+part||(+part===4?e.kind==='reference':e.part===+part))&&(!source||(source==='builtin'?e.builtin===true:e.builtin===false))&&(!cluster||e.cluster===cluster)&&(!status||(status==='pending'?(e.needsPersonalDetails||e.status==='draft'):!e.needsPersonalDetails&&e.status!=='draft'))&&(!q||[e.title,e.titleEn,e.cue,e.keywords,e.tags,e.story,e.answer,e.corrections,e.activeVocabulary,e.searchText,e.clusterLabel,e.related].some(v=>String(v||'').toLowerCase().includes(q))));}
  function upsertEntry(entries,entry){if(!entry?.id||!String(entry.title||'').trim())throw Error('请填写题目名称。');const old=entries.find(e=>e.id===entry.id);const next={...old,...entry,created:old?.created||entry.created};return old?entries.map(e=>e.id===entry.id?next:e):[next,...entries];}
  let config=null,container=null,mode='list',selected=null,part=0,query='',cluster='',statusFilter='',sourceFilter='',limit=12,draftTimer=null,editing=null;
  const script=typeof document!=='undefined'?document.currentScript:null;
  const assetBase=script?new URL('.',script.src):null;
  const version=script?new URL(script.src).searchParams.get('v'):'';
  const icon=name=>`<svg class="ui-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${name==='add'?'<path d="M12 5v14M5 12h14"/>':name==='arrow'?'<path d="M5 12h14m-5-5 5 5-5 5"/>':'<path d="M4 6h6l2 2h8v12H4z"/><path d="M4 6V4h7l2 2"/>'}</svg>`;
  const state=()=>config?.getState()||{entries:[],draft:null};
  const entries=()=>[...builtins.map(e=>({...e,builtin:true})),...state().entries.map(e=>({...e,builtin:false}))];
  const date=value=>value&&Number.isFinite(new Date(value).getTime())?new Intl.DateTimeFormat('zh-CN',{month:'numeric',day:'numeric',timeZone:'Asia/Shanghai'}).format(new Date(value)):'';
  const body=text=>`<div class="material-body">${escape(text)}</div>`;
  function configure(value){config=value;}
  function mount(node){container=node;if(mode==='form'&&state().draft)editing=state().draft;draw();}
  function beforeRender(){if(container)flushDraft();container=null;}
  function collect(){
    const form=container?.querySelector('#materialForm');if(!form)return null;
    const data={...editing};
    fields.forEach(([key])=>data[key]=form.elements.namedItem(key).value);
    data.part=+form.elements.namedItem('part').value;
    data.status=form.elements.namedItem('status').value;
    data.updated=Date.now();
    return fields.some(([key])=>data[key].trim())?data:null;
  }
  function flushDraft(){
    clearTimeout(draftTimer);draftTimer=null;
    if(mode!=='form'||!container?.querySelector('#materialForm'))return true;
    const next=collect(),ok=config.setState(state().entries,next);
    const status=container.querySelector('#materialDraftStatus');
    if(status)status.textContent=ok?(next?'草稿已自动保存':'填写后自动保存草稿'):'草稿保存失败，请先复制内容或导出备份。';
    return ok;
  }
  function formFor(value={}){editing={id:null,part:2,title:'',cue:'',keywords:'',story:'',answer:'',corrections:'',next:'',tags:'',status:'draft',sourceId:'',created:0,updated:0,...value};mode='form';draw();container.querySelector('[name="title"]')?.focus();}
  function card(entry){
    const tags=(entry.tags||'').split(/[,，、\n]/).map(s=>s.trim()).filter(Boolean).slice(0,4);
    const summary=entry.description||entry.story||entry.answer||entry.cue||'这份整理还可以继续补充关键词、答案和纠错。';
    return `<article class="panel material-card"><div class="material-card-meta"><span>${entry.part?'PART '+entry.part:'方法与地图'}</span><span class="material-status ${entry.status==='ready'?'ready':''}">${escape(entry.statusLabel||(entry.builtin?'已收录整理':entry.status==='ready'?'已整理':'待补充'))}</span></div><h2>${escape(entry.title)}</h2>${entry.titleEn?`<p class="material-title-en">${escape(entry.titleEn)}</p>`:''}<p class="material-excerpt">${escape(summary.slice(0,160))}</p><div class="material-tags">${tags.map(t=>`<span>${escape(t)}</span>`).join('')}</div><div class="material-card-footer"><small>${entry.builtin?(entry.clusterLabel||'全量口语资料')+' · PDF '+(entry.sourcePages||[]).join('、')+' 页':'我的练习'+(entry.updated?' · '+date(entry.updated)+' 更新':'')}</small><button class="btn light small" data-material-open="${escape(entry.id)}">${entry.builtin?'阅读整理':'打开整理'}${icon('arrow')}</button></div></article>`;
  }
  function listMarkup(){
    const all=entries(),mine=state().entries,draft=state().draft;
    const groups=[...new Map(builtins.filter(e=>e.cluster).map(e=>[e.cluster,e.clusterLabel])).entries()];
    return `<section class="panel material-header"><div class="material-heading"><span class="material-heading-icon">${icon('folder')}</span><div><div class="material-kicker">SPEAKING NOTEBOOK</div><h1>口语整理库</h1><p>练过一题，留下题卡、故事线和纠错。以后继续补充。</p></div></div><div class="material-header-actions">${draft?'<button class="btn light small" data-material-resume>继续草稿</button>':''}<button class="btn small" data-material-new>${icon('add')}新增练习整理</button></div></section>
      <section class="panel material-bank-summary"><div><strong>你的全量口语资料</strong><p>20 道 Part 2 · 28 个 Part 1 话题 · 12 组 Part 3 逻辑<br>另有 6 个待补题、老师点评和全局纠错。原文 28 页完整保留。</p></div><div><button class="btn light small" data-material-open="REFERENCE-MAP">${icon('folder')}串题地图</button><a class="material-text-button" href="${escape(new URL('speaking-storybank-2026-10-07.pdf',assetBase).href)}" target="_blank" rel="noopener">查看原 PDF ↗</a></div></section>
      <div class="material-library-meta"><span>${builtins.length} 份已收录整理 <span>／</span> ${mine.length} 份我的练习</span><button class="material-text-button" data-material-backup>设置与备份${icon('arrow')}</button></div>
      <section class="panel material-tools"><div class="material-filters" role="group" aria-label="口语整理分类">${[0,1,2,3,4].map(p=>`<button aria-pressed="${part===p}" data-material-part="${p}" class="${part===p?'selected':''}">${p===4?'方法与地图':p?'Part '+p:'全部'}<span>${filterEntries(all,{part:p}).length}</span></button>`).join('')}</div><input class="search" id="materialSearch" aria-label="搜索口语整理" placeholder="搜索题目、故事、表达或纠错" value="${escape(query)}"><div class="material-secondary-filters"><label>来源<select id="materialSource" aria-label="按资料来源筛选"><option value="">全部资料</option><option value="builtin" ${sourceFilter==='builtin'?'selected':''}>已收录资料</option><option value="mine" ${sourceFilter==='mine'?'selected':''}>我的练习</option></select></label><label>故事<select id="materialCluster" aria-label="按故事筛选"><option value="">全部故事</option>${groups.map(([id,label])=>`<option value="${escape(id)}" ${cluster===id?'selected':''}>${escape(label)}</option>`).join('')}</select></label><label>状态<select id="materialStatus" aria-label="按整理状态筛选"><option value="">全部状态</option><option value="available" ${statusFilter==='available'?'selected':''}>已有可练素材</option><option value="pending" ${statusFilter==='pending'?'selected':''}>待补充／待续练</option></select></label></div></section>
      <div class="material-grid" id="materialResults">${resultsMarkup()}</div><section class="material-next"><span class="material-next-icon">${icon('add')}</span><div><h2>下一题，从这里开始</h2><p>可以先保存题目和关键词，再慢慢完善答案与纠错。未完成的整理会标记为“待补充”。</p><small>你的补充保存在当前浏览器；换设备前请导出学习备份。</small></div><button class="btn light small" data-material-new>添加我的练习</button></section>`;
  }
  function resultsMarkup(){const shown=filterEntries(entries(),{part,query,cluster,status:statusFilter,source:sourceFilter});return shown.length?shown.slice(0,limit).map(card).join('')+(shown.length>limit?`<div class="material-more"><span>已显示 ${Math.min(limit,shown.length)} / ${shown.length} 份</span><button class="btn light small" data-material-more>再显示 12 份${icon('arrow')}</button></div>`:''):'<div class="panel material-empty"><h2>这里还没有整理</h2><p>换一个筛选条件，或新增这一类的练习。</p><button class="btn light small" data-material-new>新增练习整理</button></div>';}
  function detailMarkup(entry){
    const header=`<div class="material-detail-nav"><button class="btn light small" data-material-list>← 返回整理库</button><span>${entry.part?'PART '+entry.part:'方法与地图'} · ${entry.builtin?'已收录整理':'我的练习'}</span>${entry.kind==='reference'?'':`<button class="btn small" data-material-edit="${escape(entry.id)}">${entry.builtin?'补充本题':'继续编辑'}</button>`}</div>`;
    if(entry.builtin){const url=new URL(entry.file,assetBase);if(version)url.searchParams.set('v',version);const linked=builtins.filter(e=>e.id!==entry.id&&entry.cluster&&e.cluster===entry.cluster&&e.kind==='part2');return header+`<div class="material-reading"><iframe src="${escape(url.href)}" title="${escape(entry.title)}：完整口语整理" class="material-course-frame"></iframe></div>${entry.related||linked.length?`<div class="panel material-related"><h2>一个故事，可以迁移到这些题</h2><p>${escape(entry.related)}</p><div class="material-linked">${linked.map(e=>`<button class="btn light small" data-material-open="${escape(e.id)}">${escape(e.title)}${icon('arrow')}</button>`).join('')}</div></div>`:''}`;}
    const source=builtins.find(e=>e.id===entry.sourceId);
    return header+`<article class="panel material-personal-detail"><div class="material-kicker">PART ${entry.part} · ${entry.status==='ready'?'已整理':'待补充'}</div><h1>${escape(entry.title)}</h1>${source?`<button class="material-text-button" data-material-open="${escape(source.id)}">查看原题整理 →</button>`:''}${fields.filter(([key])=>!['title','tags'].includes(key)).map(([key,label])=>`<section><h2>${escape(label)}</h2>${entry[key]?body(entry[key]):'<p class="material-unfilled">尚未填写，可以在“继续编辑”中补充。</p>'}</section>`).join('')}</article>`;
  }
  function formMarkup(){
    return `<section class="panel material-form-panel"><div class="material-form-heading"><div><div class="material-kicker">MY PRACTICE</div><h1>${editing.id?'完善练习整理':'新增练习整理'}</h1><p>先留下能记住的内容；空白部分以后再补。</p></div><button class="btn light small" data-material-list>返回，保留草稿</button></div><form id="materialForm"><div class="material-form-grid"><label class="material-field material-full"><span class="material-field-label">题目名称 *</span><input name="title" aria-label="题目名称" maxlength="200" required value="${escape(editing.title)}" placeholder="例如：一门让我印象深刻的课程"></label><label class="material-field">Part 分类<select name="part" aria-label="Part 分类">${[1,2,3].map(p=>`<option value="${p}" ${editing.part===p?'selected':''}>Part ${p}</option>`).join('')}</select></label><label class="material-field">整理状态<select name="status" aria-label="整理状态"><option value="draft" ${editing.status==='draft'?'selected':''}>待补充</option><option value="ready" ${editing.status==='ready'?'selected':''}>已整理</option></select></label>${fields.filter(([key])=>key!=='title').map(([key,label,max,placeholder,type])=>`<label class="material-field material-full">${escape(label)}${type==='input'?`<input name="${key}" aria-label="${escape(label)}" maxlength="${max}" value="${escape(editing[key])}" placeholder="${escape(placeholder)}">`:`<textarea name="${key}" aria-label="${escape(label)}" maxlength="${max}" rows="${key==='answer'?8:3}" placeholder="${escape(placeholder)}">${escape(editing[key])}</textarea>`}</label>`).join('')}</div><div class="material-form-footer"><p id="materialDraftStatus" role="status" aria-live="polite">草稿会自动保存；切换栏目后可以继续填写。</p><button class="btn" type="submit">保存整理${icon('arrow')}</button></div></form></section>`;
  }
  function draw(){
    if(!container||!config)return;
    let entry=selected?entries().find(e=>e.id===selected):null;
    if(mode==='detail'&&!entry)mode='list';
    container.innerHTML=mode==='form'?formMarkup():mode==='detail'?detailMarkup(entry):listMarkup();
    bind();
  }
  function showList(){if(!flushDraft())return;mode='list';draw();container?.scrollIntoView({block:'start'});}
  function bindResults(){
    container.querySelectorAll('#materialResults [data-material-open]').forEach(b=>b.onclick=()=>{selected=b.dataset.materialOpen;mode='detail';draw();container?.scrollIntoView({block:'start'});});
    container.querySelectorAll('#materialResults [data-material-new]').forEach(b=>b.onclick=()=>formFor(state().draft||{part:part>=1&&part<=3?part:2}));
    container.querySelector('[data-material-more]')?.addEventListener('click',()=>{limit+=12;container.querySelector('#materialResults').innerHTML=resultsMarkup();bindResults();});
  }
  function bind(){
    container.querySelectorAll('[data-material-new]').forEach(b=>b.onclick=()=>{const draft=state().draft;if(draft){formFor(draft);config.notify('已恢复未完成草稿；保存后可新增下一题。');}else formFor({part:part>=1&&part<=3?part:2});});
    container.querySelector('[data-material-resume]')?.addEventListener('click',()=>formFor(state().draft));
    container.querySelector('[data-material-backup]')?.addEventListener('click',()=>config.openBackup());
    container.querySelectorAll('[data-material-list]').forEach(b=>b.onclick=showList);
    container.querySelectorAll('[data-material-open]').forEach(b=>b.onclick=()=>{selected=b.dataset.materialOpen;mode='detail';draw();container?.scrollIntoView({block:'start'});});
    container.querySelectorAll('[data-material-edit]').forEach(b=>b.onclick=()=>{
      const e=entries().find(e=>e.id===b.dataset.materialEdit),draft=state().draft;
      if(draft){formFor(draft);if(draft.id!==e?.id)config.notify('先保存当前草稿，再开始另一份整理。');return;}
      if(e)formFor(e.builtin?{title:e.title,part:e.part,cue:e.cue,keywords:e.keywords,tags:e.tags,sourceId:e.id}:e);
    });
    container.querySelectorAll('[data-material-part]').forEach(b=>b.onclick=()=>{part=+b.dataset.materialPart;limit=12;draw();});
    container.querySelector('#materialSearch')?.addEventListener('input',e=>{query=e.target.value;limit=12;container.querySelector('#materialResults').innerHTML=resultsMarkup();bindResults();});
    container.querySelector('#materialSource')?.addEventListener('change',e=>{sourceFilter=e.target.value;limit=12;draw();});
    container.querySelector('#materialCluster')?.addEventListener('change',e=>{cluster=e.target.value;limit=12;draw();});
    container.querySelector('#materialStatus')?.addEventListener('change',e=>{statusFilter=e.target.value;limit=12;draw();});
    bindResults();
    const form=container.querySelector('#materialForm');
    if(form){form.addEventListener('input',()=>{clearTimeout(draftTimer);const status=container.querySelector('#materialDraftStatus');if(status)status.textContent='正在保存草稿…';draftTimer=setTimeout(flushDraft,500);});form.addEventListener('submit',e=>{
      e.preventDefault();clearTimeout(draftTimer);draftTimer=null;
      const data=collect();if(!data?.title.trim()){config.notify('请填写题目名称。');return;}
      const now=Date.now(),entry={...data,title:data.title.trim(),id:data.id||config.createId(),created:data.created||now,updated:now};
      if(config.setState(upsertEntry(state().entries,entry),null)){editing=null;selected=entry.id;mode='detail';draw();config.notify('整理已保存，可以随时继续完善。');container?.scrollIntoView({block:'start'});}
    });}
  }
  if(typeof window!=='undefined'){window.addEventListener('pagehide',flushDraft);window.addEventListener('beforeunload',e=>{if(!flushDraft()){e.preventDefault();e.returnValue='';}});}
  return {builtins,escape,filterEntries,upsertEntry,configure,mount,beforeRender,beforeNavigate:flushDraft};
});
