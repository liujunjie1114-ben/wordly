import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const name of ['study-core.js','study-library.js','study-library.css','knowledge-checks.js','classroom-notes.js','study-dashboard.js','study-dashboard.css']){
 const hash=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'assets',name))).digest('hex').slice(0,12);
 html=html.replace(new RegExp('/assets/'+name.replaceAll('.','\\.')+'\\?v=[^"<>]+','g'),'/assets/'+name+'?v='+hash);
}
fs.writeFileSync(path.join(root,'index.html'),html);
console.log('Versioned knowledge status, checks and library assets');
