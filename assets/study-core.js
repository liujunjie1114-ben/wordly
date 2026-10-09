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
  function compact(value){const raw=JSON.stringify(value);if(compactCache.has(raw))return compactCache.get(raw);const packed={encoding:'lz-string-utf16-v1',length:raw.length,checksum:checksum(raw),data:lz.compressToUTF16(raw)};compactCache.set(raw,packed);if(compactCache.size>2)compactCache.delete(compactCache.keys().next().value);return packed;}
  function expand(value){if(!value||value.encoding!=='lz-string-utf16-v1')return value;if(!lz||typeof value.data!=='string'||value.data.length>15000000||!Number.isInteger(value.length)||value.length<1||value.length>50000000)throw Error('压缩资料格式异常，请保留原备份。');const raw=lz.decompressFromUTF16(value.data);if(typeof raw!=='string'||raw.length!==value.length||checksum(raw)!==value.checksum)throw Error('压缩资料校验失败，请保留原备份。');return JSON.parse(raw);}
  const wordMeta=['studySources','studyCategories','studyTags','studyEntryIds','studyMeanings','studyCollocations'];
  function writeDb(value){
    if(JSON.stringify(value).length<1000000)return value;
    if(!lz)throw Error('资料存储模块尚未加载，请保留当前页面并导出备份。');
    const metadata=[],words=value.words.map((word,index)=>{const next={...word},extra={};for(const k of [...wordMeta,...(String(word.id).startsWith('study-')?['example']:[])])if(Object.hasOwn(next,k)){extra[k]=next[k];delete next[k];}if(Object.keys(extra).length)metadata.push([index,word.id,extra]);return next;});
    return {...value,words:JSON.stringify(words).length>=1000000?compact(words):words,knowledge:compact(value.knowledge),studyWordData:compact(metadata)};
  }
  function readDb(value){
    if(!value||typeof value!=='object')return value;
    if(!value.studyWordData&&value.knowledge?.encoding!=='lz-string-utf16-v1'&&value.words?.encoding!=='lz-string-utf16-v1')return value;
    const decodedWords=expand(value.words);
    if(value.words?.encoding==='lz-string-utf16-v1'&&!Array.isArray(decodedWords))throw Error('压缩词库格式异常，请保留原备份。');
    const next={...value,knowledge:expand(value.knowledge),words:Array.isArray(decodedWords)?decodedWords.map(w=>({...w})):decodedWords};
    if(value.studyWordData){const rows=expand(value.studyWordData);if(!Array.isArray(rows)||!Array.isArray(next.words)||rows.length>50000)throw Error('词汇附加资料格式错误。');for(const row of rows){if(!Array.isArray(row)||row.length!==3||!Number.isInteger(row[0])||next.words[row[0]]?.id!==row[1]||!row[2]||typeof row[2]!=='object'||Object.keys(row[2]).some(k=>![...wordMeta,'example'].includes(k)))throw Error('词汇附加资料与原词库不一致。');Object.assign(next.words[row[0]],row[2]);}delete next.studyWordData;}
    return next;
  }
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
    return {entries,review,imports};
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
    return {state:{entries,review:state.review,imports},added,merged,pack};
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
  return {subjects,fields,escape,entry,sources,normalizeState,readPack,exportPacks,merge,mergeWords,readDb,writeDb,filter,grade,due};
});
