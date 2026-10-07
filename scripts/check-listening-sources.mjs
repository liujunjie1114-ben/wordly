import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import core from '../assets/listening-core.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root,'assets/listening-catalog.json'),'utf8'));
const targets = catalog.episodes.flatMap(e=>e.provider==='BBC'
  ? [{kind:'audio',url:e.audio},...(e.transcript?[{kind:'transcript',url:e.transcript}]:[])]
  : [{kind:'TED player',url:core.tedEmbedURL(e.source)}]);
let cursor = 0;
const results = [];
await Promise.all(Array.from({length:4},async()=>{
  while(cursor<targets.length){const item=targets[cursor++];try{
    const response=await fetch(item.url,{method:'HEAD',signal:AbortSignal.timeout(20000)});
    const type=response.headers.get('content-type')||'';
    const validType=item.kind==='audio'?type.startsWith('audio/'):item.kind==='transcript'?type.includes('pdf'):type.includes('html');
    results.push({...item,status:response.status,contentType:type,passed:response.ok&&validType});
  }catch(error){results.push({...item,passed:false,error:error.message});}}
}));
const failures=results.filter(item=>!item.passed);
const report={checkedAt:new Date().toISOString(),checked:results.length,passed:results.length-failures.length,failures,results};
const reportArg=process.argv.indexOf('--report');
if(reportArg>=0)fs.writeFileSync(path.resolve(process.argv[reportArg+1]),JSON.stringify(report,null,2));
console.log(JSON.stringify({checked:report.checked,passed:report.passed,failures},null,2));
if(failures.length)process.exitCode=1;
