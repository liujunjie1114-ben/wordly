// Publish only a fully generated, validated public pack. No user databases are accessed.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const build=process.argv[2];
if(!build)throw Error('Pass the completed generator output directory');
const manifest=JSON.parse(fs.readFileSync(path.join(build,'neural-audio-manifest.json'),'utf8'));
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const old=JSON.parse(html.match(/const AUDIO_PACK=(\{[^\n]+\});/)[1]);
const next=Object.fromEntries(manifest.clips.map(c=>[c.key,c.url]));
if(manifest.engine!=='Kokoro-82M'||manifest.voice!=='bf_emma'||manifest.clips.length<2936||Object.keys(next).length!==manifest.clips.length)throw Error('Incomplete or unexpected voice pack');
for(const key of Object.keys(old))if(!next[key])throw Error('Missing existing clip: '+key);
for(const clip of manifest.clips){
  if(!/^\/assets\/[a-f0-9]{24}\.mp3$/.test(clip.url))throw Error('Invalid clip path');
  const bytes=fs.readFileSync(path.join(build,'clips',path.basename(clip.url)));
  const hash=createHash('sha256').update(bytes).digest('hex');
  if(hash!==clip.sha256||!clip.url.endsWith(hash.slice(0,24)+'.mp3')||bytes.length<1000||clip.duration<.25)throw Error('Invalid clip: '+clip.key);
}
const license=fs.readFileSync(path.join(build,'kokoro-LICENSE.txt'),'utf8');
if(!license.includes('Apache License'))throw Error('Missing model license');
for(const clip of manifest.clips)fs.copyFileSync(path.join(build,'clips',path.basename(clip.url)),path.join(root,'assets',path.basename(clip.url)));
fs.writeFileSync(path.join(root,'assets/neural-audio-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(root,'assets/kokoro-LICENSE.txt'),license);
html=html.replace(/const AUDIO_PACK=\{[^\n]+\};/,'const AUDIO_PACK='+JSON.stringify(next)+';')
  .replaceAll('内置英式合成音频','Kokoro 英式神经语音')
  .replace("playbackStatus('播放完成 · '+n+'次');","playbackStatus('播放完成 · '+n+'次 · '+(usePacked?'Kokoro 英式语音':'设备英语语音'));")
  .replace("?'发音已就绪'","?'Kokoro 英式发音已就绪'")
  .replaceAll('内置807词汇和例句使用固定英式合成音频。','内置807词汇和例句使用固定 Kokoro 英式神经语音。')
  .replace('807词条与已收录例句使用 Piper en_GB-cori-medium 合成英式英语音频。模型发布于 rhasspy/piper-voices，训练录音来自 LibriVox 公共领域材料。音频仅为合成学习参考，非原书配套录音；多音词与疑似错误条目仍需语境核对。新增或修改的个人例句使用设备英语语音。','内置词条和已收录例句使用 Kokoro-82M v1.0 的 bf_emma 英式神经语音，提前生成后直接播放。已反馈词加入固定音素纠正，其他词通过英语发音词典与音素转换生成。音频是合成学习参考，非原书录音；多音词仍需结合语境核对。尚未收录的自定义词汇或个人例句，以及音频加载失败时的备用朗读，使用设备英语语音。')
  .replace('https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_GB/cori/medium/MODEL_CARD','https://huggingface.co/hexgrad/Kokoro-82M')
  .replace('语音模型与来源说明</a></details>','语音模型与来源说明</a> · <a href="/assets/kokoro-LICENSE.txt" target="_blank" rel="noopener">Apache-2.0 许可</a></details>')
  .replace('if(w)playText(w.en,+db.settings.plays,+db.settings.interval,.8);','if(w)playText(w.en,+db.settings.plays,+db.settings.interval,1);')
  .replace('speak:text=>playText(text,1,0,.85)','speak:text=>playText(text,1,0,1)')
  .replace(/word-audio\.js\?v=[^"']+/,'word-audio.js?v=20261013-kokoro1');
if(!html.includes('id="playbackStatus"'))html=html.replace('${e?`<div class="example-full">','<p id="playbackStatus" class="study-audio-status" role="status" aria-live="polite" hidden></p>${e?`<div class="example-full">');
if(html.includes('Piper en_GB-cori-medium')||!html.includes('Kokoro 英式神经语音'))throw Error('Audio source text was not updated');
fs.writeFileSync(path.join(root,'index.html'),html);
console.log(JSON.stringify({engine:manifest.engine,voice:manifest.voice,clips:manifest.clips.length,oldFilesRetained:true,userDataTouched:false}));
