(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WordlyTeacherAudio=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function trackKey(name){const m=String(name).normalize('NFKC').match(/^0?(10|[1-9])\s+Cambridge\s+(10|[1-9])(?:\s|-|–|—).*\.mp3$/i);return m&&m[1]===m[2]?'chapter6-test-'+Number(m[1]):null;}
  function planFiles(files){
    const seen=new Set(),plan=Array.from(files,file=>{const key=trackKey(file.name);if(!key)throw Error('请选择原始的 01–10 Cambridge 横向测试 MP3。');if(!file.size)throw Error('音频文件为空。');if(file.size>50*1024*1024)throw Error('单份原声不能超过50 MB。');if(seen.has(key))throw Error('同一 Test 的音频重复，请每份只选一个文件。');seen.add(key);return {key,file};});
    if(!plan.length)throw Error('请先选择音频文件。');return plan;
  }
  function database(){return new Promise((resolve,reject)=>{if(typeof indexedDB==='undefined'){reject(Error('当前浏览器不支持本机音频保存。'));return;}const request=indexedDB.open('wordly_teacher_audio_v1',1);request.onupgradeneeded=()=>request.result.createObjectStore('tracks',{keyPath:'key'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||Error('无法打开本机原声库。'));request.onblocked=()=>reject(Error('原声库正被其他页面使用，请稍后重试。'));});}
  async function importFiles(files){
    const plan=planFiles(files),db=await database();
    try{return await new Promise((resolve,reject)=>{const tx=db.transaction('tracks','readwrite'),store=tx.objectStore('tracks');for(const {key,file} of plan)store.put({key,name:file.name,blob:file,updated:Date.now()});tx.oncomplete=()=>resolve(plan.map(p=>p.key));tx.onabort=tx.onerror=()=>reject(tx.error||Error('本机空间不足，音频没有保存，请保留原文件。'));});}finally{db.close();}
  }
  async function read(key){const db=await database();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('tracks','readonly'),request=key?tx.objectStore('tracks').get(key):tx.objectStore('tracks').getAllKeys();request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}finally{db.close();}}
  return {trackKey,planFiles,importFiles,get:read,list:()=>read()};
});
