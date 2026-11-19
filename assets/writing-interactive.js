(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.WordlyWritingInteractive=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){
 'use strict';
 // Only reviewed lesson code may run. Private teaching content stays in the user's database.
 const trusted={'lesson-2026-11-18':'168f5e91d564936cc8e649e5d6eac7747bab383b5257839af5fce8fcb24b44cf'};
 const cleanups=new Set();
 const json=value=>JSON.stringify(value).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
 async function documentFor(section,progress,token){
  if(!trusted[section.id]||typeof section.html!=='string'||section.html.length>200000)throw Error('未知互动课程，已停止运行。');
  const digest=[...new Uint8Array(await root.crypto.subtle.digest('SHA-256',new TextEncoder().encode(section.html)))].map(n=>n.toString(16).padStart(2,'0')).join('');
  if(digest!==trusted[section.id])throw Error('互动课程内容验证失败，未运行课程脚本。');
  const initial=progress?{privateContent:{version:1,state:progress.state}}:null;
  const bridge=`(()=>{const token=${json(token)},id=${json(section.id)};window.openai={widgetState:${json(initial)},setWidgetState:async value=>parent.postMessage({type:'wordly-lesson-progress',token,id,state:value?.privateContent?.state},'*')};let last=0;const resize=()=>{const height=Math.ceil(document.getElementById('english-review-nov18').getBoundingClientRect().height)+40;if(height!==last){last=height;parent.postMessage({type:'wordly-lesson-size',token,id,height},'*');}};addEventListener('load',()=>{new ResizeObserver(resize).observe(document.getElementById('english-review-nov18'));resize();});})();`;
  return '<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; font-src data:; frame-src \'none\'; connect-src \'none\'; form-action \'none\'; base-uri \'none\'"><script>'+bridge+'</script></head><body>'+section.html+'</body></html>';
 }
 function mount(node,section,{getProgress,save,status,isActive}){
  const frame=document.createElement('iframe'),token=root.crypto.randomUUID(),initial=getProgress?.();let disposed=false,baseline=initial?.state||{};
  frame.title=section.title;frame.className='wc-interactive-frame';frame.setAttribute('sandbox','allow-scripts');frame.setAttribute('referrerpolicy','no-referrer');node.replaceChildren(frame);
  const active=()=>!disposed&&frame.isConnected&&isActive();
  const onMessage=event=>{
   const data=event.data;if(!active()||event.source!==frame.contentWindow||!data||data.token!==token||data.id!==section.id)return;
   if(data.type==='wordly-lesson-size'&&Number.isFinite(data.height))frame.style.height=Math.min(16000,Math.max(650,data.height+8))+'px';
   if(data.type==='wordly-lesson-progress'){try{if(save(data.state,baseline)){baseline=structuredClone(data.state);status('互动练习已自动保存到 Wordly。');}else status('互动练习暂未保存，请保留当前页面并导出备份。');}catch{status('互动练习格式不正确，原记录保持不变。');}}
  };
  root.addEventListener('message',onMessage);
  const dispose=()=>{disposed=true;root.removeEventListener('message',onMessage);cleanups.delete(dispose);};cleanups.add(dispose);
  documentFor(section,initial,token).then(html=>{if(active())frame.srcdoc=html;}).catch(error=>{if(active()){node.textContent=error.message;status(error.message);}dispose();});
  return dispose;
 }
 function reset(){for(const stop of [...cleanups])stop();}
 return {documentFor,mount,reset};
});
