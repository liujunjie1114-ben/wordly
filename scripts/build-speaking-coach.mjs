import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const coach=createRequire(import.meta.url)('../assets/speaking-coach.js');
const source=fs.readFileSync(path.join(root,'assets/speaking-teacher-2026-10-11.md'),'utf8');
const lines=source.split(/\r?\n/),out=[];
let list=false,table=false;
const inline=s=>coach.escape(s).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
const close=()=>{if(list){out.push('</ul>');list=false;}if(table){out.push('</tbody></table></div>');table=false;}};
for(const line of lines){
  if(!line.trim()){close();continue;}
  if(/^\|/.test(line)){if(/^\|[- :|]+\|$/.test(line))continue;if(!table){close();table=true;out.push('<div class="table-wrap"><table><tbody>');}out.push('<tr>'+line.split('|').slice(1,-1).map(c=>'<td>'+inline(c.trim())+'</td>').join('')+'</tr>');continue;}
  if(/^\s*(?:- |\d+\. )/.test(line)){if(!list){close();out.push('<ul>');list=true;}out.push('<li>'+inline(line.replace(/^\s*(?:- |\d+\. )/,''))+'</li>');continue;}
  close();const heading=line.match(/^(#{1,4}) (.+)/);
  if(heading){const level=Math.min(3,heading[1].length+1);out.push(`<h${level}>${inline(heading[2])}</h${level}>`);}
  else if(line==='---')out.push('<hr>');
  else out.push(line.startsWith('> ')?'<blockquote>'+inline(line.slice(2))+'</blockquote>':'<p>'+inline(line)+'</p>');
}
close();
const html=`<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>课堂意见 · 2026-10-11 · Wordly</title><style>body{margin:0;background:#f6f8f3;color:#314e3e;font:14px/1.9 system-ui,"Microsoft YaHei",sans-serif}main{max-width:850px;margin:auto;padding:24px}a{color:#527b5e}header{display:flex;gap:20px;justify-content:space-between;font-size:12px}h1{font-size:24px}h2{font-size:20px;margin-top:30px}h3{font-size:16px;margin-top:24px}p,li{overflow-wrap:anywhere}blockquote{margin:14px 0;padding:12px 16px;background:#eef3e8;border-radius:9px}code{font-size:12px;background:#edf2e8;padding:3px 6px;border-radius:4px}hr{border:0;border-top:1px solid #e1e8da;margin:28px 0}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse;font-size:13px}td{padding:10px;border-bottom:1px solid #e0e7da;min-width:100px}article{background:#fff;padding:24px;border:1px solid #e1e8db;border-radius:14px;margin-top:20px}.notice{font-size:12px;color:#849677}@media(max-width:600px){main{padding:16px}article{padding:17px}}</style></head><body><main><header><a href="../#speaking-library" target="_top">← 返回口语整理库</a><a href="speaking-teacher-2026-10-11.md" download>下载课堂意见</a></header><h1>题干、证据与串题 · 本节课意见</h1><p class="notice">2026-10-11 课堂记录。推荐例子需确认真实细节；Part 3 是下一课预告，尚无本节老师的具体范文。</p><article>${out.join('\n')}</article></main></body></html>`;
fs.writeFileSync(path.join(root,'assets',coach.reference.file),html);
console.log(JSON.stringify({sourceLines:lines.length,output:coach.reference.file,profiles:Object.keys(coach.profiles).length}));
