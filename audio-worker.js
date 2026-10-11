(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else{
  const store=api.createStore({caches:root.caches,fetch:root.fetch.bind(root),scope:root.registration.scope});
  root.addEventListener('install',event=>event.waitUntil(root.skipWaiting()));
  root.addEventListener('activate',event=>event.waitUntil(root.clients.claim()));
  root.addEventListener('fetch',event=>{if(api.isAudioRequest(event.request,root.registration.scope))event.respondWith(store.respond(event.request));});
}})(typeof self!=='undefined'?self:this,function(){
  const CACHE='wordly-pronunciation-v1';
  function isAudioRequest(request,scope){
    const base=new URL(scope),url=new URL(request.url),range=request.headers.get('Range');
    return request.method==='GET'&&url.origin===base.origin&&url.pathname.startsWith(base.pathname+'assets/')&&/^\/[\w/-]*assets\/[a-f0-9]{24}\.mp3$/.test(url.pathname)&&(!range||/^bytes=(?:\d+-\d*|-\d+)$/.test(range));
  }
  async function rangeResponse(response,range){
    if(!range||response.status!==200)return response;
    const bytes=await response.arrayBuffer(),size=bytes.byteLength,match=/^bytes=(\d*)-(\d*)$/.exec(range);
    let start=0,end=size-1;
    if(match?.[1]){start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}
    else if(match?.[2])start=Math.max(0,size-Number(match[2]));
    const headers=new Headers(response.headers);headers.delete('Content-Encoding');headers.set('Accept-Ranges','bytes');
    if(!match||!size||start> end||start>=size||(!match[1]&&Number(match[2])===0)){headers.set('Content-Range','bytes */'+size);headers.set('Content-Length','0');return new Response(null,{status:416,headers});}
    headers.set('Content-Range',`bytes ${start}-${end}/${size}`);headers.set('Content-Length',String(end-start+1));
    return new Response(bytes.slice(start,end+1),{status:206,headers});
  }
  function createStore({caches,fetch,scope,maxEntries=120}){
    const pending=new Map();let writes=Promise.resolve();
    async function load(url){
      let cache;try{cache=await caches.open(CACHE);const hit=await cache.match(url);if(hit)return hit;}catch{}
      const response=await fetch(new Request(url,{credentials:'same-origin'}));
      if(cache&&response.status===200&&/^audio\//i.test(response.headers.get('Content-Type')||'')){
        const copy=response.clone();writes=writes.catch(()=>{}).then(async()=>{await cache.put(url,copy);const keys=await cache.keys();for(const key of keys.slice(0,Math.max(0,keys.length-maxEntries)))await cache.delete(key);});
        try{await writes;}catch{} // Full/private storage must not make playback fail.
      }
      return response;
    }
    async function respond(request){
      if(!isAudioRequest(request,scope))return fetch(request);
      const canonical=new URL(request.url);canonical.search='';const key=canonical.href;
      if(!pending.has(key))pending.set(key,load(key).finally(()=>pending.delete(key)));
      const response=(await pending.get(key)).clone();return rangeResponse(response,request.headers.get('Range'));
    }
    return {respond};
  }
  return {CACHE,isAudioRequest,rangeResponse,createStore};
});
