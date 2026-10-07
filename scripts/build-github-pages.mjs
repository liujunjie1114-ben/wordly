import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'site-pages');
const original = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
// Project Pages lives at /wordly/. Only the published copy uses relative assets.
const html = original.replaceAll('/assets/', './assets/');
const references = [...new Set([...html.matchAll(/\.\/assets\/([A-Za-z0-9._-]+)/g)].map(match => match[1]))];
if (!references.length || /(?<!\.)\/assets\//.test(html)) {
  throw new Error('Asset path adaptation did not finish.');
}
for (const name of references) {
  const file = path.join(root, 'assets', name);
  if (!fs.existsSync(file) || !fs.statSync(file).isFile() || !fs.statSync(file).size) {
    throw new Error(`Missing or empty asset: ${name}`);
  }
}
for (const [, script] of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
  if (script.trim()) new vm.Script(script);
}
for (const name of references.filter(name => name.endsWith('.js'))) {
  new vm.Script(fs.readFileSync(path.join(root, 'assets', name), 'utf8'), {filename: name});
}
JSON.parse(fs.readFileSync(path.join(root, 'assets/listening-catalog.json'), 'utf8'));
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, 'index.html'), html);
fs.mkdirSync(path.join(output, 'assets'), { recursive: true });
for (const entry of fs.readdirSync(path.join(root, 'assets'), { withFileTypes: true })) {
  if (!entry.isFile()) throw new Error(`Unexpected asset directory: ${entry.name}`);
  fs.copyFileSync(path.join(root, 'assets', entry.name), path.join(output, 'assets', entry.name));
}
fs.writeFileSync(path.join(output, '.nojekyll'), '');
console.log(JSON.stringify({ output, assetReferences: references.length, originalSourceUnchanged: true }));
