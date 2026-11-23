"""Generate missing public P1 word clips with Kokoro bf_emma; preserve existing clips."""
import argparse,hashlib,json,re,sys,shutil
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--runtime',type=Path,required=True);a=p.parse_args();sys.path.insert(0,str(a.runtime));sys.stdout.reconfigure(encoding='utf8')
import numpy as np,lameenc,espeakng_loader
from kokoro_onnx import Kokoro,EspeakConfig
root=Path(__file__).resolve().parent.parent
source=(root/'assets/p1-spelling.js').read_text(encoding='utf8');entries=json.loads(re.search(r'const entries=(.*);\nconst tasks=',source)[1])
html=(root/'index.html').read_text(encoding='utf8');match=re.search(r'const AUDIO_PACK=(\{[^\n]+\});',html);pack=json.loads(match[1]);missing=[e['en'] for e in entries if e['en'].lower() not in pack]
model=a.runtime/'kokoro-v1.0.int8.onnx';voices=a.runtime/'voices-v1.0.bin';model_hash=hashlib.sha256(model.read_bytes()).hexdigest();assert hashlib.sha256(voices.read_bytes()).hexdigest()=='bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d'
# espeak's Windows data loader needs an ASCII path; this task-owned copy contains only public library data.
ascii_data=Path('C:/wordly-p1-phonemes-20261123/espeak-ng-data')
if not ascii_data.exists():shutil.copytree(espeakng_loader.get_data_path(),ascii_data)
k=Kokoro(str(model),str(voices),espeak_config=EspeakConfig(data_path=str(ascii_data),lib_path=espeakng_loader.get_library_path()))
progress=root/'tmp/p1-audio-progress.json';clips=json.loads(progress.read_text(encoding='utf8')) if progress.exists() else []
for i,text in enumerate(missing,1):
 key=text.lower();old=next((c for c in clips if c['key']==key),None)
 if old and (root/old['url'].lstrip('/')).exists():continue
 phonemes=k.tokenizer.phonemize(text+'.',lang='en-gb');samples,rate=k.create(phonemes,voice='bf_emma',speed=1.0,lang='en-gb',is_phonemes=True)
 assert .15<len(samples)/rate<10 and np.isfinite(samples).all() and np.max(np.abs(samples))>.005
 pcm=(np.clip(samples,-1,1)*32767).astype(np.int16);enc=lameenc.Encoder();enc.set_bit_rate(128);enc.set_in_sample_rate(rate);enc.set_channels(1);enc.set_quality(2);blob=bytes(enc.encode(pcm.tobytes())+enc.flush());digest=hashlib.sha256(blob).hexdigest();filename=digest[:24]+'.mp3';target=root/'assets'/filename
 if target.exists():assert hashlib.sha256(target.read_bytes()).hexdigest()==digest
 else:target.write_bytes(blob)
 clip={'key':key,'text':text,'url':'/assets/'+filename,'sha256':digest,'duration':round(len(samples)/rate,4),'phonemes':phonemes,'overrides':[],'inputHash':hashlib.sha256((text+phonemes+model_hash+'bf_emma').encode()).hexdigest(),'engine':'kokoro-onnx-0.4.7','modelHash':model_hash,'voice':'bf_emma'}
 clips.append(clip);progress.write_bytes(json.dumps(clips,ensure_ascii=False,indent=2).encode());print(f'{i}/{len(missing)} {text} {clip["duration"]}s',flush=True)
for text in missing:
 c=next(c for c in clips if c['key']==text.lower());assert hashlib.sha256((root/c['url'].lstrip('/')).read_bytes()).hexdigest()==c['sha256'];pack[c['key']]=c['url']
manifest_path=root/'assets/neural-audio-manifest.json';manifest=json.loads(manifest_path.read_text(encoding='utf8'));seen={c['key'] for c in manifest['clips']};manifest['clips'].extend(c for c in clips if c['key'] not in seen);manifest_path.write_bytes(json.dumps(manifest,ensure_ascii=False,indent=2).encode())
html=html[:match.start(1)]+json.dumps(pack,ensure_ascii=False,separators=(',',':'))+html[match.end(1):];(root/'index.html').write_bytes(html.encode())
print(json.dumps({'added':len(missing),'p1_audio_coverage':sum(e['en'].lower() in pack for e in entries),'modelHash':model_hash}))
