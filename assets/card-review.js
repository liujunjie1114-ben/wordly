(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WordlyCardReview=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const text=value=>typeof value==='string'?value.trim():'';
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fileName=value=>String(value||'').split(/[\\/]/).pop();
  function analyze(e){
    const vocabulary=e.kind==='vocabulary',original=text(e.original);
    return {
      id:e.id,title:text(e.title)||text(e.en),question:text(e.question)||(vocabulary?`“${text(e.en)||text(e.title)}” 是什么意思，怎样使用？`:text(e.title)),
      vocabulary,pending:e.status!=='ready',answer:(vocabulary?text(e.zh):text(e.summary))||text(e.summary)||'',
      sourceKind:original?'original':'notes',source:original||[text(e.explanation),text(e.example)].filter(Boolean).join('\n\n'),
      summary:text(e.summary),explanation:text(e.explanation),example:text(e.example),application:text(e.application),pitfalls:text(e.pitfalls),correction:text(e.correction),practice:text(e.practice),
      en:text(e.en),pos:text(e.pos),collocations:text(e.collocations),sources:Array.isArray(e.sources)?e.sources:[]
    };
  }
  function navigation(entries,id){
    const found=entries.findIndex(e=>e.id===id),index=found<0?0:found,total=entries.length,start=Math.max(0,Math.min(index-7,total-16));
    return {index,total,previous:index>0?entries[index-1].id:null,next:index<total-1?entries[index+1].id:null,items:entries.slice(start,start+16).map((e,i)=>({id:e.id,title:e.title,number:start+i+1,pending:e.status!=='ready'}))};
  }
  function navigator(entries,id){
    const n=navigation(entries,id);
    return `<header class="cr-nav"><div class="cr-nav-head"><div><span class="study-eyebrow">QUESTION REVIEW</span><h2>逐卡复盘 <small>${n.total? n.index+1:0} / ${n.total} 张</small></h2></div><div class="study-actions"><button class="btn light small" data-card-focus="${esc(n.previous||'')}" ${n.previous?'':'disabled'}>← 上一张</button><button class="btn light small" data-card-focus="${esc(n.next||'')}" ${n.next?'':'disabled'}>下一张 →</button></div></div><nav class="cr-numbers" aria-label="复盘卡号">${n.items.map(e=>`<button data-card-focus="${esc(e.id)}" aria-label="第 ${e.number} 张：${esc(e.title)}" aria-pressed="${e.id===id}" title="${esc(e.title)}"><b>${e.number}</b><small>${e.pending?'待核对':'自主对照'}</small></button>`).join('')}</nav><p class="cr-caption">${n.total>16?'当前显示附近 16 张；上一张 / 下一张可继续浏览全部筛选结果。 ':''}浏览不等于掌握；熟悉程度和检测结果分别保留。</p></header>`;
  }
  function sources(v){
    return `<details class="cr-provenance"><summary>资料来源与定位 · ${v.sources.length} 处</summary>${v.sources.length?`<ul>${v.sources.map(s=>`<li><strong>${esc(fileName(s.path))} · ${esc(s.locator)}</strong><p>${esc(s.path)}</p><small>${s.role==='reference'?'整理版／辅助参考':'资料标注的原始依据'}</small></li>`).join('')}</ul>`:'<p>当前卡片未提供来源位置。</p>'}</details>`;
  }
  function sourcePane(v,concealed=false,editable=true){
    return `<aside class="cr-source" aria-label="原资料对照"><div class="cr-source-head"><span class="study-eyebrow">BACK TO THE SOURCE</span><h2>${v.sourceKind==='original'?'原文与课堂表达':'整理笔记与例子'}</h2><p class="cr-caption">${concealed?'先独立回忆，揭晓后再对照资料。':v.sourceKind==='original'?'保留卡片中的原文／原表达。':'本卡未附逐字原文，下方为已有整理笔记。'}</p>${!concealed&&editable?`<button class="btn light small" data-study-edit="${esc(v.id)}">编辑这张卡片</button>`:''}</div><div class="cr-source-text" tabindex="0">${concealed?'<p>资料已遮住</p>':v.source?`<p>${esc(v.source)}</p>`:'<p>当前卡片未提供原文或整理笔记。请按来源位置核对，暂不推测原文。</p>'}</div>${!concealed?sources(v):''}</aside>`;
  }
  const section=(label,value,fallback)=>`<section class="cr-section"><h3>${label}</h3><p>${esc(value||fallback)}</p></section>`;
  function card(e,{concealed=false,editable=true}={}){
    const v=analyze(e);
    return `<article class="cr-card study-detail" data-card-id="${esc(e.id)}"><div class="cr-spread">${sourcePane(v,concealed,editable)}<section class="cr-focus" aria-label="当前卡片解析"><header class="cr-question"><span class="study-eyebrow">${v.vocabulary?'WORD &amp; USAGE':'RECALL QUESTION'}</span>${!concealed&&v.title!==v.question?`<p class="cr-card-title">${esc(v.title)}</p>`:''}<h1>${esc(v.question)}</h1><span class="study-learning-tag">${v.pending?'待核对 · 暂不作标准答案':'自主对照'}</span></header>${concealed?'<div class="cr-concealed"><h2>先用自己的话说一遍</h2><p>想一想：核心结论是什么？在哪类题里使用？有哪些容易混淆的地方？</p><button class="btn" data-study-reveal>查看答案与依据</button></div>':`<div class="cr-answer"><span class="study-eyebrow">ANSWER &amp; EVIDENCE</span><h2>答案与理解依据</h2><p class="cr-key">${v.pending?'资料参考（待核对）':'核心结论'}：<strong>${esc(v.answer||'本卡未提供独立结论，请结合下方解释核对。')}</strong></p>${v.vocabulary&&v.en?`<p class="cr-expression">${esc(v.en)}${v.pos?' · '+esc(v.pos):''}</p>`:''}${v.vocabulary&&v.summary&&v.summary!==v.answer?section('补充要点',v.summary,''):''}${section('中文理解 · 为什么',v.explanation,'本卡未提供额外解释。')}${section('适用场景 · 什么时候用',v.application,'本卡未提供具体应用场景。')}${section('例子与搭配',[v.example,v.collocations].filter(Boolean).join('\n\n'),'本卡未提供例句或搭配。')}${section('易错辨析',[v.pitfalls,v.correction].filter(Boolean).join('\n\n'),'本卡未提供额外辨析。')}<div class="cr-action"><h3>再练一步</h3><p>${esc(v.practice||(v.vocabulary?'遮住释义，回忆这个表达的意思；再回到来源核对用法。':'遮住结论，用自己的话回答上面的回忆问题；再对照解释核对。'))}</p>${v.practice?'':'<small>通用回忆步骤；当前卡片未提供专项练习。</small>'}</div></div>`}</section></div></article>`;
  }
  function quizResults(quiz,attempts=[]){
    const history=attempts.filter(a=>a.quizId===quiz.id&&a.version===quiz.version).slice().sort((a,b)=>(a.at||0)-(b.at||0));
    return quiz.questions.map(q=>{const results=history.flatMap(a=>(a.results||[]).filter(r=>r.id===q.id));return {question:q,first:results[0]||null,latest:results.at(-1)||null,count:results.length};});
  }
  function quizReview(e,quiz,attempts,selected){
    const items=quizResults(quiz,attempts),index=Math.max(0,items.findIndex(r=>r.question.id===selected)),r=items[index],q=r?.question;
    if(!q)return '';
    const expected=q.type==='choice'?q.options.filter(o=>q.answers.includes(o.id)).map(o=>o.text).join(' / '):q.answers.join(' / ');
    return `<section class="cr-quiz" aria-label="检测逐题复盘"><header class="cr-nav"><div class="cr-nav-head"><div><span class="study-eyebrow">QUESTION REVIEW</span><h2>检测逐题复盘 <small>${index+1} / ${items.length} 道</small></h2></div><div class="study-actions"><button class="btn light small" data-quiz-focus="${esc(items[index-1]?.question.id||'')}" ${index?'':'disabled'}>← 上一题</button><button class="btn light small" data-quiz-focus="${esc(items[index+1]?.question.id||'')}" ${index<items.length-1?'':'disabled'}>下一题 →</button></div></div><nav class="cr-numbers" aria-label="检测题号">${items.map((v,i)=>`<button data-quiz-focus="${esc(v.question.id)}" aria-pressed="${i===index}"><b>${i+1}</b><small>${!v.first?'未作答':v.first.correct?'首次匹配':'首次有误'}</small></button>`).join('')}</nav><p class="cr-caption">首次答案始终保留；最近结果单独显示。只对照当前检测版本 v${quiz.version}。</p></header><div class="cr-spread">${sourcePane(analyze(e))}<section class="cr-focus"><header class="cr-question"><span class="study-eyebrow">QUESTION ${index+1}</span><h3>${esc(q.prompt)}</h3>${q.options?`<ol type="A">${q.options.map(o=>`<li>${esc(o.text)}</li>`).join('')}</ol>`:''}</header><div class="cr-answer"><span class="study-eyebrow">ANSWER &amp; EVIDENCE</span><h3>答案依据</h3><p class="cr-key">参考答案：<strong>${esc(expected)}</strong></p><blockquote>${esc(q.explanation||'本题暂未提供解析。')}</blockquote><dl class="cr-attempts"><div><dt>首次作答</dt><dd>${r.first?`${esc(r.first.entered)} · ${r.first.correct?'匹配':'有误'}`:'当前版本尚未作答'}</dd></div><div><dt>最近作答</dt><dd>${r.latest?`${esc(r.latest.entered)} · ${r.latest.correct?'匹配':'有误'} · 共 ${r.count} 次`:'尚无记录'}</dd></div></dl><p class="cr-caption">题目与解析来自站内规则练习；原文和整理说明在左侧对照。</p></div></section></div></section>`;
  }
  return {analyze,navigation,navigator,card,quizResults,quizReview};
});
