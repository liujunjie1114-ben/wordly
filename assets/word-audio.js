(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else{
  root.WordlyAudio=api.createPool({Audio:root.Audio,onChange:()=>root.dispatchEvent(new Event('wordly-audio-ready'))});
  // The worker handles immutable word MP3s only; HTML and study databases never enter its cache.
  if(root.isSecureContext&&root.navigator?.serviceWorker&&root.document?.currentScript){
    const worker=new URL('../audio-worker.js',root.document.currentScript.src);
    const updateCacheState=()=>{root.WordlyAudio.cacheEnabled=!!root.navigator.serviceWorker.controller;root.dispatchEvent(new Event('wordly-audio-ready'));};
    root.navigator.serviceWorker.addEventListener('controllerchange',updateCacheState);
    root.navigator.serviceWorker.register(worker.href,{scope:new URL('./',worker).pathname,updateViaCache:'none'}).then(updateCacheState).catch(()=>{});
  }
}})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function createPool({Audio:AudioCtor,maxPlayers=12,onChange=()=>{}}={}){
    const players=new Map();
    function get(url){
      if(!url||!AudioCtor)return null;
      if(players.has(url)){const a=players.get(url);players.delete(url);players.set(url,a);if(a.error)a.load?.();return a;}
      while(players.size>=maxPlayers){const idle=[...players].find(([,a])=>a.paused);if(!idle)break;const [key,a]=idle;players.delete(key);a.onended=a.onerror=a.onplaying=a.onwaiting=null;a.pause();a.removeAttribute?.('src');a.load?.();}
      const a=new AudioCtor(url);a.preload='auto';
      a.addEventListener?.('canplaythrough',onChange);a.addEventListener?.('canplay',onChange);
      // Preload errors are handled when the word is played, with device speech as a fallback.
      a.addEventListener?.('error',onChange);players.set(url,a);a.load?.();return a;
    }
    function warm(urls){for(const url of [...new Set(urls.filter(Boolean))].slice(0,4))get(url);}
    function ready(url){return (players.get(url)?.readyState||0)>=3;}
    return {get,warm,ready,cacheEnabled:false,get size(){return players.size;}};
  }
  return {createPool};
});
