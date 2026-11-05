(function(root,factory){const common=typeof module==='object'&&module.exports,api=factory(common?require('./study-core.js'):root.WordlyStudyCore,common?require('./card-review.js'):root.WordlyCardReview);if(common)module.exports=api;else root.WordlyTypeTrainer=api;})(typeof globalThis!=='undefined'?globalThis:this,function(core,review){
  'use strict';
  const esc=core.escape;
  const subjects={...core.subjects,words:'词汇'};
  const rules={
    listening:[['地图题',/地图|方位|路线|map|direction/i],['选择题',/单选|多选|选择|choice/i],['配对题',/配对|匹配|matching/i],['填空题',/填空|单复数|词性|词形|completion/i],['数字与辨音',/数字|拼读|辨音|听辨|连读|弱读|发音|double|triple|teen/i]],
    reading:[['判断题',/判断|not given|true.*false|yes.*no/i],['填空题',/填空|摘要|completion|summary/i],['匹配题',/匹配|配对|heading|matching/i],['选择题',/选择|单选|多选|choice/i],['同义替换',/同义|同替|替换|synonym/i],['定位与证据',/定位|证据|扫读|略读|skimming|scanning/i],['长难句',/长难句|句子分析|句法|倒装|从句|非谓语/i]],
    writing:[['小作文 · 地图',/地图|map/i],['小作文 · 流程图',/流程|process/i],['小作文 · 图表',/饼图|柱状|折线|表格|图表|数据|小作文|task ?1|百分比|占比|静态图|动态图|趋势|总览|倍数|组成关系|respectively/i],['大作文 · 题型与论证',/大作文|task ?2|观点|论证|优缺点|利弊|双边|讨论|agree|disagree|essay|原因|解决/i],['段落与衔接',/段落|开头|主体|结尾|衔接|连接|让步段|peel|topic sentence/i],['表达与改写',/改写|转述|表达|搭配|句式|paraphrase/i]],
    speaking:[['Part 3 · 讨论',/part ?3|\bp3\b|抽象|深度讨论/i],['Part 2 · 话题卡',/part ?2|\bp2\b|人物题|地点题|物品题|事件题|题卡|两分钟/i],['Part 1 · 问答',/part ?1|\bp1\b|日常问答|自然拓展/i],['发音与流利度',/发音|流利|连读|重音|节奏|停顿/i]],
    grammar:[['倒装句',/倒装|only/i],['从句',/从句|定语|状语|宾语从句|主语从句/i],['非谓语',/非谓语|分词|动名词|不定式|动词形式|like watching/i],['主谓一致',/主谓一致|一致性/i],['时态与语态',/时态|语态|被动|完成时|过去时|have done/i],['比较与倍数',/比较|最高级|倍数/i],['词法与搭配',/词性|名词|冠词|介词|词法|搭配|可数|单复数|词形|情态动词|动词原形/i]]
  };
  function typeOf(e,subject){
    if(e.kind==='vocabulary')return '词汇与搭配';
    // Classify from the card's own heading, tags and application; examples must not override its topic.
    for(const haystack of [e.title||'',(e.tags||[]).join(' '),e.application||'']){const match=(rules[subject]||[]).find(([,rule])=>rule.test(haystack));if(match)return match[0];}return '综合方法';
  }
  function groups(entries,{subject='',type='',kind='knowledge'}={}){
    const buckets=new Map();
    for(const e of entries){
      if(e.status!=='ready'||kind&&e.kind!==kind)continue;
      const areas=e.kind==='vocabulary'?['words']:[...new Set((e.categories||[]).filter(s=>Object.hasOwn(core.subjects,s)))];
      for(const area of areas){if(subject&&area!==subject)continue;const category=typeOf(e,area);if(type&&category!==type)continue;const key=area+'|'+category;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(e.id);}
    }
    return [...buckets].flatMap(([key,ids])=>{const [area,category]=key.split('|');return Array.from({length:Math.ceil(ids.length/16)},(_,i)=>({id:key+'|'+i,subject:area,type:category,number:i+1,ids:ids.slice(i*16,i*16+16)}));});
  }
  function progress(state,id){
    const attempts=state.learning?.[id]?.recallAttempts||[],e=state.entries.find(e=>e.id===id),reference=e?(e.kind==='vocabulary'?e.zh:e.summary||e.explanation):'',prompt=e?.question||e?.en||e?.title||'';let streak=0;
    for(let i=attempts.length-1;i>=0&&attempts[i].assessment==='remembered'&&attempts[i].reference===reference&&attempts[i].prompt===prompt;i--)streak++;
    return {first:attempts[0]||null,latest:attempts.at(-1)||null,count:attempts.length,streak,passed:streak>=2};
  }
  function create(config){
    let node=null,subject='',type='',kind='knowledge',query='',limit=12,groupId=null,runIds=[],index=0,mode='catalogue',revealed=false,dirty=false,answer='',sheetAnswers={},reviewing=false;
    const state=()=>config.getState(),save=next=>(config.setLearningState||config.setState)(next),all=()=>state().entries;
    const catalogue=()=>groups(all(),{subject,type,kind});
    const current=()=>all().find(e=>e.id===runIds[index]);
    const group=()=>groups(all(),{kind}).find(g=>g.id===groupId);
    function beforeNavigate(){if(dirty){config.notify('本题回答尚未保存，请先保存草稿或查看依据。');return false;}return true;}
    function open(options={}){if(!beforeNavigate())return false;if(options.subject!==undefined){subject=options.subject==='words'?'words':Object.hasOwn(core.subjects,options.subject)?options.subject:'';kind=subject==='words'?'vocabulary':'knowledge';type='';groupId=null;mode='catalogue';}return true;}
    function load(){answer=state().learning?.[runIds[index]]?.recallDraft||'';dirty=false;revealed=reviewing&&!!answer.trim();}
    function start(g,weak=false){if(!g||!beforeNavigate())return;groupId=g.id;runIds=g.ids.filter(id=>!weak||!progress(state(),id).passed);index=0;mode=runIds.length?'sheet':'complete';reviewing=false;sheetAnswers=Object.fromEntries(runIds.map(id=>[id,state().learning?.[id]?.recallDraft||'']));load();draw();}
    function persistAnswer(){const e=current();if(!e)return false;try{if(!save(core.saveRecallDraft(state(),e.id,answer))){config.notify('回答未能保存，请重试或导出备份。');return false;}dirty=false;return true;}catch(err){config.notify(err.message);return false;}}
    function groupCard(g){const n=g.ids.filter(id=>progress(state(),id).passed).length,attempted=g.ids.filter(id=>progress(state(),id).count).length;return `<article class="panel tt-group"><span class="study-eyebrow">${esc(subjects[g.subject])} · ${esc(g.type)}</span><h2>${esc(g.type)} · 第 ${g.number} 组</h2><p>${g.ids.length} 张卡 · 已练 ${attempted} 张 · 自评达标 ${n}/${g.ids.length}</p><progress value="${n}" max="${g.ids.length}" aria-label="本组自评达标进度"></progress><div class="study-actions"><button class="btn" data-tt-start="${esc(g.id)}">${attempted?'整组再测 / 继续草稿':'开始本组'}</button><button class="btn light small" data-tt-weak="${esc(g.id)}">薄弱卡重练 ${g.ids.length-n}</button></div></article>`;}
    function list(){
      const raw=groups(all(),{subject,kind}),types=[...new Set(raw.map(g=>g.type))],byId=new Map(all().map(e=>[e.id,e])),list=catalogue().filter(g=>!query||g.ids.some(id=>(byId.get(id)?.title||'').toLowerCase().includes(query.toLowerCase()))),pending=all().filter(e=>e.status!=='ready'&&(kind===e.kind)&&(!subject||subject==='words'||e.categories.includes(subject))).length;
      return `<header class="study-head"><div><span class="study-eyebrow">LEARN · PRACTISE · REVIEW</span><h1>按题型，滚动过关。</h1><p>先写下回答，再对照依据；薄弱卡反复练，下一轮仍要独立回忆。</p></div></header><div class="tt-flow"><span>① 按科目与题型选组</span><span>② 独立回答</span><span>③ 依据复盘</span><span>④ 薄弱重练</span><span>⑤ 整组再测</span></div><div class="study-tabs" aria-label="训练科目">${[['','全部科目'],...Object.entries(subjects)].map(([s,label])=>`<button data-tt-subject="${s}" aria-pressed="${subject===s}">${label}</button>`).join('')}</div><section class="tt-filters"><b>按题型</b><div class="study-tabs">${['',...types].map(t=>`<button data-tt-type="${esc(t)}" aria-pressed="${type===t}">${esc(t||'全部题型')} <small>${raw.filter(g=>!t||g.type===t).length}</small></button>`).join('')}</div><label>搜索本题型的卡片<input class="search" data-tt-search value="${esc(query)}" placeholder="搜索方法、题目或关键词"></label></section><p class="study-caption">方法题采用自主对照：每张卡连续两次独立作答后自评“记得”才达标，任一次“还不熟”会重新累计。此状态与自动检测成绩分开。${pending?`另有 ${pending} 张待核对卡未加入闯关。`:''}</p><p class="study-caption">题型依据现有标题、标签与适用场景整理；未明确的卡片放在“综合方法”。</p><div class="study-results">${list.slice(0,limit).map(groupCard).join('')||'<section class="panel study-empty"><h2>这个分类暂无可练卡片</h2><p>可以切换科目、题型，或先在“全部资料”导入课程资料。</p></section>'}</div>${list.length>limit?'<button class="btn light" data-tt-more>再显示 12 组</button>':''}`;
    }
    function sheet(){
      const g=group(),byId=new Map(all().map(e=>[e.id,e]));if(!g)return list();
      return `<header class="cr-nav"><div class="cr-nav-head"><div><span class="study-eyebrow">${esc(subjects[g.subject])} · ${esc(g.type)}</span><h2>完整题面 · 第 ${g.number} 组 <small>${runIds.length} 张</small></h2></div><button class="btn light small" data-tt-list>返回题型目录</button></div><p class="cr-caption">先独立作答，本页不显示答案；保存本组后逐题对照依据，再重练薄弱卡。</p></header><section class="panel tt-sheet"><h2>${esc(g.type)} · 回忆与辨析</h2><form id="ttSheetForm"><ol>${runIds.map(id=>{const e=byId.get(id),p=progress(state(),id);return `<li><label><b>${esc(e.kind==='vocabulary'?e.en:e.question||e.title)}</b><textarea data-tt-sheet-answer="${esc(id)}" maxlength="4000" required placeholder="写下你的回答、判断理由或解题步骤">${esc(sheetAnswers[id]||'')}</textarea></label><small>当前连续自评记得 ${Math.min(2,p.streak)}/2 次</small></li>`;}).join('')}</ol><div class="study-actions"><button class="btn" type="submit">保存本组回答 · 逐题复盘 →</button><button class="btn light" type="button" data-tt-save-sheet>保存整组草稿</button></div></form></section>`;
    }
    function saveSheet(){try{if(!save(core.saveRecallDrafts(state(),sheetAnswers)))return false;dirty=false;return true;}catch(err){config.notify(err.message);return false;}}
    function exercise(){
      const e=current(),g=group();if(!e||!g)return complete();const p=progress(state(),e.id);
      const nav=`<header class="cr-nav"><div class="cr-nav-head"><div><span class="study-eyebrow">${esc(subjects[g.subject])} · ${esc(g.type)} · 第 ${g.number} 组</span><h2>逐题闯关 <small>${index+1} / ${runIds.length} 张</small></h2></div><button class="btn light small" data-tt-list>返回题型目录</button></div><nav class="cr-numbers" aria-label="本轮题号">${runIds.map((id,i)=>{const p=progress(state(),id);return `<button data-tt-index="${i}" aria-pressed="${i===index}"><b>${i+1}</b><small>${p.passed?'自评达标':p.streak?'待复测':p.count?'还需练习':'未作答'}</small></button>`;}).join('')}</nav><p class="cr-caption">先保存本题回答，再查看依据。切题会保留已保存草稿；已完成的卡片仍可重做。</p></header>`;
      return `${nav}${!revealed?`<section class="panel tt-answer"><span class="study-eyebrow">YOUR OWN ANSWER</span><h2>${esc(e.kind==='vocabulary'?e.en:e.question||e.title)}</h2><form id="ttAnswerForm"><label for="ttAnswer">用自己的话回答<textarea id="ttAnswer" name="answer" maxlength="4000" placeholder="先回忆，再写下你的判断、理由或解题步骤。">${esc(answer)}</textarea></label><div class="study-actions"><button class="btn" type="submit">保存回答 · 查看依据</button><button class="btn light" type="button" data-tt-save>保存草稿</button></div></form><p class="study-caption">${p.count?`已练 ${p.count} 次；当前连续自评记得 ${Math.min(2,p.streak)}/2 次。`:'这是本卡的第一次独立作答。'}</p></section>`:`${review.card(e,{editable:false})}<section class="panel tt-assessment"><h2>对照这次回答</h2><p class="study-text">${esc(answer)}</p>${p.first?`<details><summary>保留的首次回答</summary><p class="study-text">${esc(p.first.entered)}</p></details>`:''}<p>核对：结论是否正确？能否解释为什么？是否漏掉适用条件或易错边界？</p><div class="study-actions"><button class="btn light" data-tt-assess="again">还不熟 · 放回薄弱队列</button><button class="btn" data-tt-assess="remembered">记得 · 保存自评并继续</button></div><p class="study-caption">这是你的自主对照，不是系统自动评分。</p></section>`}`;
    }
    function complete(){const g=group();if(!g)return list();const passed=g.ids.filter(id=>progress(state(),id).passed).length;return `<section class="panel tt-complete"><span class="study-eyebrow">ROUND REVIEW</span><h1>${passed===g.ids.length?'本组自评达标':'这一轮已保存'}</h1><p>${esc(subjects[g.subject])} · ${esc(g.type)} · 第 ${g.number} 组</p><h2>${passed} / ${g.ids.length} 张连续两次自评记得</h2><p>首次回答和每次自评都已保留。继续重练薄弱卡，或遮住依据重做整组。</p><div class="study-actions"><button class="btn" data-tt-weak="${esc(g.id)}" ${passed===g.ids.length?'disabled':''}>薄弱卡继续练 ${g.ids.length-passed}</button><button class="btn light" data-tt-start="${esc(g.id)}">整组再测</button><button class="btn light" data-tt-next>下一组 →</button><button class="btn light" data-tt-list>返回题型目录</button></div></section>`;}
    function draw(){if(!node)return;node.innerHTML=`<div class="study-library type-trainer">${mode==='catalogue'?list():mode==='complete'?complete():mode==='sheet'?sheet():exercise()}</div>`;bind();}
    function bind(){
      const on=(selector,event,fn)=>node.querySelectorAll(selector).forEach(el=>el.addEventListener(event,event=>fn(el,event)));
      const getGroup=id=>groups(all(),{kind}).find(g=>g.id===id);
      on('[data-tt-sheet-answer]','input',el=>{sheetAnswers[el.dataset.ttSheetAnswer]=el.value;dirty=true;});
      on('[data-tt-save-sheet]','click',()=>{if(saveSheet())config.notify('整组草稿已保存，尚不计练过或达标。');});
      on('#ttSheetForm','submit',(_el,event)=>{event.preventDefault();if(runIds.some(id=>!sheetAnswers[id]?.trim())){config.notify('请先完成本组回答，或点击保存整组草稿稍后继续。');return;}if(saveSheet()){reviewing=true;mode='exercise';index=0;load();draw();}});
      on('[data-tt-subject]','click',el=>{if(!beforeNavigate())return;subject=el.dataset.ttSubject;kind=subject==='words'?'vocabulary':'knowledge';type='';limit=12;draw();});
      on('[data-tt-type]','click',el=>{type=el.dataset.ttType;limit=12;draw();});
      on('[data-tt-search]','change',el=>{query=el.value.trim();limit=12;draw();});
      on('[data-tt-more]','click',()=>{limit+=12;draw();});
      on('[data-tt-start]','click',el=>start(getGroup(el.dataset.ttStart)));
      on('[data-tt-weak]','click',el=>start(getGroup(el.dataset.ttWeak),true));
      on('[data-tt-list]','click',()=>{if(beforeNavigate()){mode='catalogue';draw();}});
      on('[data-tt-index]','click',el=>{if(!beforeNavigate())return;index=Number(el.dataset.ttIndex);load();draw();});
      on('[data-tt-save]','click',()=>{if(persistAnswer())config.notify('本题草稿已保存；还未计为练过或达标。');});
      on('#ttAnswer','input',el=>{answer=el.value;dirty=true;});
      on('#ttAnswerForm','submit',(_el,event)=>{event.preventDefault();if(!answer.trim()){config.notify('先写下你的独立回答，再查看依据。');return;}if(persistAnswer()){revealed=true;draw();}});
      on('[data-tt-assess]','click',el=>{try{const e=current(),next=core.submitRecall(state(),e.id,el.dataset.ttAssess,{id:'recall-'+Date.now()+'-'+Math.random().toString(36).slice(2,9)});if(!save(next))return;index++;if(index>=runIds.length)mode='complete';load();draw();}catch(err){config.notify(err.message);}});
      on('[data-tt-next]','click',()=>{const list=groups(all(),{subject:group()?.subject||subject,kind}),at=list.findIndex(g=>g.id===groupId),next=list[at+1];if(next)start(next);else{mode='catalogue';draw();config.notify('已到本科最后一组；可以返回题型目录选择重练。');}});
    }
    return {open,mount(target){node=target;draw();},beforeNavigate};
  }
  return {subjects,typeOf,groups,progress,create};
});
