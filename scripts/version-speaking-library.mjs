import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const files=['speaking-library.js','speaking-library.css','speaking-part2-course.html'];
const hash=createHash('sha256');
for(const name of files)hash.update(fs.readFileSync(path.join(root,'assets',name)));
const version=hash.digest('hex').slice(0,12),file=path.join(root,'index.html');
let html=fs.readFileSync(file,'utf8');
for(const name of files.slice(0,2)){
  const escaped=name.replaceAll('.','\\.');
  if(!new RegExp(`/assets/${escaped}\\?v=`).test(html))throw Error(`Missing ${name} reference`);
  html=html.replace(new RegExp(`(/assets/${escaped}\\?v=)[^"']+`),`$1${version}`);
}
fs.writeFileSync(file,html);
console.log(JSON.stringify({version,files}));
