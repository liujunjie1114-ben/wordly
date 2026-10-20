import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const name of ['word-tasks.js','teacher-word-tasks.js','teacher-audio.js','word-tasks.css','study-dashboard.js']){
 const version=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'assets',name))).digest('hex').slice(0,12);
 html=html.replace(new RegExp('/assets/'+name.replaceAll('.','\\.')+'\\?v=[^"<>]+','g'),'/assets/'+name+'?v='+version);
}
fs.writeFileSync(path.join(root,'index.html'),html);
console.log('Versioned daily word tasks and dashboard');
