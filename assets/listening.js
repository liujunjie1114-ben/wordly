(function () {
  'use strict';
  const {SleepTimer, safeSourceURL, tedEmbedURL} = window.WordlyListeningCore;
  const catalogAddress = new URL('listening-catalog.json', document.currentScript.src);
  catalogAddress.search = new URL(document.currentScript.src).search;
  const catalogURL = catalogAddress.href;
  const feedURL = 'https://podcasts.files.bbci.co.uk/p02pc9tn.rss';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const time = seconds => { const n = Math.max(0,Math.ceil(seconds || 0)); return Math.floor(n/60) + ':' + String(n%60).padStart(2,'0'); };
  let hooks = {}, episodes = [], selected = null, filter = 'all', inSection = false, tedFrame = null;
  let request = 0, playback = 'ready', timerLabel = '未设置', transcriptVisible = false;
  const root = document.createElement('section'); root.className = 'listening-shell'; root.hidden = true;
  root.setAttribute('aria-label','TED 和 BBC 听力播放器');
  root.innerHTML = `<aside class="listen-library"><p class="listen-kicker">LISTEN & EXPLORE</p><h2>选一集，开始听</h2>
    <div class="listen-tabs" role="group" aria-label="节目来源"><button data-listen-filter="all" aria-pressed="true">全部</button><button data-listen-filter="BBC" aria-pressed="false">BBC</button><button data-listen-filter="TED" aria-pressed="false">TED</button></div>
    <input class="listen-search" aria-label="搜索听力节目" placeholder="搜索标题、讲者或话题"><p class="listen-count">正在加载节目…</p><div class="listen-episodes"></div>
    <button class="btn light small" id="listenRefresh" style="margin-top:16px">刷新 BBC 节目</button><p class="listen-note" id="listenFeedStatus"></p></aside>
    <section class="listen-player"><p class="listen-kicker" id="listenProvider">YOUR LISTENING SPACE</p><h2 class="listen-title" id="listenTitle">准备好听见新想法</h2><p class="listen-meta" id="listenMeta">选择 BBC 短节目，或 TED 演讲。</p>
    <div id="listenBBC" hidden><div class="listen-audio-cover"><span class="listen-audio-mark" aria-hidden="true">◖</span><div><b>6 Minute English</b><p>短一点，听懂多一点。先听一遍，再打开英文文稿。</p></div></div><audio id="listenAudio" controls preload="none" aria-label="BBC 播客播放器"></audio>
    <div class="listen-controls"><button class="btn" id="listenPlay">播放</button><label>语速 <select id="listenRate" aria-label="BBC 播放语速"><option value="0.75">0.75×</option><option value="1" selected>1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option></select></label><label><input type="checkbox" id="listenNext">连续播放 BBC</label></div></div>
    <div id="listenTED" hidden><div id="listenTEDSlot"></div><button class="btn" id="listenTEDStart" hidden>重新打开 TED 播放器</button><p class="listen-note">点击播放器开始。若 TED 自动使用中文配音，请在下方 TED Fluent 中选择 English（ORIGINAL），或关闭配音开关。字幕菜单选择 English，可对照英文收听。</p></div>
    <p class="listen-status" id="listenStatus" role="status">正在载入节目列表。</p><div class="listen-actions"><button class="btn light" id="listenTranscriptToggle" aria-expanded="false">显示英文文稿</button><button class="btn light" id="listenStop">停止播放</button><button class="btn light" id="listenNight" aria-pressed="false">夜间显示</button></div>
    <details class="listen-sleep" open><summary>睡眠定时<span class="listen-countdown" id="listenCountdown">未设置</span></summary><div class="listen-presets"><button data-listen-minutes="15">15 分钟</button><button data-listen-minutes="30">30 分钟</button><button data-listen-minutes="60">60 分钟</button><button id="listenTimerCancel">取消定时</button></div>
    <div class="listen-custom"><label for="listenCustomMinutes">自定义</label><input type="number" id="listenCustomMinutes" min="0.1" max="240" step="0.1" value="20" aria-label="自定义停止分钟数"><span>分钟后停止</span><button class="btn light small" id="listenTimerSet">设置定时</button></div><p class="listen-note">倒计时从设置时开始，切换栏目也会保留。锁屏或浏览器休眠可能延迟停止；请保持网页打开。TED 停止后重新打开会从头载入。</p></details>
    <section class="listen-transcript" id="listenTranscript" hidden><h3>英文字幕与文稿</h3><div id="listenTranscriptBody"></div></section><p class="listen-attribution" id="listenAttribution"></p></section>`;
  const dock = document.createElement('aside'); dock.className = 'listen-dock'; dock.hidden = true; dock.setAttribute('aria-label','听力播放控制');
  dock.innerHTML = '<div class="listen-dock-title"><b></b><small></small></div><button id="listenDockOpen">返回听力</button><button id="listenDockStop">停止</button>';
  // Keep the iframe in one DOM position: moving it would reload TED on navigation.
  document.querySelector('.main').append(root); document.body.append(dock);
  const find = selector => root.querySelector(selector), audio = find('#listenAudio');
  const timer = new SleepTimer(reason => stop(reason), {onTick(seconds,active) {
    timerLabel = active ? time(seconds) + ' 后停止' : '未设置';
    find('#listenCountdown').textContent = timerLabel; updateDock();
  }});
  function status(message, error = false) { find('#listenStatus').textContent = message; find('#listenStatus').classList.toggle('is-error',error); }
  function updateDock() {
    dock.hidden = inSection || !selected || !(playback === 'playing' || tedFrame || timer.deadline);
    dock.querySelector('b').textContent = selected?.title || '';
    dock.querySelector('small').textContent = timer.deadline ? timerLabel : selected?.provider === 'TED' ? 'TED 官方播放器已打开' : playback === 'playing' ? 'BBC · 正在播放' : '已暂停';
  }
  function validEpisode(item) {
    if (!item || !['BBC','TED'].includes(item.provider) || typeof item.id !== 'string' || !item.id || typeof item.title !== 'string') return null;
    const source = safeSourceURL(item.source,'page');
    if (!source || (item.provider === 'TED' && !tedEmbedURL(source))) return null;
    const audioURL = item.provider === 'BBC' ? safeSourceURL(item.audio,'audio') : null;
    if (item.provider === 'BBC' && !audioURL) return null;
    return {...item,source,audio:audioURL,transcript:safeSourceURL(item.transcript,'transcript')};
  }
  function list() {
    const query = find('.listen-search').value.trim().toLowerCase();
    const visible = episodes.filter(e => (filter === 'all' || e.provider === filter) && [e.title,e.speaker,e.topic].join(' ').toLowerCase().includes(query));
    find('.listen-count').textContent = visible.length + ' 个节目 · 点选即可开始';
    find('.listen-episodes').innerHTML = visible.length ? visible.map(e => `<button class="listen-episode" data-listen-id="${escape(e.id)}" aria-current="${selected?.id===e.id}" aria-label="收听 ${escape(e.title)}"><span class="listen-source-tag">${e.provider === 'BBC' ? 'BBC · 6 MINUTE ENGLISH' : 'TED · TALK'}</span><b>${escape(e.title)}</b><small>${escape(e.speaker)}${e.duration?' · '+time(e.duration):''}${e.date?' · '+escape(e.date):''}${e.topic?' · '+escape(e.topic):''}</small></button>`).join('') : '<p class="listen-blank">没有匹配的节目，请换个关键词。</p>';
    root.querySelectorAll('[data-listen-filter]').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.listenFilter===filter)));
  }
  function removeTED() { if (tedFrame) { tedFrame.remove(); tedFrame = null; } }
  function stop(reason = 'manual') {
    request++; audio.pause(); removeTED(); playback = 'paused';
    find('#listenPlay').textContent = '播放';
    find('#listenTEDStart').hidden = selected?.provider !== 'TED';
    status(reason === 'sleep' ? '睡眠定时已结束，播放已停止。' : '播放已停止。'); updateDock();
  }
  function mayPlay() {
    timer.check();
    return !hooks.beforePlay || hooks.beforePlay();
  }
  async function playBBC() {
    if (!selected || selected.provider !== 'BBC' || !mayPlay()) return;
    const token = ++request; playback = 'loading'; status('正在连接 BBC 音频…');
    try { await audio.play(); if (token !== request) return; playback = 'playing'; updateDock(); }
    catch (error) { if (token !== request) return; playback = 'paused'; status(error.name === 'NotAllowedError' ? '浏览器需要你再点击一次播放按钮。' : '暂时无法播放这集。请重试，或打开官方节目页面检查当前网络。',true); updateDock(); }
  }
  function openTED() {
    if (!selected || selected.provider !== 'TED' || !mayPlay()) return;
    removeTED(); tedFrame = document.createElement('iframe'); tedFrame.className = 'listen-ted-frame';
    tedFrame.title = 'TED 官方播放器：' + selected.title; tedFrame.src = tedEmbedURL(selected.source);
    tedFrame.allow = 'autoplay; fullscreen; picture-in-picture'; tedFrame.allowFullscreen = true;
    find('#listenTEDSlot').append(tedFrame); find('#listenTEDStart').hidden = true;
    playback = 'ready'; status('TED 播放器已打开。首次收听请确认音轨为 English（ORIGINAL）。'); updateDock();
  }
  function transcript() {
    const body = find('#listenTranscriptBody'); body.replaceChildren();
    find('#listenTranscript').hidden = !transcriptVisible;
    find('#listenTranscriptToggle').setAttribute('aria-expanded',String(transcriptVisible));
    find('#listenTranscriptToggle').textContent = transcriptVisible ? '隐藏英文文稿' : '显示英文文稿';
    if (!transcriptVisible || !selected) return;
    const p = document.createElement('p'); p.className = 'listen-note';
    p.textContent = selected.provider === 'TED' ? '同步英文字幕在上方 TED 播放器中显示。完整文稿可在官方页面的 Read transcript 中查看。' : 'BBC 英文文稿用于对照听力，不是逐句同步字幕。文稿由 BBC 官方提供；若内嵌预览不可用，请打开下方官方文稿。'; body.append(p);
    const link = document.createElement('a'); link.href = selected.transcript || selected.source; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = selected.transcript ? '打开官方英文文稿 ↗' : '打开官方字幕与文稿页面 ↗'; body.append(link);
    if (selected.transcript) { const frame = document.createElement('iframe'); frame.src = selected.transcript + '#toolbar=1'; frame.title = 'BBC 官方英文文稿：'+selected.title; frame.loading = 'lazy'; body.append(frame); }
  }
  function selectEpisode(id, play = true) {
    const next = episodes.find(e=>e.id===id); if (!next) return;
    if (play && !mayPlay()) return;
    stop('manual'); audio.removeAttribute('src'); audio.load(); selected = next; transcriptVisible = false;
    find('#listenProvider').textContent = next.provider === 'BBC' ? 'BBC · 6 MINUTE ENGLISH' : 'TED · IDEAS WORTH LISTENING TO';
    find('#listenTitle').textContent = next.title;
    find('#listenMeta').textContent = [next.speaker,next.duration?time(next.duration):'',next.date||next.topic||''].filter(Boolean).join(' · ');
    find('#listenBBC').hidden = next.provider !== 'BBC'; find('#listenTED').hidden = next.provider !== 'TED';
    find('#listenAttribution').innerHTML = `内容来自 ${next.provider}。<a href="${escape(next.source)}" target="_blank" rel="noopener noreferrer">查看官方节目页面 ↗</a>${next.provider==='BBC'?' · 音频与英文文稿均由 BBC 官方服务器提供。':' · 演讲内容归 TED 所有，使用 TED 官方播放器。'}`;
    if (next.provider === 'BBC') { audio.src = next.audio; audio.playbackRate = Number(find('#listenRate').value); status('已选好这集，点击播放开始收听。'); if(play) playBBC(); }
    else { find('#listenTEDStart').hidden = false; status('点击打开官方播放器，可使用英文字幕。'); if(play) openTED(); }
    transcript(); list(); updateDock();
  }
  function setTimer(minutes) {
    try { timer.arm(minutes); status('睡眠定时已设置，'+minutes+' 分钟后停止播放。'); }
    catch(error) { status(error.message,true); }
  }
  async function refresh() {
    const button = find('#listenRefresh'); button.disabled = true; find('#listenFeedStatus').textContent = '正在读取 BBC 官方订阅源…';
    try {
      const response = await fetch(feedURL,{signal:AbortSignal.timeout(15000)}); if(!response.ok)throw Error('feed');
      const xml = new DOMParser().parseFromString(await response.text(),'text/xml'); if(xml.querySelector('parsererror'))throw Error('xml');
      const updated = Array.from(xml.querySelectorAll('item')).slice(0,30).map(item=>{
        const get = name => item.getElementsByTagName(name)[0]?.textContent || '';
        const source = get('description').match(/https:\/\/www\.bbc\.co\.uk\/learningenglish\/english\/features\/6-minute-english_\d{4}\/ep-\d{6}/)?.[0];
        const id = get('guid').split(':').at(-1), existing = episodes.find(e=>e.id===id);
        const date = new Date(get('pubDate'));
        return validEpisode({id,provider:'BBC',title:get('title'),speaker:'6 Minute English',duration:Number(get('itunes:duration')),date:Number.isNaN(+date)?'':date.toISOString().slice(0,10),source,audio:existing?.audio||item.querySelector('enclosure')?.getAttribute('url'),transcript:existing?.transcript});
      }).filter(Boolean);
      if(!updated.length)throw Error('empty'); episodes = [...updated,...episodes.filter(e=>e.provider==='TED')]; list();
      find('#listenFeedStatus').textContent = '已更新 '+updated.length+' 集 BBC 节目。';
    } catch { find('#listenFeedStatus').textContent = '当前网络无法刷新，已有节目仍可收听。'; }
    finally {button.disabled = false;}
  }
  audio.addEventListener('playing',()=>{playback='playing';find('#listenPlay').textContent='暂停';status('正在播放 · '+selected?.title);updateDock();});
  audio.addEventListener('pause',()=>{if(playback==='playing'){playback='paused';find('#listenPlay').textContent='播放';status('已暂停。');updateDock();}});
  audio.addEventListener('error',()=>{if(selected?.provider==='BBC'&&audio.getAttribute('src')){playback='paused';status('BBC 音频加载失败。请重试，或打开官方节目页面。',true);updateDock();}});
  audio.addEventListener('ended',()=>{
    playback='paused';find('#listenPlay').textContent='播放';
    const expired = timer.deadline && timer.deadline <= Date.now(); timer.check();
    if (expired) return;
    if(find('#listenNext').checked&&selected?.provider==='BBC'){
      const bbc=episodes.filter(e=>e.provider==='BBC'),index=bbc.findIndex(e=>e.id===selected.id);
      if(index>=0&&index+1<bbc.length){selectEpisode(bbc[index+1].id,true);return;}
    }
    status('本集播放完成。');updateDock();
  });
  find('#listenPlay').addEventListener('click',()=>audio.paused?playBBC():audio.pause());
  find('#listenRate').addEventListener('change',e=>{audio.playbackRate=Number(e.target.value);});
  find('#listenStop').addEventListener('click',()=>stop()); dock.querySelector('#listenDockStop').addEventListener('click',()=>stop());
  dock.querySelector('#listenDockOpen').addEventListener('click',()=>hooks.openSection?.());
  find('#listenTEDStart').addEventListener('click',openTED);
  find('#listenTranscriptToggle').addEventListener('click',()=>{transcriptVisible=!transcriptVisible;transcript();});
  find('#listenNight').addEventListener('click',e=>{const night=root.classList.toggle('is-night');e.currentTarget.setAttribute('aria-pressed',String(night));});
  find('#listenTimerSet').addEventListener('click',()=>setTimer(find('#listenCustomMinutes').value));
  find('#listenTimerCancel').addEventListener('click',()=>{timer.cancel();status('睡眠定时已取消，当前播放不受影响。');});
  find('#listenRefresh').addEventListener('click',refresh); find('.listen-search').addEventListener('input',list);
  root.addEventListener('click',e=>{
    const target=e.target.closest('[data-listen-id],[data-listen-filter],[data-listen-minutes]');if(!target)return;
    if(target.dataset.listenId)selectEpisode(target.dataset.listenId);
    else if(target.dataset.listenFilter){filter=target.dataset.listenFilter;list();}
    else setTimer(target.dataset.listenMinutes);
  });
  document.addEventListener('visibilitychange',()=>timer.check()); window.addEventListener('pageshow',()=>timer.check());
  window.WordlyListening = {
    configure(options){hooks=options;},
    beforeRender(page){inSection=page==='listening';root.hidden=!inSection;updateDock();},
    mount(){root.hidden=false;inSection=true;updateDock();},
    pause(){if(playback==='playing'||tedFrame)stop('manual');},
    stop
  };
  fetch(catalogURL,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('catalog');return r.json();}).then(data=>{
    episodes=(data.episodes||[]).map(validEpisode).filter(Boolean);if(!episodes.length)throw Error('empty');
    list();selectEpisode(episodes[0].id,false);find('#listenFeedStatus').textContent='BBC 官方节目 · 可随时刷新。';
  }).catch(()=>{find('.listen-count').textContent='节目列表暂时加载失败。';status('请刷新网页重试。',true);});
})();
