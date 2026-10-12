import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inline=value=>escape(value).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');

// Render the uploaded Markdown as inert text. No HTML, scripts or remote embeds are accepted.
export function renderLesson(source){
  const out=[],toc=[];let paragraph=[],quote=[],list=null,table=false,fence=null,code=[],section=0;
  const flushText=()=>{if(paragraph.length){out.push('<p>'+paragraph.map(inline).join('<br>')+'</p>');paragraph=[];}if(quote.length){out.push('<blockquote>'+quote.map(inline).join('<br>')+'</blockquote>');quote=[];}};
  const close=()=>{flushText();if(list){out.push('</'+list+'>');list=null;}if(table){out.push('</tbody></table></div>');table=false;}};
  for(const line of source.split(/\r?\n/)){
    if(fence!==null){if(/^```\s*$/.test(line)){out.push('<pre><code>'+escape(code.join('\n'))+'</code></pre>');fence=null;code=[];}else code.push(line);continue;}
    if(/^```/.test(line)){close();fence=line.slice(3);continue;}
    if(!line.trim()){close();continue;}
    const heading=line.match(/^(#{1,6})\s+(.+)$/);
    if(heading){close();if(heading[1].length===1){const numbered=heading[2].match(/^(\d+)\./);if(section++===0||numbered){const id=numbered?'section-'+numbered[1]:'lesson-title';toc.push({id,title:heading[2]});out.push('<h2 id="'+id+'">'+inline(heading[2])+'</h2>');}else out.push('<h3>'+inline(heading[2])+'</h3>');}else out.push('<h'+Math.min(6,heading[1].length+1)+'>'+inline(heading[2])+'</h'+Math.min(6,heading[1].length+1)+'>');continue;}
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

export function build(){
  const source=fs.readFileSync(path.join(root,'assets/listening-lesson-2026-10-12.md'),'utf8');
  const {html,toc}=renderLesson(source);
  const links=toc.slice(1).map(item=>'<a href="#'+item.id+'">'+escape(item.title)+'</a>').join('\n');
  const page=`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#254b3c"><title>听力课堂复盘 · 2026-10-12 · Wordly</title><style>
  :root{color-scheme:light;--ink:#23392f;--muted:#5e7065;--line:#e0e7df;--paper:#fff;--bg:#f3f5f1}*{box-sizing:border-box}html{scroll-padding-top:24px}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.85 system-ui,"Microsoft YaHei",sans-serif}a{color:#345d48;text-underline-offset:4px}a:focus-visible,summary:focus-visible{outline:2px solid #345d48;outline-offset:4px}header,main,footer{max-width:1160px;margin:auto;padding:24px 28px}header{display:flex;justify-content:space-between;gap:16px;border-bottom:1px solid var(--line);font-size:13px}header b{letter-spacing:1px}header nav{display:flex;gap:18px;flex-wrap:wrap}h1{font-size:28px;line-height:1.4;letter-spacing:-.5px;margin:10px 0}h2{font-size:22px;line-height:1.5;margin:34px 0 16px;scroll-margin-top:24px}h3{font-size:18px;line-height:1.6;margin:26px 0 12px}h4,h5,h6{font-size:16px;margin:22px 0 10px}p{margin:12px 0}.kicker{font-size:11px;letter-spacing:1.5px;font-weight:700;color:var(--muted)}.lead{max-width:740px;color:var(--muted)}.quick-links{display:flex;flex-wrap:wrap;gap:10px;margin:22px 0}.quick-links a,.download{display:inline-block;padding:8px 14px;background:var(--paper);border:1px solid var(--line);border-radius:9px;font-size:13px;text-decoration:none}.quick-links a:first-child{background:#254b3c;color:white;border-color:#254b3c}.principles{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:24px 0 30px}.principles div{padding:17px 18px;background:var(--paper);border:1px solid var(--line);border-radius:12px}.principles b{display:block;font-size:15px}.principles p{color:var(--muted);font-size:13px;margin:5px 0 0}.reading{display:grid;grid-template-columns:240px minmax(0,1fr);gap:24px;align-items:start}.contents{position:sticky;top:20px;background:var(--paper);padding:18px;border:1px solid var(--line);border-radius:12px}.contents summary{font-weight:650;cursor:pointer;font-size:14px}.contents nav{display:grid;gap:7px;margin-top:14px;max-height:72vh;overflow:auto}.contents a{font-size:12px;line-height:1.6;text-decoration:none;padding:5px 0}.contents a:hover{text-decoration:underline}article{background:var(--paper);padding:8px 30px 30px;border:1px solid var(--line);border-radius:14px;min-width:0}article h2:first-child{font-size:21px}blockquote{margin:16px 0;padding:13px 16px;background:#f0f4ed;border-radius:9px}ul,ol{padding-left:24px}li{margin:4px 0}code{font:13px/1.7 ui-monospace,Consolas,monospace;overflow-wrap:anywhere}p code,li code{padding:2px 5px;background:#f0f4ed;border-radius:4px}pre{white-space:pre-wrap;overflow-wrap:anywhere;padding:18px;background:#f6f8f4;border:1px solid var(--line);border-radius:10px}hr{border:0;border-top:1px solid var(--line);margin:28px 0}.table-wrap{overflow:auto}table{border-collapse:collapse;width:100%;font-size:13px}td,th{padding:10px 12px;border-bottom:1px solid var(--line);text-align:left;min-width:100px}th{background:#f6f8f4}footer{font-size:12px;color:var(--muted)}.notice{font-size:12px;color:var(--muted)}@media(max-width:760px){header,main,footer{padding:18px}header{align-items:flex-start}.principles{grid-template-columns:1fr;gap:8px}.principles div{padding:12px 15px}.reading{display:block}.contents{position:static;margin-bottom:16px}.contents nav{max-height:260px}article{padding:4px 19px 24px}h1{font-size:25px}h2{font-size:20px}.lead{font-size:14px}header nav{gap:10px}header b{display:none}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}@media print{header,.contents,.quick-links,.principles,footer{display:none}.reading{display:block}body,article{background:white}article{border:0;padding:0}main{max-width:none;padding:0}pre,blockquote,tr{break-inside:avoid}}
  </style></head><body><header><b>WORDLY / CLASS NOTES</b><nav aria-label="返回导航"><a href="../#home">← 今日计划</a><a href="../#hub-listening">听力学习</a><a href="listening-lesson-2026-10-12.md" download>下载原始笔记</a></nav></header><main><span class="kicker">LISTENING REVIEW · 2026.10.12</span><h1>先听懂关系，再决定答案。</h1><p class="lead">填空题、地图题与单选题的课堂深度复盘。把定位词当作入口，把原文证据和语义关系当作判断依据。</p><div class="quick-links"><a href="#section-29">一页速记</a><a href="#section-27">70 分钟训练</a><a href="#section-25">错题复盘模板</a><a href="#lesson-title">阅读全文</a></div><div class="principles" aria-label="本课重点"><div><b>01 · 词出现，不等于答案出现</b><p>先看题干缺哪一类信息，再判断原因、背景、时间和人物。</p></div><div><b>02 · 地图每题确认当前位置</b><p>听到新参考点就重置，继续跟住地标、方向与顺序。</p></div><div><b>03 · 验证整个选项</b><p>转折、否定和修饰关系都要跟住，不能只凭相同单词确认。</p></div></div><p class="notice">以下完整保留你提供的课堂复盘。例题结论依据这份笔记，尚未对照原题和完整录音复核；本次未附课堂音频。</p><div class="reading"><details class="contents" open><summary>章节目录 · 30 节</summary><nav aria-label="课堂复盘章节">${links}</nav></details><article aria-label="课堂复盘全文">${html}</article></div></main><footer>课堂笔记 · 2026-10-12 ｜ <a href="#lesson-title">回到全文开头 ↑</a> · <a href="../#hub-listening">返回听力学习</a></footer></body></html>`;
  fs.writeFileSync(path.join(root,'assets/listening-lesson-2026-10-12.html'),page);
  return {chapters:toc.length-1,sourceLines:source.split(/\r?\n/).length,output:'assets/listening-lesson-2026-10-12.html'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(build()));
