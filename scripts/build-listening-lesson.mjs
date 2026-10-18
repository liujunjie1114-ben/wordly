import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inline=value=>escape(value).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');

// Render the uploaded Markdown as inert text. No HTML, scripts or remote embeds are accepted.
export function renderLesson(source,{chapterLevel=1}={}){
  const out=[],toc=[];let paragraph=[],quote=[],list=null,table=false,fence=null,code=[],section=0,titleSeen=false;
  const flushText=()=>{if(paragraph.length){out.push('<p>'+paragraph.map(inline).join('<br>')+'</p>');paragraph=[];}if(quote.length){out.push('<blockquote>'+quote.map(inline).join('<br>')+'</blockquote>');quote=[];}};
  const close=()=>{flushText();if(list){out.push('</'+list+'>');list=null;}if(table){out.push('</tbody></table></div>');table=false;}};
  for(const line of source.split(/\r?\n/)){
    if(fence!==null){if(/^```\s*$/.test(line)){out.push('<pre><code>'+escape(code.join('\n'))+'</code></pre>');fence=null;code=[];}else code.push(line);continue;}
    if(/^```/.test(line)){close();fence=line.slice(3);continue;}
    if(!line.trim()){close();continue;}
    const heading=line.match(/^(#{1,6})\s+(.+)$/);
    if(heading){close();const level=heading[1].length,numbered=heading[2].match(/^(\d+)\./);let id=null;
      if(level===1&&!titleSeen){id='lesson-title';titleSeen=true;}
      else if(level===chapterLevel&&(chapterLevel===2||numbered)){id='section-'+(numbered?numbered[1]:++section);}
      if(id){toc.push({id,title:heading[2]});out.push('<h2 id="'+id+'">'+inline(heading[2])+'</h2>');}
      else{const outputLevel=level===1?3:Math.min(6,level+(chapterLevel===1?1:0));out.push('<h'+outputLevel+'>'+inline(heading[2])+'</h'+outputLevel+'>');}continue;}
    if(/^---\s*$/.test(line)){close();out.push('<hr>');continue;}
    if(/^\|/.test(line)){
      if(/^\|[\s:|\-]+\|\s*$/.test(line))continue;
      flushText();if(list){out.push('</'+list+'>');list=null;}
      const cells=line.trim().split('|').slice(1,-1).map(c=>inline(c.trim()));
      if(!table){table=true;out.push('<div class="table-wrap"><table><thead><tr>'+cells.map(c=>'<th scope="col">'+c+'</th>').join('')+'</tr></thead><tbody>');}
      else out.push('<tr>'+cells.map(c=>'<td>'+c+'</td>').join('')+'</tr>');continue;
    }
    const item=line.match(/^\s*(?:([-*])\s+|(\d+)\.\s+)(.+)$/);
    if(item){flushText();if(table){out.push('</tbody></table></div>');table=false;}const type=item[2]?'ol':'ul';if(list!==type){if(list)out.push('</'+list+'>');out.push('<'+type+(item[2]&&item[2]!=='1'?' start="'+Number(item[2])+'"':'')+'>');list=type;}out.push('<li>'+inline(item[3])+'</li>');continue;}
    if(list||table)close();
    if(/^\s*>\s?/.test(line)){if(paragraph.length)flushText();quote.push(line.replace(/^\s*>\s?/,''));}
    else{if(quote.length)flushText();paragraph.push(line);}
  }
  if(fence!==null)throw new Error('Unclosed Markdown code fence');
  close();return {html:out.join('\n'),toc};
}

export const lessons=[
  {date:'2026-10-17',title:'从听到信息，到核对完整答案。',shortTitle:'Test 1 · 四个 Section 听力整理',lead:'会员调查、蒸坑流程、学校研究与刺柏保护。按题段回看证据、词形和同义改写，不包含个人作答或成绩。',chapterLevel:1,quick:[['section-1','一页速记'],['section-2','Section 1'],['section-3','Section 2'],['section-4','Section 3'],['section-5','Section 4'],['section-6','复习方法']],focus:[['例子先核对配套','音频与题面不一致时先确认材料，避免整段错位。'],['答案要听完整关系','改口取最终确认；问题与肯定回答也可能共同给出答案。'],['复测要区分错因','定位、辨音、限定词、拼写和词形分别处理。']],notice:'本页是题目与录音核对后的课堂知识整理；没有纳入个人作答或实际得分。练习音频未随页面发布。'},
  {date:'2026-10-12',title:'先听懂关系，再决定答案。',shortTitle:'填空、地图与单选深度复盘',lead:'填空题、地图题与单选题的课堂深度复盘。把定位词当作入口，把原文证据和语义关系当作判断依据。',chapterLevel:1,quick:[['section-29','一页速记'],['section-27','70 分钟训练'],['section-25','错题复盘模板']],focus:[['词出现，不等于答案出现','先看题干缺哪一类信息，再判断原因、背景、时间和人物。'],['地图每题确认当前位置','听到新参考点就重置，继续跟住地标、方向与顺序。'],['验证整个选项','转折、否定和修饰关系都要跟住，不能只凭相同单词确认。']]},
  {date:'2026-10-07',title:'把词形、对象和位置听准确。',shortTitle:'第二次课：辨音、填空与地图',lead:'M/N 辨音、复数词尾、填空六步、信息前置和地图定位。保留老师任务、笔记纠错、内部冲突与待核验内容。',chapterLevel:2,quick:[['section-9','30 秒考前提示'],['section-7','老师课后任务'],['section-6','错误与待核对'],['section-8','错题复盘表']],focus:[['辨音和词尾分开练','直接练字母名，检查规则与不规则复数；保留首次听写结果。'],['候选信息先短记','答案可能早于定位信息出现，继续核对评价对象与限定关系。'],['地标与方位共同定位','按本题起点与面向跟题，不预设顺时针或自下而上路线。']]},
  {date:'2026-10-03',title:'审题找到方向，语义决定答案。',shortTitle:'试听课：审题、定位与训练规划',lead:'整理审题、语篇分层、答案核验与词汇听辨方法。保留当时的训练安排，区分课堂要求、整理建议和待确认事项。',chapterLevel:2,quick:[['section-3','做题流程'],['section-4','词汇与表达'],['section-5','当日训练安排'],['section-6','原一周计划'],['section-7','错题与验收']],focus:[['先看问题和选项差异','勾关键短语，并把主体、时间、数量与范围连起来理解。'],['定位以后继续核验','不能把首句、转折词或句子数量当成自动选答案的规则。'],['重做与新题分别记录','重听用于找错因，新题用于检查迁移，不把记住答案当作掌握。']]}
];

function buildLesson(lesson){
  const stem='listening-lesson-'+lesson.date;
  const source=fs.readFileSync(path.join(root,'assets',stem+'.md'),'utf8');
  const {html,toc}=renderLesson(source,lesson);
  const links=toc.slice(1).map(item=>'<a href="#'+item.id+'">'+escape(item.title)+'</a>').join('\n');
  const quickLinks=lesson.quick.map(([id,title])=>'<a href="#'+id+'">'+escape(title)+'</a>').join('');
  const principles=lesson.focus.map(([title,text],i)=>'<div><b>0'+(i+1)+' · '+escape(title)+'</b><p>'+escape(text)+'</p></div>').join('');
  const related=lessons.filter(item=>item.date!==lesson.date).map(item=>'<a href="listening-lesson-'+item.date+'.html">'+escape(item.date+' · '+item.shortTitle)+'</a>').join('');
  const historical=lesson.date==='2026-10-12'?'':'<p class="notice">历史课堂归档：文中的“今晚”、作业和一周计划均按原日期保留，不会自动替换今天的任务或学习进度。</p>';
  const page=`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#254b3c"><title>听力课堂复盘 · ${lesson.date} · Wordly</title><style>
  :root{color-scheme:light;--ink:#23392f;--muted:#5e7065;--line:#e0e7df;--paper:#fff;--bg:#f3f5f1}*{box-sizing:border-box}html{scroll-padding-top:24px}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.85 system-ui,"Microsoft YaHei",sans-serif}a{color:#345d48;text-underline-offset:4px}a:focus-visible,summary:focus-visible{outline:2px solid #345d48;outline-offset:4px}header,main,footer{max-width:1160px;margin:auto;padding:24px 28px}header{display:flex;justify-content:space-between;gap:16px;border-bottom:1px solid var(--line);font-size:13px}header b{letter-spacing:1px}header nav{display:flex;gap:18px;flex-wrap:wrap}h1{font-size:28px;line-height:1.4;letter-spacing:-.5px;margin:10px 0}h2{font-size:22px;line-height:1.5;margin:34px 0 16px;scroll-margin-top:24px}h3{font-size:18px;line-height:1.6;margin:26px 0 12px}h4,h5,h6{font-size:16px;margin:22px 0 10px}p{margin:12px 0}.kicker{font-size:11px;letter-spacing:1.5px;font-weight:700;color:var(--muted)}.lead{max-width:740px;color:var(--muted)}.quick-links{display:flex;flex-wrap:wrap;gap:10px;margin:22px 0}.quick-links a,.download{display:inline-block;padding:8px 14px;background:var(--paper);border:1px solid var(--line);border-radius:9px;font-size:13px;text-decoration:none}.quick-links a:first-child{background:#254b3c;color:white;border-color:#254b3c}.principles{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:24px 0 30px}.principles div{padding:17px 18px;background:var(--paper);border:1px solid var(--line);border-radius:12px}.principles b{display:block;font-size:15px}.principles p{color:var(--muted);font-size:13px;margin:5px 0 0}.reading{display:grid;grid-template-columns:240px minmax(0,1fr);gap:24px;align-items:start}.contents{position:sticky;top:20px;background:var(--paper);padding:18px;border:1px solid var(--line);border-radius:12px}.contents summary{font-weight:650;cursor:pointer;font-size:14px}.contents nav{display:grid;gap:7px;margin-top:14px;max-height:72vh;overflow:auto}.contents a{font-size:12px;line-height:1.6;text-decoration:none;padding:5px 0}.contents a:hover{text-decoration:underline}article{background:var(--paper);padding:8px 30px 30px;border:1px solid var(--line);border-radius:14px;min-width:0}article h2:first-child{font-size:21px}blockquote{margin:16px 0;padding:13px 16px;background:#f0f4ed;border-radius:9px}ul,ol{padding-left:24px}li{margin:4px 0}code{font:13px/1.7 ui-monospace,Consolas,monospace;overflow-wrap:anywhere}p code,li code{padding:2px 5px;background:#f0f4ed;border-radius:4px}pre{white-space:pre-wrap;overflow-wrap:anywhere;padding:18px;background:#f6f8f4;border:1px solid var(--line);border-radius:10px}hr{border:0;border-top:1px solid var(--line);margin:28px 0}.table-wrap{overflow:auto}table{border-collapse:collapse;width:100%;font-size:13px}td,th{padding:10px 12px;border-bottom:1px solid var(--line);text-align:left;min-width:100px}th{background:#f6f8f4}footer{font-size:12px;color:var(--muted)}.notice{font-size:12px;color:var(--muted)}@media(max-width:760px){header,main,footer{padding:18px}header{align-items:flex-start}.principles{grid-template-columns:1fr;gap:8px}.principles div{padding:12px 15px}.reading{display:block}.contents{position:static;margin-bottom:16px}.contents nav{max-height:260px}article{padding:4px 19px 24px}h1{font-size:25px}h2{font-size:20px}.lead{font-size:14px}header nav{gap:10px}header b{display:none}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}@media print{header,.contents,.quick-links,.principles,footer{display:none}.reading{display:block}body,article{background:white}article{border:0;padding:0}main{max-width:none;padding:0}pre,blockquote,tr{break-inside:avoid}}
  </style></head><body><header><b>WORDLY / CLASS NOTES</b><nav aria-label="返回导航"><a href="../#home">← 今日计划</a><a href="listening-lessons.html">全部听力课堂</a><a href="${stem}.md" download>下载原始笔记</a></nav></header><main><span class="kicker">LISTENING REVIEW · ${lesson.date.replaceAll("-",".")}</span><h1>${escape(lesson.title)}</h1><p class="lead">${escape(lesson.lead)}</p><div class="quick-links">${quickLinks}<a href="#lesson-title">阅读全文</a></div><div class="principles" aria-label="本课重点">${principles}</div><p class="notice">${escape(lesson.notice||'以下完整保留你提供的课堂复盘。例题结论依据这份笔记，尚未对照原题和完整录音复核；本次未附课堂音频。')}</p>${historical}<div class="reading"><details class="contents" open><summary>章节目录 · ${toc.length-1} 节</summary><nav aria-label="课堂复盘章节">${links}</nav></details><article aria-label="课堂复盘全文">${html}</article></div><nav class="quick-links" aria-label="其他听力课堂">${related}</nav></main><footer>课堂笔记 · ${lesson.date} ｜ <a href="#lesson-title">回到全文开头 ↑</a> · <a href="../#hub-listening">返回听力学习</a></footer></body></html>`;
  fs.writeFileSync(path.join(root,'assets',stem+'.html'),page);
  return {date:lesson.date,chapters:toc.length-1,sourceLines:source.split(/\r?\n/).length,output:'assets/'+stem+'.html'};
}
export function build(){
  const result=lessons.map(buildLesson);
  const style=fs.readFileSync(path.join(root,result[0].output),'utf8').match(/<style>([\s\S]*?)<\/style>/)[1];
  const cards=lessons.map((lesson,i)=>`<a class="lesson-card" href="listening-lesson-${lesson.date}.html"><span class="kicker">${lesson.date} · ${result[i].chapters} 节</span><h2>${escape(lesson.shortTitle)}</h2><p>${escape(lesson.lead)}</p><span class="open-lesson">打开全文 →</span></a>`).join('');
  const catalog=`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#254b3c"><title>听力课堂复盘 · Wordly</title><style>${style}.lesson-list{display:grid;gap:16px;margin:28px 0}.lesson-card{display:block;padding:22px 26px;background:white;border:1px solid var(--line);border-radius:14px;text-decoration:none}.lesson-card:hover{border-color:#9cad9f}.lesson-card h2{margin:7px 0;font-size:20px}.lesson-card p{margin:6px 0 14px;font-size:14px;color:var(--muted)}.open-lesson{font-size:13px;font-weight:650}</style></head><body><header><b>WORDLY / CLASS NOTES</b><nav aria-label="返回导航"><a href="../#home">← 今日计划</a><a href="../#hub-listening">听力学习</a></nav></header><main><span class="kicker">LISTENING / CLASS ARCHIVE</span><h1>把每次听力课，连成一条学习线。</h1><p class="lead">${lessons.length} 次课堂，按日期回看方法、错因和训练安排。每篇保留全文、原始笔记下载与独立目录。</p><section class="lesson-list" aria-label="听力课堂列表">${cards}</section><p class="notice">历史计划按原日期归档，未自动写入今天的学习任务；笔记中的待核对答案仍保留原标注。</p></main><footer>Wordly · 听力课堂复盘 ｜ <a href="../#hub-listening">返回听力学习</a></footer></body></html>`;
  fs.writeFileSync(path.join(root,'assets/listening-lessons.html'),catalog);
  const items=lessons.map(lesson=>'<a href="./assets/listening-lesson-'+lesson.date+'.html" target="_blank" rel="noopener"><time datetime="'+lesson.date+'">'+lesson.date.slice(5).replace('-','月')+'日</time><span>'+escape(lesson.shortTitle)+'</span><span aria-hidden="true">↗</span></a>').join('');
  const markup='<section class="sd-class-lesson sd-class-archive" aria-label="听力课堂复盘"><div class="sd-class-heading"><span class="sd-class-icon" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/></svg></span><div><span class="sd-class-date">CLASS NOTES · '+lessons.length+' 次课堂</span><h2>听力课堂复盘</h2></div><a class="link" href="./assets/listening-lessons.html" target="_blank" rel="noopener">查看全部 ↗</a></div><nav class="sd-class-list" aria-label="按日期打开课堂笔记">'+items+'</nav></section>';
  const dashboardPath=path.join(root,'assets/study-dashboard.js');
  let dashboard=fs.readFileSync(dashboardPath,'utf8');
  const pattern=/^  function listeningLessonMarkup\(\)\{return [^\n]+;\}$/m;
  if(!pattern.test(dashboard))throw new Error('Listening entry insertion point missing');
  dashboard=dashboard.replace(pattern,()=> '  function listeningLessonMarkup(){return '+JSON.stringify(markup)+';}');
  fs.writeFileSync(dashboardPath,dashboard);
  let index=fs.readFileSync(path.join(root,'index.html'),'utf8');
  for(const name of ['study-dashboard.js','study-dashboard.css']){
    const hash=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'assets',name))).digest('hex').slice(0,12);
    index=index.replace(new RegExp('/assets/'+name.replace('.','\\.')+'\\?v=[^"<>]+','g'),'/assets/'+name+'?v='+hash);
  }
  fs.writeFileSync(path.join(root,'index.html'),index);
  return {lessons:result,catalog:'assets/listening-lessons.html'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(build()));
