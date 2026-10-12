(function(root,factory){const common=typeof module==='object'&&module.exports,api=factory(common?require('./lz-string.js'):root.LZString);if(common)module.exports=api;else root.WordlyStudyCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(lz){
  'use strict';
  const subjects={listening:'听力',reading:'阅读',writing:'写作',speaking:'口语',grammar:'语法'};
  const fields=['title','summary','explanation','application','example','pitfalls','original','correction','practice','question','en','zh','pos','collocations'];
  const text=(s,max=12000)=>typeof s==='string'?s.slice(0,max):'';
  const num=n=>Number.isFinite(+n)?Math.max(0,+n):0;
  const canonical=s=>text(s,1000).normalize('NFKC').toLowerCase().trim().replace(/\s+/g,' ');
  const safeId=s=>typeof s==='string'&&/^[\w-]{1,100}$/.test(s)&&!['__proto__','constructor','prototype'].includes(s);
  const checksum=s=>{let hash=2166136261;for(let i=0;i<s.length;i++)hash=Math.imul(hash^s.charCodeAt(i),16777619);return (hash>>>0).toString(16);};
  const compactCache=new Map();
  function compact(value){const raw=JSON.stringify(value);if(compactCache.has(raw)){const cached=compactCache.get(raw);compactCache.delete(raw);compactCache.set(raw,cached);return cached;}const packed={encoding:'lz-string-utf16-v1',length:raw.length,checksum:checksum(raw),data:lz.compressToUTF16(raw)};compactCache.set(raw,packed);if(compactCache.size>4)compactCache.delete(compactCache.keys().next().value);return packed;}
  function expand(value){if(!value||value.encoding!=='lz-string-utf16-v1')return value;if(!lz||typeof value.data!=='string'||value.data.length>15000000||!Number.isInteger(value.length)||value.length<1||value.length>50000000)throw Error('压缩资料格式异常，请保留原备份。');const raw=lz.decompressFromUTF16(value.data);if(typeof raw!=='string'||raw.length!==value.length||checksum(raw)!==value.checksum)throw Error('压缩资料校验失败，请保留原备份。');return JSON.parse(raw);}
  const wordMeta=['studySources','studyCategories','studyTags','studyEntryIds','studyMeanings','studyCollocations'];
  function writeDb(value){
    if(JSON.stringify(value).length<1000000)return value;
    if(!lz)throw Error('资料存储模块尚未加载，请保留当前页面并导出备份。');
    const metadata=[],words=value.words.map((word,index)=>{const next={...word},extra={};for(const k of [...wordMeta,...(String(word.id).startsWith('study-')?['example']:[])])if(Object.hasOwn(next,k)){extra[k]=next[k];delete next[k];}if(Object.keys(extra).length)metadata.push([index,word.id,extra]);return next;});
    const knowledge={...value.knowledge},learning={};for(const key of ['learning','libraryView'])if(Object.hasOwn(knowledge,key)){learning[key]=knowledge[key];delete knowledge[key];}
    return {...value,words:JSON.stringify(words).length>=1000000?compact(words):words,knowledge:compact(knowledge),studyWordData:compact(metadata),...(Object.keys(learning).length?{studyLearningData:compact(learning)}:{})};
  }
  function readDb(value){
    if(!value||typeof value!=='object')return value;
    if(!value.studyWordData&&!value.studyLearningData&&value.knowledge?.encoding!=='lz-string-utf16-v1'&&value.words?.encoding!=='lz-string-utf16-v1')return value;
    const decodedWords=expand(value.words);
    if(value.words?.encoding==='lz-string-utf16-v1'&&!Array.isArray(decodedWords))throw Error('压缩词库格式异常，请保留原备份。');
    const next={...value,knowledge:expand(value.knowledge),words:Array.isArray(decodedWords)?decodedWords.map(w=>({...w})):decodedWords};
    if(value.studyLearningData){const learning=expand(value.studyLearningData);if(!plain(learning)||Object.keys(learning).some(k=>!['learning','libraryView'].includes(k))||!plain(next.knowledge))throw Error('学习状态附加资料异常');next.knowledge={...next.knowledge,...learning};delete next.studyLearningData;}
    if(value.studyWordData){const rows=expand(value.studyWordData);if(!Array.isArray(rows)||!Array.isArray(next.words)||rows.length>50000)throw Error('词汇附加资料格式错误。');for(const row of rows){if(!Array.isArray(row)||row.length!==3||!Number.isInteger(row[0])||next.words[row[0]]?.id!==row[1]||!row[2]||typeof row[2]!=='object'||Object.keys(row[2]).some(k=>![...wordMeta,'example'].includes(k)))throw Error('词汇附加资料与原词库不一致。');Object.assign(next.words[row[0]],row[2]);}delete next.studyWordData;}
    return next;
  }
  function readLearningMetadata(value){const source=value?.studyLearningData?expand(value.studyLearningData):expand(value?.knowledge);if(!source)return {};if(!plain(source)||value?.studyLearningData&&Object.keys(source).some(k=>!['learning','libraryView'].includes(k)))throw Error('学习状态附加资料异常');return {...(source.learning!==undefined?{learning:source.learning}:{}),...(source.libraryView!==undefined?{libraryView:source.libraryView}:{})};}
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function sources(value){
    const map=new Map();
    for(const s of Array.isArray(value)?value:[]){if(!s||typeof s!=='object')continue;const path=text(s.path,2000),locator=text(s.locator,500);if(path)map.set(path+'|'+locator,{path,locator,hash:text(s.hash,64),role:s.role==='reference'?'reference':'original'});}
    return [...map.values()].slice(0,100);
  }
  function entry(value){
    if(!value||typeof value!=='object'||!safeId(value.id)||!text(value.title,200).trim())throw Error('知识点需要有效的编号和标题。');
    const categories=[...new Set((Array.isArray(value.categories)?value.categories:[]).filter(k=>Object.hasOwn(subjects,k)))];
    if(!categories.length)throw Error('每条知识点至少需要一个五科分类。');
    const out={id:value.id,kind:value.kind==='vocabulary'?'vocabulary':'knowledge',categories,tags:(Array.isArray(value.tags)?value.tags:[]).map(s=>text(s,100)).filter(Boolean).slice(0,30),status:value.status==='needs-check'?'needs-check':'ready',sources:sources(value.sources),created:num(value.created),updated:num(value.updated)};
    for(const key of fields)out[key]=text(value[key],key==='title'?200:12000);
    if(out.kind==='vocabulary'&&(!out.en.trim()||!out.zh.trim()))throw Error('词汇需要英文和中文释义。');
    out.identity=text(value.identity,1000)||canonical(out.kind==='vocabulary'?[out.en,out.pos,out.zh].join('|'):out.title);
    if(!out.sources.length)throw Error('每条知识点需要可追溯的来源。');
    return out;
  }
  const key=e=>e.kind+'|'+canonical(e.identity);
  function normalizeState(value){
    value=expand(value);
    if(value==null)return {entries:[],review:{},imports:[]};
    if(typeof value!=='object'||!Array.isArray(value.entries))throw Error('资料复习数据格式错误，请保留原备份。');
    if(value.entries.length>20000)throw Error('资料量过大，请拆分备份。');
    const entries=value.entries.map(entry),ids=new Set(entries.map(e=>e.id));
    if(ids.size!==entries.length)throw Error('资料编号重复，请检查备份。');
    const review={};
    for(const [id,r] of Object.entries(value.review||{}))if(ids.has(id)&&r&&typeof r==='object')review[id]={stage:Math.min(5,num(r.stage)),due:num(r.due),last:num(r.last),reviews:num(r.reviews),lapses:num(r.lapses)};
    const imports=(Array.isArray(value.imports)?value.imports:[]).filter(x=>x&&safeId(x.id)).map(x=>({id:x.id,title:text(x.title,200),date:num(x.date),added:num(x.added),merged:num(x.merged)})).slice(-200);
    return {entries,review,imports,...(value.learning!==undefined?{learning:normalizeLearning(value.learning,ids)}:{}),...(value.libraryView!==undefined?{libraryView:normalizeLibraryView(value.libraryView)}:{})};
  }
  function readPack(value){
    if(!value||value.schema!=='wordly-study-pack'||value.version!==1||!Array.isArray(value.entries)||!safeId(value.batch?.id))throw Error('请选择 Wordly 资料包（version 1），不是完整学习备份。');
    if(!value.entries.length||value.entries.length>1000)throw Error('每批需要 1–1000 条资料。');
    const entries=value.entries.map(entry);
    if(new Set(entries.map(e=>e.id)).size!==entries.length)throw Error('资料包内有重复编号。');
    return {schema:value.schema,version:1,batch:{id:value.batch.id,title:text(value.batch.title,200),scope:text(value.batch.scope,3000)},entries};
  }
  function exportPacks(values,now=Date.now()){
    const packs=[],encoder=new TextEncoder();let batch=[],bytes=0;
    const flush=()=>{if(!batch.length)return;packs.push({schema:'wordly-study-pack',version:1,batch:{id:'study-export-'+num(now)+'-'+(packs.length+1),title:'我的资料复习库 · '+(packs.length+1),scope:'用户导出的内容和来源；学习进度请另存完整备份。'},entries:batch});batch=[];bytes=0;};
    for(const value of values){const e=entry(value),size=encoder.encode(JSON.stringify(e)).length;if(batch.length&&(batch.length>=500||bytes+size>4*1024*1024))flush();batch.push(e);bytes+=size;}
    flush();return packs;
  }
  function merge(current,raw,now=Date.now()){
    const state=normalizeState(current),pack=readPack(raw),entries=state.entries.map(e=>({...e,sources:[...e.sources]})),byKey=new Map(entries.map(e=>[key(e),e])),byId=new Map(entries.map(e=>[e.id,e]));
    let added=0,merged=0;
    for(const incoming of pack.entries){
      const found=byId.get(incoming.id)||byKey.get(key(incoming));
      if(found){
        if(byId.has(incoming.id)&&key(found)!==key(incoming))throw Error('同一资料编号对应不同内容，请检查资料包。');
        found.sources=sources([...found.sources,...incoming.sources]);
        found.categories=[...new Set([...found.categories,...incoming.categories])];
        // Existing explanations, examples, edits and review dates always win.
        merged++;
      }else{const next={...incoming,created:incoming.created||now,updated:incoming.updated||now};entries.push(next);byKey.set(key(next),next);byId.set(next.id,next);added++;}
    }
    if(entries.length>20000)throw Error('当前资料库已达到容量限制，请先导出备份。');
    const imports=state.imports.some(x=>x.id===pack.batch.id)?state.imports:[...state.imports,{id:pack.batch.id,title:pack.batch.title,date:now,added,merged}];
    return {state:{...state,entries,review:state.review,imports},added,merged,pack};
  }
  function filter(entries,{subject='',kind='',status='',query=''}={}){const q=canonical(query);return entries.filter(e=>(!subject||e.categories.includes(subject))&&(!kind||e.kind===kind)&&(!status||e.status===status)&&(!q||canonical([...fields.map(k=>e[k]),...e.tags,...e.sources.map(s=>s.path+' '+s.locator)].join(' ')).includes(q)));}
  function mergeWords(current,raw,now=Date.now()){
    if(!Array.isArray(current))throw Error('原词库格式异常，请先保留备份。');
    const pack=readPack(raw),words=current.map(w=>({...w})),byEnglish=new Map(words.map(w=>[canonical(w.en),w]));
    let added=0,merged=0,pending=0;
    for(const e of pack.entries){
      if(e.kind!=='vocabulary')continue;
      if(e.status==='needs-check'){pending++;continue;}
      let w=byEnglish.get(canonical(e.en));
      if(w)merged++;
      else{w={id:'study-'+e.id,en:e.en,zh:e.zh,created:now,appearances:0,correctCount:0,mastered:false,dismissed:false};words.push(w);byEnglish.set(canonical(e.en),w);added++;}
      w.studySources=sources([...(w.studySources||[]),...e.sources]);
      w.studyCategories=[...new Set([...(w.studyCategories||[]),...e.categories])];
      w.studyTags=[...new Set([...(w.studyTags||[]),...e.tags])];
      w.studyEntryIds=[...new Set([...(w.studyEntryIds||[]),e.id])];
      w.studyMeanings=[...new Set([...(w.studyMeanings||[]),e.zh])];
      // Wordbook meanings, personal examples, mastery and practice counters win.
      if(!w.studyCollocations&&e.collocations)w.studyCollocations=e.collocations;
      if(!w.example&&e.example){const label='整理补充例句（原创，非原文）：',english=e.example.startsWith(label)?e.example.slice(label.length).trim():e.example.trim();if(english&&!/[\u3400-\u9fff]/.test(english))w.example={en:english,zh:'',source:'个人资料提炼',attribution:(e.example.startsWith(label)?'整理补充原创例句，非用户个人经历；':'')+'来源与定位保存在资料复习卡片中'};}
    }
    return {words,added,merged,pending};
  }
  function grade(state,id,recalled,now=Date.now()){
    const next=normalizeState(state);
    if(!next.entries.some(e=>e.id===id))throw Error('知识点不存在。');
    const prior=next.review[id]||{stage:0,reviews:0,lapses:0},stage=recalled?Math.min(5,prior.stage+1):0;
    next.review[id]={stage,due:now+(recalled?[1,3,7,14,30][stage-1]*86400000:600000),last:now,reviews:prior.reviews+1,lapses:prior.lapses+(recalled?0:1)};
    return next;
  }
  function due(entries,review,now=Date.now()){return entries.filter(e=>e.status!=='needs-check'&&(!review[e.id]||review[e.id].due<=now));}
  function normalizeLibraryView(v){
    if(!v||typeof v!=='object'||Array.isArray(v))throw Error('资料列表位置记录异常');
    return {subject:Object.hasOwn(subjects,v.subject)?v.subject:'',kind:['knowledge','vocabulary'].includes(v.kind)?v.kind:'',status:['ready','needs-check'].includes(v.status)?v.status:'',phase:['unseen','viewed','practiced'].includes(v.phase)?v.phase:'',checkOnly:v.checkOnly===true,query:text(v.query,500),limit:Math.min(20000,Math.max(12,Math.floor(num(v.limit)||12))),lastId:safeId(v.lastId)?v.lastId:'',scroll:Math.min(1000000,num(v.scroll)),updated:num(v.updated)};
  }
  const plain=v=>v&&typeof v==='object'&&!Array.isArray(v);
  function normalizeLearning(value,ids){
    if(!plain(value))throw Error('知识点学习状态损坏，请保留备份');
    const out={};
    for(const [id,v] of Object.entries(value)){
      if(!safeId(id)||!ids.has(id)||!plain(v)||!Array.isArray(v.attempts)||!['unrated','new','partial','familiar'].includes(v.familiarity||'unrated'))throw Error('知识点学习记录异常');
      const seen=new Set();
      const attempts=v.attempts.map(a=>{
        if(!plain(a)||!safeId(a.id)||seen.has(a.id)||!safeId(a.quizId)||!Number.isInteger(a.version)||a.version<1||!Array.isArray(a.results)||!a.results.length||a.results.length>30)throw Error('知识点检测历史异常');
        seen.add(a.id);const qids=new Set();
        const results=a.results.map(r=>{if(!plain(r)||!safeId(r.id)||qids.has(r.id)||typeof r.correct!=='boolean'||typeof r.entered!=='string'||r.entered.length>1000)throw Error('知识点检测答案异常');qids.add(r.id);return {id:r.id,prompt:text(r.prompt,2000),entered:r.entered,expected:text(r.expected,1000),explanation:text(r.explanation,3000),correct:r.correct};});
        if(a.total!==results.length||a.score!==results.filter(r=>r.correct).length)throw Error('知识点检测分数与答案不一致');
        return {id:a.id,quizId:a.quizId,version:a.version,at:num(a.at),mode:a.mode==='mistakes'?'mistakes':'full',results,total:a.total,score:a.score};
      });
      let draft=null;
      if(v.draft!=null){const d=v.draft;if(!plain(d)||!safeId(d.quizId)||!Number.isInteger(d.version)||d.version<1||!plain(d.answers)||Object.keys(d.answers).some(k=>!safeId(k)||typeof d.answers[k]!=='string'||d.answers[k].length>1000))throw Error('知识点检测草稿异常');draft={quizId:d.quizId,version:d.version,answers:{...d.answers},questionIds:Array.isArray(d.questionIds)?d.questionIds.filter(safeId):null};}
      out[id]={seenAt:num(v.seenAt),firstSeenAt:num(v.firstSeenAt),familiarity:v.familiarity||'unrated',familiarityUpdated:num(v.familiarityUpdated),attempts,draft,draftUpdated:num(v.draftUpdated)};
    }
    return out;
  }
  function learningPhase(state,id){const p=state.learning?.[id];return p?.attempts?.length||state.review?.[id]?.last?'practiced':p?.seenAt?'viewed':'unseen';}
  function learningRecord(state,id){const next=normalizeState(state);if(!next.entries.some(e=>e.id===id))throw Error('知识点不存在');next.learning=next.learning||{};next.learning[id]=next.learning[id]||{seenAt:0,firstSeenAt:0,familiarity:'unrated',familiarityUpdated:0,attempts:[],draft:null,draftUpdated:0};return next;}
  function markViewed(state,id,now=Date.now()){const next=learningRecord(state,id),p=next.learning[id];p.seenAt=num(now);p.firstSeenAt=p.firstSeenAt||num(now);return next;}
  function setFamiliarity(state,id,value,now=Date.now()){if(!['unrated','new','partial','familiar'].includes(value))throw Error('请选择有效熟悉程度');const next=learningRecord(state,id);next.learning[id].familiarity=value;next.learning[id].familiarityUpdated=num(now);return next;}
  function setLibraryView(state,value,now=Date.now()){return {...normalizeState(state),libraryView:normalizeLibraryView({...value,updated:now})};}
  function validateQuiz(quiz,id){
    if(!plain(quiz)||!safeId(quiz.id)||quiz.entryId!==id||!Number.isInteger(quiz.version)||quiz.version<1||!Array.isArray(quiz.questions)||!quiz.questions.length||quiz.questions.length>30)throw Error('过关题尚未配置或版本无效');
    const ids=new Set();for(const q of quiz.questions){if(!safeId(q.id)||ids.has(q.id)||!['choice','fill'].includes(q.type)||!Array.isArray(q.answers)||!q.answers.length||q.answers.some(a=>typeof a!=='string'||!a.trim()))throw Error('过关题答案配置异常');ids.add(q.id);if(q.type==='choice'&&(!Array.isArray(q.options)||new Set(q.options.map(o=>o.id)).size!==q.options.length||q.answers.some(a=>!q.options.some(o=>o.id===a))))throw Error('选择题选项配置异常');}return quiz;
  }
  const normalizedAnswer=s=>String(s).normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ').replace(/[.!?。！？]+$/,'');
  function checkProgress(state,id,quiz){validateQuiz(quiz,id);const latest={};for(const a of state.learning?.[id]?.attempts||[])if(a.quizId===quiz.id&&a.version===quiz.version)for(const r of a.results)latest[r.id]=r;const correct=quiz.questions.filter(q=>latest[q.id]?.correct).length,wrongIds=quiz.questions.filter(q=>latest[q.id]?.correct===false).map(q=>q.id);return {correct,total:quiz.questions.length,passed:correct===quiz.questions.length,wrongIds,latest};}
  function saveCheckDraft(state,id,quiz,answers,now=Date.now(),questionIds=null){validateQuiz(quiz,id);const next=learningRecord(state,id);next.learning[id].draft={quizId:quiz.id,version:quiz.version,answers:{...answers},questionIds};next.learning[id].draftUpdated=num(now);return normalizeState(next);}
  function submitCheck(state,id,quiz,answers,{at=Date.now(),id:attemptId='check-'+at,questionIds=null}={}){
    validateQuiz(quiz,id);const next=learningRecord(state,id),e=next.entries.find(e=>e.id===id);if(e.status!=='ready')throw Error('待核对内容暂不计检测成绩');
    if(!safeId(attemptId)||next.learning[id].attempts.some(a=>a.id===attemptId))throw Error('检测记录编号重复，请重试');
    if(questionIds&&(!Array.isArray(questionIds)||!questionIds.length||new Set(questionIds).size!==questionIds.length||questionIds.some(q=>!checkProgress(next,id,quiz).wrongIds.includes(q))))throw Error('错题复测范围无效');
    const questions=questionIds?quiz.questions.filter(q=>questionIds.includes(q.id)):quiz.questions;
    const results=questions.map(q=>{const entered=answers[q.id];if(typeof entered!=='string'||!entered.trim()||entered.length>1000)throw Error('请完成每一道题后再提交');if(q.type==='choice'&&!q.options.some(o=>o.id===entered))throw Error('选择题答案无效');return {id:q.id,prompt:q.prompt,entered:q.type==='choice'?q.options.find(o=>o.id===entered).text:entered,expected:q.type==='choice'?q.options.find(o=>o.id===q.answers[0]).text:q.answers.join(' / '),explanation:q.explanation||'',correct:q.answers.some(a=>normalizedAnswer(a)===normalizedAnswer(entered))};});
    next.learning[id].attempts.push({id:attemptId,quizId:quiz.id,version:quiz.version,at:num(at),mode:questionIds?'mistakes':'full',results,total:results.length,score:results.filter(r=>r.correct).length});next.learning[id].draft=null;next.learning[id].draftUpdated=num(at);return normalizeState(next);
  }
  function mergeLearningMetadata(current,incoming){
    const next=normalizeState(current),other=normalizeState(incoming);next.learning=next.learning||{};const ids=new Set(next.entries.map(e=>e.id));
    for(const [id,b] of Object.entries(other.learning||{})){if(!ids.has(id))throw Error('当前知识点已缺失，请重新打开资料库');const a=next.learning[id];if(!a){next.learning[id]=b;continue;}const attempts=new Map(a.attempts.map(x=>[x.id,x]));for(const x of b.attempts)if(attempts.has(x.id)&&JSON.stringify(attempts.get(x.id))!==JSON.stringify(x))throw Error('检测历史冲突，已停止覆盖');else attempts.set(x.id,x);next.learning[id]={...a,seenAt:Math.max(a.seenAt,b.seenAt),firstSeenAt:Math.min(...[a.firstSeenAt,b.firstSeenAt].filter(Boolean))||0,attempts:[...attempts.values()].sort((x,y)=>x.at-y.at),...(b.familiarityUpdated>=a.familiarityUpdated?{familiarity:b.familiarity,familiarityUpdated:b.familiarityUpdated}:{}),...(b.draftUpdated>=a.draftUpdated?{draft:b.draft,draftUpdated:b.draftUpdated}:{})};}
    if(other.libraryView&&(!next.libraryView||other.libraryView.updated>=next.libraryView.updated))next.libraryView=other.libraryView;
    return normalizeState(next);
  }
  return {subjects,fields,escape,entry,sources,normalizeState,readPack,exportPacks,merge,mergeWords,readDb,writeDb,filter,grade,due,learningPhase,markViewed,setFamiliarity,setLibraryView,validateQuiz,checkProgress,saveCheckDraft,submitCheck,mergeLearningMetadata,readLearningMetadata};
});
