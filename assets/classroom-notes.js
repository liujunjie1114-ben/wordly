(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WordlyClassroomNotes=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const filename=p=>String(p).split(/[\\/]/).pop();
 const subjects={reading:'阅读',writing:'写作'};
 function catalog(entries,subject){
  const groups=new Map();
  for(const e of entries||[]){if(e.kind==='vocabulary'||!e.categories?.includes(subject))continue;for(const s of e.sources||[]){const name=filename(s.path);if(!/课|lesson|笔记/i.test(name))continue;if(!groups.has(s.path))groups.set(s.path,{path:s.path,name,title:name.replace(/\.[^.]+$/,''),count:0,date:(name.match(/20\d{2}-\d{2}-\d{2}/)||[])[0]||'',subject});groups.get(s.path).count++;}}
  const courses=[],handouts=[];
  for(const g of groups.values()){
   if(/\.md$/i.test(g.name)&&/课/.test(g.name)){
    g.label=g.date?`${Number(g.date.slice(5,7))}月${Number(g.date.slice(8))}日`:/第二|第2/.test(g.name)?'第2次课':'课堂笔记';
    if(g.name==='阅读第二次课.md')g.title='第2次课 · 填空题、摘要题与同义替换';
    else g.title=g.title.replace(/_?20\d{2}-\d{2}-\d{2}_?/,' · ').replace(/_/g,' · ');
    courses.push(g);
   }else{g.label='课程讲义';handouts.push(g);}
  }
  if(subject==='writing')courses.push({path:'',name:'writing-lesson-2026-10-17',title:'图表写作 · 交通表格与发电饼图',label:'10月17日',date:'2026-10-17',href:'./assets/writing-lesson-2026-10-17.html',subject});
  courses.sort((a,b)=>b.date.localeCompare(a.date)||a.title.localeCompare(b.title,'zh-CN',{numeric:true}));
  handouts.sort((a,b)=>a.name.localeCompare(b.name,'zh-CN',{numeric:true})||a.path.localeCompare(b.path));
  return {courses,handouts};
 }
 function archiveMarkup(entries,subject){
  const name=subjects[subject];if(!name)return '';const {courses,handouts}=catalog(entries,subject);
  const row=g=>g.href?`<a href="${g.href}" target="_blank" rel="noopener"><time datetime="${g.date}">${esc(g.label)}</time><span>${esc(g.title)}</span><span aria-hidden="true">↗</span></a>`:`<button type="button" class="sd-course-row" data-sd-course-source="${esc(g.path)}"><span class="sd-course-date">${esc(g.label)}</span><span>${esc(g.title)}<small>${g.count} 条已整理内容${g.label==='课程讲义'?' · 不是新增上课次数':''}</small></span><span aria-hidden="true">↗</span></button>`;
  return `<section class="sd-class-lesson sd-class-archive" aria-label="${name}课堂复盘"><div class="sd-class-heading"><span class="sd-class-icon" aria-hidden="true">▤</span><div><span class="sd-class-date">CLASS NOTES · ${courses.length} 份课堂笔记</span><h2>${name}课堂复盘</h2></div></div><nav class="sd-class-list" aria-label="按课程打开${name}笔记">${courses.map(row).join('')||'<p class="sd-caption">当前浏览器尚未导入按课整理的笔记，已有学习记录不会被重置。</p>'}</nav>${handouts.length?`<details class="sd-course-handouts" open><summary>课程讲义与补充笔记 · ${handouts.length} 份</summary><div class="sd-class-list">${handouts.map(row).join('')}</div></details>`:''}</section>`;
 }
 function inline(text){return esc(text).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1');}
 function renderMarkdown(markdown){
  const lines=String(markdown||'').split(/\r?\n/),out=[];let paragraph=[],code=null,list=null;
  const flush=()=>{if(paragraph.length){out.push('<p>'+paragraph.map(inline).join('<br>')+'</p>');paragraph=[];}if(list){out.push('</'+list+'>');list=null;}};
  for(let i=0;i<lines.length;i++){const line=lines[i];
   if(/^```/.test(line)){flush();if(code!==null){out.push('<pre><code>'+esc(code.join('\n'))+'</code></pre>');code=null;}else code=[];continue;}
   if(code!==null){code.push(line);continue;}
   if(/^\s*\|/.test(line)&&i+1<lines.length&&/^\s*\|?\s*:?-{3}/.test(lines[i+1])){flush();const cells=s=>s.trim().replace(/^\||\|$/g,'').split('|').map(s=>s.trim());out.push('<div class="classroom-table"><table><thead><tr>'+cells(line).map(s=>'<th scope="col">'+inline(s)+'</th>').join('')+'</tr></thead><tbody>');i++;while(i+1<lines.length&&/^\s*\|/.test(lines[i+1])){i++;out.push('<tr>'+cells(lines[i]).map(s=>'<td>'+inline(s)+'</td>').join('')+'</tr>');}out.push('</tbody></table></div>');continue;}
   const heading=/^(#{1,6})\s+(.+)$/.exec(line);if(heading){flush();const level=Math.min(heading[1].length+1,4);out.push(`<h${level}>${inline(heading[2])}</h${level}>`);continue;}
   if(/^\s*---+\s*$/.test(line)){flush();out.push('<hr>');continue;}
   if(!line.trim()){flush();continue;}
   const bullet=/^\s*(?:[-*]|\d+[.、])\s+(.+)$/.exec(line);if(bullet){if(paragraph.length){out.push('<p>'+paragraph.map(inline).join('<br>')+'</p>');paragraph=[];}const type=/^\s*\d/.test(line)?'ol':'ul';if(list!==type){if(list)out.push('</'+list+'>');out.push('<'+type+'>');list=type;}out.push('<li>'+inline(bullet[1])+'</li>');continue;}
   if(/^>/.test(line)){flush();out.push('<blockquote>'+inline(line.replace(/^>\s?/,''))+'</blockquote>');continue;}
   if(list){out.push('</'+list+'>');list=null;}paragraph.push(line);
  }
  flush();if(code!==null)out.push('<pre><code>'+esc(code.join('\n'))+'</code></pre>');return out.join('\n');
 }
 function renderCourse(entries,path){
  const all=(entries||[]).filter(e=>e.kind!=='vocabulary'&&e.sources?.some(s=>s.path===path)).slice().sort((a,b)=>a.title.localeCompare(b.title,'zh-CN',{numeric:true}));
  const subject=all.find(e=>e.categories?.some(s=>subjects[s]))?.categories.find(s=>subjects[s])||'reading';
  const md=/\.md$/i.test(filename(path));
  return `<div class="study-actions"><button type="button" class="btn light" data-study-course-back="${subject}">← ${subjects[subject]}课堂目录</button><button type="button" class="btn light" data-study-list>分章节查看</button></div><article class="panel classroom-reader"><header><span class="eyebrow">WORDLY · CLASS NOTES</span><h1>${esc(filename(path))}</h1><p>${all.length} 条已整理内容 · 按原章节连续阅读</p>${md?'':'<p class="classroom-source-note">以下是已整理并导入的讲义内容，不代表原文件全文。</p>'}</header><nav class="classroom-toc" aria-label="课程章节目录">${all.map(e=>`<a href="#course-${esc(e.id)}">${esc(e.title)}</a>`).join('')}</nav>${all.map(e=>{const body=e.explanation||e.original||e.summary||'';return `<section id="course-${esc(e.id)}" class="classroom-chapter">${/^\s*#/.test(body)?'':`<h2>${esc(e.title)}</h2>`}${renderMarkdown(body)}${['application','example','pitfalls','correction','practice','question'].filter(k=>e[k]&&e[k]!==body).map(k=>`<details class="classroom-extra"><summary>${({application:'应用与提纲',example:'例子',pitfalls:'易错点',correction:'纠正说明',practice:'练习方法',question:'回忆问题'})[k]}</summary>${renderMarkdown(e[k])}</details>`).join('')}</section>`;}).join('')}</article>`;
 }
 return {catalog,archiveMarkup,renderMarkdown,renderCourse};
});
