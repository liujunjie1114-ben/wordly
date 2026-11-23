(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WordlySpeakingStructure=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const frequencySource={url:'https://ielts.idp.com/nepal/prepare/speaking/part-1-topics-and-questions',title:'IDP：Part 1 常见话题',checked:'2026-11-23',note:'官方提供常见话题的定性说明，未给出各题或各问法的考场次数。常见话题优先不等于精确考频排名。'};
 const groups={
  A:{title:'喜好、感受与特点',en:'Likes & feelings',steps:['直接说喜欢、感受或特点 / Give your position','解释一个原因 / Give one reason','补一次情境 / Add a specific detail','可选感受或限定 / Add a feeling or qualification'],stems:["I'm really into… / I'm not really into…","I find it… because…","For example, I usually…","It makes me feel…"],tense:'现在喜好用现在时；like 后接 doing 或 to do；feel 后接形容词。'},
  B:{title:'选择与比较',en:'Preference & comparison',steps:['选哪一项 / Make your choice','选同一维度解释 / Explain one comparison point','简短对照另一项 / Contrast the other option','需要时加条件 / Qualify if needed'],stems:['I prefer A to B.','The main reason is that…','Compared with B, A is…',"It depends on…"],tense:'比较同一维度；用 prefer A to B 或 prefer doing A to doing B。'},
  C:{title:'频率与日常习惯',en:'Frequency & habits',steps:['先说频率 / State how often','通常什么场合 / Give a usual situation','解释原因 / Explain why','举一个短例子 / Add one example'],stems:['About twice a week. / Not very often.','I usually… when…','This is mainly because…','For example, last weekend I…'],tense:'规律用一般现在时；一次明确过去的例子才切换到过去时。'},
  D:{title:'具体信息与现状',en:'Specific information',steps:['直答人物地点数量等 / Answer the requested fact','补一个具体特征 / Add a concrete detail','解释用途或原因 / Explain its use or reason','需要时补充 / Add a relevant detail'],stems:['I mainly… / I live… / It is…','It has… / I spend about…','This means I can…','One thing I like about it is…'],tense:'How much 问数量；How long 问时长。持续至今可用 I have lived… for/since…；描述住所通常用现在时。'},
  E:{title:'方法、行动与场景',en:'Methods & situations',steps:['直接给做法或场景 / State what you do or when','补一个步骤 / Add a step','解释怎样起作用 / Explain how it works','说结果 / Give the result'],stems:['I usually start by…','Then I… / When I…, I…','This helps me…','As a result, I can…'],tense:'日常做法用一般现在时。How do you 问方法；How do you feel 问感受。'},
  F:{title:'原因、判断与重要性',en:'Reasons & opinions',steps:['先回应原因或判断 / State your reason or view','解释机制 / Explain the connection','举一个具体例子 / Give one example','补结果或条件 / Add a result or condition'],stems:['I think… / One reason is that…','This means…','For example,…','So… / It also depends on…'],tense:'people / your country 要回应群体；理由和例子须支持同一个判断。'},
  G:{title:'过去、童年与已有经历',en:'Past & experience',steps:['回应过去事实或有没有 / Answer the past or experience question','交代时间背景 / Give a time or background','讲一个行动细节 / Describe one action','说当时结果 / Give the result or feeling'],stems:['When I was a child, I used to…','I started… when…','Yes, I have. I… last year.','At the time, I felt…'],tense:'童年/明确过去时间：过去时。Have you ever：先用 Yes, I have / No, I haven’t，再用过去时补一次具体经历。Why did：直接解释当时原因。'},
  H:{title:'今昔变化',en:'Change over time',steps:['是否变化 / State the change','以前怎样 / Describe the past','现在对应怎样 / Describe the present','解释原因或影响 / Explain why or its effect'],stems:['It has changed quite a bit.','I used to… / There used to be…','But now I… / Now there are…','One reason is that…'],tense:'同一个维度比较过去和现在；used to + 原形；现在完成时可概括变化。'},
  I:{title:'未来、愿望与假设',en:'Future & hypotheticals',steps:['直接说意愿或选择 / State your intention','解释原因 / Give a reason','补计划或条件 / Give a plan or condition','说明预期结果 / Describe the expected result'],stems:["I'd like to… / I plan to…",'This is because…',"If I…, I'll… / If I had…, I'd…",'That would help me…'],tense:'区分愿望、真实未来和假设；有条件时才使用 if。'}
 };
 const isGroup=id=>typeof id==='string'&&Object.hasOwn(groups,id);
 const safeKey=k=>typeof k==='string'&&/^[a-zA-Z0-9_-]{1,120}$/.test(k)&&!['__proto__','constructor','prototype'].includes(k);
 const obj=v=>v&&typeof v==='object'&&!Array.isArray(v);
 const str=(v,max=30000)=>typeof v==='string'?v.slice(0,max):'';
 const number=v=>Number.isFinite(+v)?Math.max(0,+v):0;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function key(q){return String(q).normalize('NFKC').toLowerCase().replace(/[’‘]/g,"'").replace(/what's/g,'what is').replace(/favourite/g,'favorite').replace(/travelling/g,'traveling').replace(/programmes/g,'programs').replace(/[^a-z0-9]+/g,' ').trim();}
 const aliasRows=[['Do you prefer sad or happy music?','Do you prefer sad music or happy music?'],['Do you like to watch comedies?','Do you like watching comedies?'],['Did you enjoy traveling by car when you were a kid?','Did you enjoy traveling by car when you were a child?','Did you enjoy travelling by car as a child?'],['Did you like tidying up your room when you were a child?','Did you like tidying up your room when you were little?'],['Do you prefer getting information from websites or books?','Do you prefer searching for information on websites or in books?','Do you prefer books or websites for finding information?'],['Do you prefer cold or hot weather?','Do you prefer hot or cold weather?'],['Do you like shopping?','Do you enjoy shopping?'],['Do you like singing? Why?','Do you like singing?']];
 const aliases=new Map(aliasRows.flatMap(row=>row.map(q=>[key(q),key(row[0])])));
 const canonical=q=>aliases.get(key(q))||key(q);
 const manualRows={
  A:['Would you describe yourself as ambitious?','Do you miss being a student?','Is your handwriting easy to read?','Are you a punctual person?','Are you the sort of person who tells jokes?','Do you tend to keep working towards a dream once you have one?','Do you feel more at home in the mornings or later in the day?','What genres are you most likely to pick?','What type of comedy makes you laugh most?','Is there a branch of science you are particularly curious about?','What do students like to do at school?'],
  B:['Given the choice, would you watch a film at home or at a cinema?','Given the choice, would you type or write by hand?','Would you rather live somewhere historic or in a recently built home?','Do you enjoy seeing one friend at a time or getting together in a group?','Do you usually spend your days off with your parents or with your friends?','Do you generally skim a text or work through it in detail?','Does what you eat vary with the seasons?','Are you more drawn to contemporary art or older styles?','In what way is playing for a team different from competing on your own?','Do you like your primary school teachers more than your high school teachers?'],
  C:['Do you ever spend time in galleries?','On how many nights can you see the stars clearly where you live?'],
  E:['What can teachers do to keep students from getting bored at school?','When a promising opportunity appears, do you normally act on it?','Walk me through a normal morning for you. What do you normally do?','What is the first thing you usually do after you get out of bed?','In which situations do you need to read something slowly and closely?'],
  F:['Is the city friendly to children and old people?','Is your hometown a good place for young people to pursue their careers?','What do you think is the most important at the moment?','What are the benefits of being your age?','Are the transport facilities to your home very good?','Are the people in your neighborhood nice and friendly?','Are the people friendly in this city?','Can you tell someone’s personality from their handwriting?','What stops people from taking a good opportunity?','Do you believe dreams can tell us anything meaningful?','What makes somewhere a good place to meet a friend?','What do you think draws audiences to comedy programmes?','How much does having breakfast matter to you?','Is it worthwhile keeping older buildings in urban areas?','How common is it for people to grow vegetables where you live?','What might make growing your own vegetables difficult?'],
  G:['Can you recall a valuable chance you had when you were younger?','Can you remember an occasion when you gave someone flowers?','Can you remember the most recent thing you read about history?'],
  I:['Would making art for a living appeal to you?']
 };
 const manual=new Map(Object.entries(manualRows).flatMap(([g,rows])=>rows.map(q=>[key(q),g])));
 function stableId(q){let a=2166136261,b=2246822519;for(const c of canonical(q)){a=Math.imul(a^c.charCodeAt(0),16777619);b=Math.imul(b^c.charCodeAt(0),3266489917);}return 'p1-q-'+(a>>>0).toString(16).padStart(8,'0')+(b>>>0).toString(16).padStart(8,'0');}
 function isChildhood(s){return /\b(?:in|during|throughout|from|about|of) (?:your |my |their )?childhood\b|\b(?:your|my|his|her|their) childhood (?:dream|hobb|memor|home)\b|\bas (?:a )?(?:child|kid)\b|\bwhen (?:you|I|they|we|he|she) (?:was|were) (?:a )?(?:child|kid|young|little)\b|\bgrowing up\b|\b(?:at|in) (?:primary|secondary) school\b/i.test(s);}
 function classify(q){
  const s=key(q);
  if(manual.has(s))return manual.get(s);
  if(/past.*now|now.*past|used to.*now|parks today different|any changes to|has.*changed|^have (?!.*ever).*changed|how.*changed|big changes|changes.*recently|activities you liked.*those you like now|difference.*where.*now.*past/.test(s))return 'H';
  if(/prefer|differences? between/.test(s)||s.includes('childhood is boring or adulthood'))return 'B';
  if(/^(?:would|will) you |^do you (?:want|plan|hope)|^(?:what|where|who|how|why|which).*\b(?:would|will) you\b|^do you think you will/.test(s))return 'I';
  if(isChildhood(s)||/from your past|^(did|were|was) |^(why|what|when|where|how|who|which).*\bdid\b|^(what|when) was |last time|happy lately|received recently/.test(s))return 'G';
  if(/^how long/.test(s))return 'D';
  if(/^(have|has) you |^what have you |have you done|^in what way has/.test(s))return 'G';
  if(/^when would|^in what conditions/.test(s))return 'E';
  if(/would you|\bwill\b|in the future|next (five|few|ten) (years|decades)|do you (want|plan|hope)|dream job|looking forward|what changes would|what would|who do you want/.test(s))return 'I';
  if(/^how do you feel|what.*makes you feel|^how interested|do you like|do you enjoy|do you still like|you (dislike|like|enjoy)|people.*like|favorite|interesting to you|are you good|is it easy|is wearing.*comfortable|are you a (tidy|morning)|are you the kind|are an ambitious person|does happy music/.test(s))return 'A';
  if(/^how (often|regularly)|^(do|does).*\boften\b/.test(s))return 'C';
  if(/^how (do|can|to)|^what do you (usually )?do|^what do people.*do |^what do you consider|^when (would|do)|^on what occasions|^in what conditions|do you report to the police/.test(s))return 'E';
  if(/^why |^do you think|how important|important to|is it important|popular in your country|common in your country|^are .*popular/.test(s))return 'F';
  return 'D';
 }
 function subtype(q,g=classify(q)){
  const s=key(q);if(!isGroup(g))g=classify(q);
  if(g==='G')return isChildhood(s)?'童年与求学 / Childhood & school':/^(have|has)|^what have|have you done|in what way has/.test(s)?'已有经历 / Experience':/^why did/.test(s)?'过去的原因 / Past reasons':'具体过去与开始时间 / Specific past';
  if(g==='D')return /^how long/.test(s)?'持续时长 / Duration':/^how much/.test(s)?'数量金额 / Amount':/^where/.test(s)?'地点 / Where':/^who/.test(s)?'人物 / Who':'具体信息 / Specific information';
  if(g==='A')return /are you good|is it easy|are you a |are you the (kind|sort)|ambitious|handwriting easy/.test(s)?'能力与特点 / Ability & traits':/favorite|^what .*like|^which .*interesting|^what (type|genres)/.test(s)?'喜欢哪种或哪一点 / Favorite or liked detail':/feel|comfortable|excited/.test(s)?'感受 / Feelings':'喜欢与不喜欢 / Likes & dislikes';
  return groups[g].en;
 }
 function frame(q){
  const g=isGroup(q.group)?q.group:classify(q.question),base=groups[g],sub=subtype(q.question,g),s=key(q.question);
  if(g==='A'&&sub.startsWith('感受'))return {...base,stems:['I feel… when…','This is mainly because…','For example,…','It helps me… / It makes me feel…']};
  if(g==='A'&&sub.startsWith('能力'))return {...base,stems:["I'd say so. / Not really.",'I find it easy/difficult to…','For example, I…',"I'm trying to…"]};
  if(g==='A'&&sub.startsWith('喜欢哪种'))return {...base,stems:['My favourite… is… / I mainly like…','One thing I like about it is…','For example,…','It makes me feel…']};
  if(g==='D'&&sub.startsWith('持续'))return {...base,stems:['I have lived/studied… for… / since…','I first moved/started… in…','During that time, I have…','I plan to…']};
  if(g==='D'&&sub.startsWith('数量'))return {...base,stems:['I spend about… / Around…','It depends on…','For example,…','That is usually enough for…']};
  if(g==='G'&&sub.startsWith('已有'))return {...base,stems:["Yes, I have. / No, I haven't.",'The last time was… / I… last…','I remember…','At the time, I felt…']};
  if(g==='G'&&sub.startsWith('过去的原因'))return {...base,stems:['I chose/started… because…','At the time, I wanted to…','For example,…','Looking back, I think…']};
  if(g==='F'&&s.startsWith('why '))return {...base,stems:['One reason is that…','This means…','For example,…','As a result,…']};
  return base;
 }
 function frequency(v){if(!obj(v)||!Number.isInteger(v.count)||!Number.isInteger(v.sample)||v.count<0||v.sample<1||v.count>v.sample||!/^https:\/\//.test(v.url||'')||!/^\d{4}-\d{2}-\d{2}$/.test(v.from||'')||!/^\d{4}-\d{2}-\d{2}$/.test(v.to||'')||!v.region||v.from>v.to)return null;return {count:v.count,sample:v.sample,url:str(v.url,2000),from:v.from,to:v.to,region:str(v.region,100)};}
 function makeBank(rows){
  if(!Array.isArray(rows))throw Error('题库应包含 questions 数组。');
  if(rows.length>10000)throw Error('题目超过10000条，请分批导入。');
  const map=new Map();
  for(const row of rows){
   if(!obj(row)||typeof row.question!=='string'||!row.question.trim()||row.question.length>4000)throw Error('存在无效题干，未导入。');
   if(row.group!==undefined&&row.group!==''&&!isGroup(row.group))throw Error('题目分类无效，未导入。');
   const text=row.question.trim(),k=canonical(text),id=stableId(text);
   const topics=(Array.isArray(row.topics)&&row.topics.length?row.topics:[row.topic||row.topicZh||'补充题']).filter(x=>typeof x==='string').map(x=>str(x,200));
   const sources=(Array.isArray(row.sources)?row.sources:[]).map(s=>typeof s==='string'?s:obj(s)?[s.source_name||s.source_name===0?s.source_name:s.source||'资料',s.page?'p.'+s.page:''].filter(Boolean).join(' '):'').filter(Boolean).map(x=>str(x,2000));
   if(!sources.length)sources.push(row.cardId?'Wordly · '+str(row.topicZh||row.topic,200):'本地补充题');
   if(!map.has(k))map.set(k,{id,question:text,group:isGroup(row.group)?row.group:classify(text),topics:[],sources:[],variants:[],links:[],examFrequency:frequency(row.examFrequency)});
   const r=map.get(k);r.topics=[...new Set([...r.topics,...topics])];r.sources=[...new Set([...r.sources,...sources])];r.variants=[...new Set([...r.variants,text,...(Array.isArray(row.variants)?row.variants.filter(x=>typeof x==='string'):[])])];
   if(row.cardId)r.links.push({cardId:str(row.cardId,100),index:Math.floor(number(row.questionIndex))});
   if(Array.isArray(row.links))r.links.push(...row.links.filter(x=>obj(x)&&safeKey(x.cardId)).map(x=>({cardId:x.cardId,index:Math.floor(number(x.index))})));
   r.links=[...new Map(r.links.map(x=>[x.cardId+'-'+x.index,x])).values()];
  }
  return [...map.values()];
 }
 const editableFields=['draft','prompt','group','correction','error'];
 function fieldTimes(p){return Object.fromEntries(editableFields.map(k=>[k,obj(p.fieldUpdated)&&Object.hasOwn(p.fieldUpdated,k)?number(p.fieldUpdated[k]):(typeof p[k]==='string'&&p[k]!==''?number(p.updated):0)]));}
 function normalize(value){
  if(value===null||value===undefined)value={};
  if(!obj(value))throw Error('口语结构记录格式有误，请保留原备份。');
  if(value.version!==undefined&&value.version!==1)throw Error('此口语结构备份版本暂不支持，原记录未改动。');
  if(value.questions!==undefined&&!Array.isArray(value.questions))throw Error('题库记录损坏，原记录未改动。');
  for(const name of ['progress','frameworks'])if(value[name]!==undefined&&!obj(value[name]))throw Error('练习记录格式损坏，原记录未改动。');
  if(value.session!==undefined&&value.session!==null&&(!obj(value.session)||!Array.isArray(value.session.ids)))throw Error('续练位置格式损坏，原记录未改动。');
  for(const [id,f] of Object.entries(value.frameworks||{}))if(!isGroup(id)||!obj(f))throw Error('框架分类格式损坏，原记录未改动。');
  if(value.session&& !isGroup(value.session.group))throw Error('续练分类无效，原记录未改动。');
  for(const [id,p] of Object.entries(value.progress||{}))if(!safeKey(id)||!obj(p)||(p.group!==undefined&&p.group!==''&&!isGroup(p.group))||(p.attempts!==undefined&&(!Array.isArray(p.attempts)||p.attempts.some(a=>!obj(a)||!safeKey(a.id)))))throw Error('练习历史格式损坏，原记录未改动。');
  const out={version:1,questions:makeBank(value.questions||[]),progress:{},frameworks:{},session:null};
  for(const [id,p] of Object.entries(obj(value.progress)?value.progress:{}))if(safeKey(id)&&obj(p)){
   const attempts=(Array.isArray(p.attempts)?p.attempts:[]).filter(a=>obj(a)&&safeKey(a.id)).map(a=>({id:a.id,at:number(a.at),answer:str(a.answer),correction:str(a.correction),error:str(a.error),status:a.status==='again'?'again':'practised'}));
   out.progress[id]={draft:str(p.draft),prompt:str(p.prompt,4000),group:isGroup(p.group)?p.group:'',correction:str(p.correction),error:str(p.error),updated:number(p.updated),fieldUpdated:fieldTimes(p),firstAnswer:typeof p.firstAnswer==='string'?p.firstAnswer:(attempts[0]?.answer??null),attempts};
  }
  for(const [id,f] of Object.entries(obj(value.frameworks)?value.frameworks:{}))if(isGroup(id)&&obj(f))out.frameworks[id]={text:str(f.text,12000),updated:number(f.updated)};
  if(obj(value.session)&&isGroup(value.session.group))out.session={group:value.session.group,section:str(value.session.section,200),ids:[...new Set((value.session.ids||[]).filter(safeKey))].slice(0,20),index:Math.min(19,Math.floor(number(value.session.index))),updated:number(value.session.updated)};
  return out;
 }
 function mergeState(left,right){
  const a=normalize(left),b=normalize(right),out=normalize(a);out.questions=makeBank([...a.questions,...b.questions]);
  for(const [id,p] of Object.entries(b.progress)){
   const old=out.progress[id];if(!old){out.progress[id]=p;continue;}
   const history=[...new Map([...old.attempts,...p.attempts].map(x=>[x.id,x])).values()].sort((x,y)=>x.at-y.at||x.id.localeCompare(y.id));
   const latest=p.updated>=old.updated?p:old;
   out.progress[id]={...latest,fieldUpdated:{},firstAnswer:history[0]?.answer??old.firstAnswer??p.firstAnswer,attempts:history};for(const field of editableFields){const pick=p.fieldUpdated[field]>=old.fieldUpdated[field]?p:old;out.progress[id][field]=pick[field];out.progress[id].fieldUpdated[field]=Math.max(p.fieldUpdated[field],old.fieldUpdated[field]);}
  }
  for(const [id,f] of Object.entries(b.frameworks))if(!out.frameworks[id]||f.updated>=out.frameworks[id].updated)out.frameworks[id]=f;
  if(b.session&&(!out.session||b.session.updated>=out.session.updated))out.session=b.session;
  return out;
 }
 function saveDraft(state,id,fields,at=Date.now()){
  if(!safeKey(id))throw Error('题目标识无效。');if(fields.group!==undefined&&fields.group!==''&&!isGroup(fields.group))throw Error('题目分类无效。');const s=normalize(state),old=s.progress[id]||{draft:'',prompt:'',group:'',correction:'',error:'',firstAnswer:null,attempts:[],updated:0};
  const changed=Object.fromEntries(['draft','prompt','correction','error'].filter(k=>typeof fields[k]==='string').map(k=>[k,str(fields[k],k==='prompt'?4000:30000)]));if(isGroup(fields.group))changed.group=fields.group;const times={...fieldTimes(old)};for(const field of Object.keys(changed))times[field]=number(at);s.progress[id]={...old,...changed,fieldUpdated:times,updated:number(at)};return s;
 }
 function submit(state,id,{id:attemptId,at=Date.now(),status='again',answer}={}){
  const s=normalize(state),p=s.progress[id];if(!p)throw Error('请先留下本次回答或转写。');
  const text=answer===undefined?p.draft:answer;if(typeof text!=='string'||!text.trim())throw Error('请先留下本次回答或转写，再记录练习。');
  if(!safeKey(attemptId))throw Error('本次练习标识无效。');if(p.attempts.some(a=>a.id===attemptId))return s;
  const a={id:attemptId,at:number(at),answer:str(text),correction:p.correction,error:p.error,status:status==='again'?'again':'practised'};
  p.attempts.push(a);p.firstAnswer=p.firstAnswer??a.answer;p.updated=number(at);return s;
 }
 function exportPack(state,bank=[]){const s=normalize(state);return {schema:'wordly-speaking-structure',version:1,exportedAt:new Date().toISOString(),questions:makeBank([...bank,...s.questions]),progress:s.progress,frameworks:s.frameworks,session:s.session};}
 function importPack(state,pack){
  if(!obj(pack)||pack.schema!=='wordly-speaking-structure'||pack.version!==1||!Array.isArray(pack.questions))throw Error('请选择“口语结构练习”的有效完整库或备份文件。');
  return mergeState(state,normalize(pack));
 }
 function priority(q){
  if(q.examFrequency)return {kind:'observed',tier:0,score:q.examFrequency.count/q.examFrequency.sample,label:'有来源的样本记录'};
  const common=/work|stud|hometown|home|accommodation|daily|routine|hobb|leisure|food|fruit|vegetable|music|film|movie|travel|transport|weather|technology|internet|website|friend|family/i.test(q.topics.join(' '));
  return {kind:'guidance',tier:common?1:2,score:0,label:common?'官方列举的常见话题':'其他资料话题'};
 }
 function effectiveBank(bank,state){const s=normalize(state);return makeBank([...bank,...s.questions]).map(q=>({...q,group:s.progress[q.id]?.group||q.group,display:s.progress[q.id]?.prompt||q.question}));}
 function chooseSession(bank,group,state,limit=20,section=''){
  const s=normalize(state),rows=effectiveBank(bank,s).filter(q=>q.group===group&&(!section||subtype(q.question,group)===section));
  const rank=q=>{const p=s.progress[q.id],last=p?.attempts.at(-1);return last?.status==='again'?0:last?2:1;};
  rows.sort((a,b)=>priority(a).tier-priority(b).tier||priority(b).score-priority(a).score||rank(a)-rank(b)||(s.progress[a.id]?.updated||0)-(s.progress[b.id]?.updated||0)||a.id.localeCompare(b.id));
  const buckets=new Map();for(const q of rows){const topic=q.topics[0]||'';if(!buckets.has(topic))buckets.set(topic,[]);buckets.get(topic).push(q);}
  const result=[];while(result.length<Math.min(20,limit)&&[...buckets.values()].some(x=>x.length))for(const bucket of buckets.values())if(bucket.length&&result.length<Math.min(20,limit))result.push(bucket.shift());
  return result;
 }
 function sectionMarkup(id,rows){if(!['A','D','G'].includes(id))return '';const sections=[...new Set(rows.map(q=>subtype(q.question,id)))].sort((a,b)=>a.startsWith('童年')||a.startsWith('喜欢与')?-1:b.startsWith('童年')||b.startsWith('喜欢与')?1:a.localeCompare(b));return `<label class="wss-section-label">固定一种问法<select data-wss-section="${id}">${id==='D'?'<option value="">全组跨话题练习</option>':''}${sections.map(s=>`<option value="${esc(s)}">${esc(s)} · ${rows.filter(q=>subtype(q.question,id)===s).length}题</option>`).join('')}</select></label>`;}
 function renderOverview(bank,state){
  const s=normalize(state),rows=effectiveBank(bank,s);
  return `<div class="wss-hero"><div class="eyebrow">SPEAKING · STRUCTURE PRACTICE</div><h1>口语结构练习</h1><p>一类问法，跨话题反复练。每组最多20题；先自己组织，再修正重说。</p><div class="wss-meta">${rows.length} 道独立题目 · 9 组回答任务 · 中英对照</div></div><div class="wss-toolbar"><button class="btn light" data-wss="catalog">查看与编辑完整库</button><label class="btn light wss-file">导入完整库 / 备份<input type="file" accept=".json,application/json" data-wss-import></label><button class="btn light" data-wss="export">导出完整备份</button><button class="btn light" data-wss="context">导出复盘给助手</button></div><details class="wss-source"><summary>练习优先级与来源说明</summary><p>同组跨话题轮换，优先官方列举的常见话题。${esc(frequencySource.note)}</p><a href="${frequencySource.url}" target="_blank" rel="noopener">${frequencySource.title} ↗</a><p>题目保留原始来源。我的答案、修订和历史保存在当前浏览器，换设备请先导出备份。</p></details>${s.session?'<button class="btn wss-resume" data-wss="resume">继续上次这一组 →</button>':''}<div class="wss-grid">${Object.entries(groups).map(([id,g])=>{const all=rows.filter(q=>q.group===id),done=all.filter(q=>s.progress[q.id]?.attempts.length).length;return `<section class="panel wss-group"><span class="wss-group-index">${id}</span><h2>${g.title}</h2><p lang="en">${g.en}</p><p class="wss-count">每轮最多20题 / 库内 ${all.length} 题 · 已练 ${done}</p>${sectionMarkup(id,all)}<button class="btn light" data-wss-start="${id}" ${!all.length?'disabled':''}>开始这一组 →</button></section>`;}).join('')}</div>`;
 }
 let config={getState:()=>({}),setState:()=>false,getBank:()=>[],notify:()=>{},navigate:()=>false,openRecording:()=>false},node=null,mode='overview',pending=null,timer=null,catalogQuery='';
 const baselines=new WeakMap();
 function rememberInputs(){node?.querySelectorAll('[data-wss-field],[data-wss-framework]').forEach(el=>baselines.set(el,el.value));}
 const state=()=>normalize(config.getState());const bank=()=>effectiveBank(config.getBank(),state());
 function configure(value){config={...config,...value};}
 function persist(s){const ok=config.setState(s);const status=node?.querySelector('[data-wss-status]');if(status)status.textContent=ok?'已保存到当前浏览器':'保存失败，请先复制内容或导出备份。';return ok;}
 function flush(){clearTimeout(timer);if(!pending)return true;const next=pending();if(!persist(next))return false;pending=null;rememberInputs();return true;}
 function mount(target){node=target;mode='overview';draw();}
 function beforeNavigate(){return flush();}
 function beforeRender(){if(!flush())return false;node=null;return true;}
 function questionMarkup(q,s,compact=false){
  const p=s.progress[q.id]||{},g=frame(q);
  return `<section class="panel wss-question" data-wss-question="${q.id}"><div class="eyebrow">${esc(subtype(q.question,q.group))}</div><h2 lang="en">${esc(q.display||q.question)}</h2><p class="wss-topics">${q.topics.map(esc).join(' / ')}</p><details><summary>显示中英框架 / Show the framework</summary><ol class="wss-steps">${g.steps.map((x,i)=>`<li><span>${esc(x)}</span><b lang="en">${esc(g.stems[i])}</b></li>`).join('')}</ol><p>${esc(g.tense)}</p><label>我的框架补充 / My framework notes<textarea data-wss-framework="${q.group}" rows="3">${esc(s.frameworks[q.group]?.text||'')}</textarea></label></details><details ${compact?'open':''}><summary>编辑题干与分类 / Edit question & category</summary><label>显示题干（保留原题）<textarea data-wss-field="prompt" rows="2">${esc(p.prompt||q.question)}</textarea></label><label>回答任务<select data-wss-field="group">${Object.entries(groups).map(([id,g])=>`<option value="${id}" ${id===q.group?'selected':''}>${g.title} / ${g.en}</option>`).join('')}</select></label><p class="wss-small">原题：${esc(q.question)}</p></details><label>我的口答转写 / My answer<textarea data-wss-field="draft" rows="5" placeholder="先自己说，再留下原话，方便逐句修正。">${esc(p.draft||'')}</textarea></label><div class="wss-two"><label>修正后的表达 / Better wording<textarea data-wss-field="correction" rows="3">${esc(p.correction||'')}</textarea></label><label>错误与下一次动作 / Errors & next step<textarea data-wss-field="error" rows="3">${esc(p.error||'')}</textarea></label></div><p class="wss-small" data-wss-status aria-live="polite">输入后自动保存；首次提交和每次复测分别保留。</p><div class="wss-toolbar"><button class="btn" data-wss="submit">保存本次练习</button><button class="btn light" data-wss="again">标记需要再练</button><button class="btn light" data-wss="record">去录音练这题</button></div><details><summary>原始来源与练习历史（${p.attempts?.length||0}次）</summary><p>${q.sources.map(esc).join(' · ')}</p>${p.firstAnswer!==null&&p.firstAnswer!==undefined?`<h3>首次回答 / First answer</h3><p class="wss-preserve">${esc(p.firstAnswer)}</p>`:''}${(p.attempts||[]).map(a=>`<article class="wss-attempt"><small>${new Date(a.at).toLocaleString('zh-CN')} · ${a.status==='again'?'需要再练':'已练过（自报）'}</small><p class="wss-preserve">${esc(a.answer)}</p><p>${esc(a.correction)}</p><p>${esc(a.error)}</p></article>`).join('')}</details></section>`;
 }
 function activeQuestion(){const s=state();return bank().find(q=>q.id===s.session?.ids[s.session.index]);}
 function draw(){
  if(!node)return;const s=state(),rows=bank();
  let html='<div class="wss-toolbar"><button class="btn light" data-wss="home">← 口语首页</button>'+(mode!=='overview'?'<button class="btn light" data-wss="overview">结构练习总览</button>':'')+'</div>';
  if(mode==='overview')html+=renderOverview(config.getBank(),s);
  if(mode==='training'){
   const session=s.session,q=activeQuestion();
   if(!q){mode='overview';return draw();}
   html+=`<div class="wss-session"><div><div class="eyebrow">${esc(groups[session.group].en)}</div><h1>${groups[session.group].title}</h1><p>${session.section?esc(session.section)+" · ":""}本轮第 ${session.index+1} / ${session.ids.length} 题 · 先口答，后修正，再换话题</p></div><div class="wss-toolbar"><button class="btn light" data-wss="prev" ${session.index===0?'disabled':''}>上一题</button><button class="btn light" data-wss="next" ${session.index===session.ids.length-1?'disabled':''}>下一题 →</button><button class="btn light" data-wss="context">导出这组复盘</button></div></div><progress class="wss-progress" max="${session.ids.length}" value="${session.index+1}"></progress>`+questionMarkup(q,s);
  }
  if(mode==='catalog')html+=`<div class="wss-hero"><h1>完整题库 · ${rows.length}题</h1><p>按问法检索；点击题目编辑自己的版本，原题保留。</p></div><label>搜索题干、话题或类别<input type="search" data-wss-search value="${esc(catalogQuery)}" placeholder="例如 shoes / 童年 / frequency"></label><div class="wss-catalog">${rows.filter(q=>[q.question,...q.topics,groups[q.group].title,groups[q.group].en].join(' ').toLowerCase().includes(catalogQuery.toLowerCase())).map(q=>`<button class="wss-catalog-row" data-wss-edit="${q.id}"><span>${esc(groups[q.group].title)}</span><b lang="en">${esc(q.display)}</b><small>${q.topics.map(esc).join(' / ')}</small></button>`).join('')}</div>`;
  node.innerHTML='<div class="wss">'+html+'</div>';bind();
 }
 function collect(){const wrap=node?.querySelector('[data-wss-question]');if(!wrap)return null;const fields={};wrap.querySelectorAll('[data-wss-field]').forEach(el=>{if(el.value!==baselines.get(el))fields[el.dataset.wssField]=el.value;});const framework=wrap.querySelector('[data-wss-framework]'),frameworkChanged=framework&&framework.value!==baselines.get(framework),frameworkText=framework?.value;return ()=>{const at=Date.now(),s=Object.keys(fields).length?saveDraft(state(),wrap.dataset.wssQuestion,fields,at):state();if(frameworkChanged)s.frameworks[framework.dataset.wssFramework]={text:frameworkText,updated:at};return s;};}
 function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
 function contextMarkdown(stateValue,rows){
  const s=normalize(stateValue),ids=s.session?.ids||Object.keys(s.progress),byId=new Map(rows.map(q=>[q.id,q]));
  const lines=['# Wordly · 口语结构练习复盘','',`分类：${s.session?groups[s.session.group].title:'已有练习'}；本次导出 ${ids.length} 题。`,'','目标：同一回答任务跨话题迁移，检查直答、结构、时态、语序和连接。',''];
  for(const id of ids){const q=byId.get(id),p=s.progress[id];if(!q)continue;lines.push('## '+(p?.prompt||q.display||q.question),'','原题：'+q.question,'','回答任务：'+groups[q.group].title,'','话题：'+q.topics.join(' / '),'');if(s.frameworks[q.group]?.text)lines.push('框架补充：',s.frameworks[q.group].text,'');if(!p){lines.push('尚未留下回答。','');continue;}lines.push('首次回答：',p.firstAnswer||'尚未提交','', '当前草稿：',p.draft,'', '修正表达：',p.correction,'','错误与下一步：',p.error,'', '已提交次数：'+p.attempts.length,'');for(const a of p.attempts.slice(-2))lines.push('最近练习：'+new Date(a.at).toLocaleString('zh-CN'),a.answer,'');}
  return lines.join('\n');
 }
 function bind(){
  rememberInputs();
  node.querySelectorAll('[data-wss-start]').forEach(b=>b.onclick=()=>{if(!flush())return;const section=node.querySelector('[data-wss-section="'+b.dataset.wssStart+'"]')?.value||'',selected=chooseSession(config.getBank(),b.dataset.wssStart,state(),20,section),s=state();s.session={group:b.dataset.wssStart,section,ids:selected.map(q=>q.id),index:0,updated:Date.now()};if(persist(s)){mode='training';draw();}});
  node.querySelectorAll('[data-wss-edit]').forEach(b=>b.onclick=()=>{if(!flush())return;const q=bank().find(q=>q.id===b.dataset.wssEdit),s=state();s.session={group:q.group,ids:[q.id],index:0,updated:Date.now()};if(persist(s)){mode='training';draw();}});
  node.querySelector('[data-wss-import]')?.addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>8*1024*1024)throw Error('文件超过8MB，请分批导入。');const pack=JSON.parse(await file.text());if(!flush())return;if(persist(importPack(state(),pack))){config.notify('题库已合并，已有答案与历史保留。');draw();}}catch(error){config.notify('未导入：'+error.message);}e.target.value='';});
  node.querySelector('[data-wss-search]')?.addEventListener('input',e=>{catalogQuery=e.target.value;const selection=e.target.selectionStart;draw();const input=node.querySelector('[data-wss-search]');input?.focus();if(input?.type==='search')input.setSelectionRange(selection,selection);});
  node.querySelectorAll('[data-wss-field],[data-wss-framework]').forEach(el=>el.addEventListener('input',()=>{pending=collect();clearTimeout(timer);const status=node.querySelector('[data-wss-status]');if(status)status.textContent='正在保存…';timer=setTimeout(flush,400);}));
  node.querySelectorAll('[data-wss]').forEach(b=>b.onclick=()=>{const action=b.dataset.wss;if(action==='export'||action==='context'){const snapshot=pending?pending():state();return action==='export'?download('Wordly-口语结构练习-完整备份.json',JSON.stringify(exportPack(snapshot,config.getBank()),null,2),'application/json'):download('Wordly-口语结构练习-复盘.md',contextMarkdown(snapshot,effectiveBank(config.getBank(),snapshot)),'text/markdown;charset=utf-8');}if(!flush())return;
   if(action==='home')return config.navigate('hub-speaking');
   if(action==='overview'||action==='catalog'){mode=action;return draw();}
   if(action==='resume'){mode='training';return draw();}
   const q=activeQuestion();if(!q)return;
   if(action==='record')return config.openRecording(q);
   const s=state();
   if(action==='prev'||action==='next'){s.session.index=Math.max(0,Math.min(s.session.ids.length-1,s.session.index+(action==='next'?1:-1)));s.session.updated=Date.now();if(persist(s))draw();return;}
   if(action==='submit'||action==='again')try{const value=collect();const current=value?value():state(),id='attempt-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);if(persist(submit(current,q.id,{id,at:Date.now(),status:action==='again'?'again':'practised'}))){config.notify('本次回答已单独保存。');draw();}}catch(e){config.notify(e.message);}
  });
 }
 return {groups,frequencySource,canonical,stableId,classify,subtype,frame,makeBank,normalize,mergeState,saveDraft,submit,exportPack,importPack,priority,chooseSession,effectiveBank,renderOverview,contextMarkdown,configure,mount,beforeNavigate,beforeRender};
});
