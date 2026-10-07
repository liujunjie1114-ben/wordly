(function (root) {
  'use strict';
  const hosts = {
    audio: ['downloads.bbc.co.uk', 'open.live.bbc.co.uk'],
    transcript: ['downloads.bbc.co.uk'],
    page: ['www.bbc.co.uk', 'bbc.co.uk', 'feeds.bbci.co.uk', 'www.ted.com', 'ted.com']
  };
  function safeSourceURL(value, kind) {
    try {
      const url = new URL(value);
      if (!(hosts[kind] || []).includes(url.hostname) || url.username || url.password || url.port) return null;
      if (url.protocol === 'http:' && url.hostname.endsWith('bbc.co.uk')) {
        url.protocol = 'https:';
        url.pathname = url.pathname.replace('/proto/http/', '/proto/https/');
      }
      return url.protocol === 'https:' ? url.href : null;
    } catch { return null; }
  }
  function tedEmbedURL(source) {
    const valid = safeSourceURL(source, 'page');
    if (!valid) return null;
    const url = new URL(valid);
    if (!['www.ted.com', 'ted.com'].includes(url.hostname)) return null;
    const match = url.pathname.match(/^\/talks\/([a-z0-9_]+)\/?$/);
    return match ? 'https://embed.ted.com/embed/' + match[1] + '?language=en&audio=en&subtitle=en' : null;
  }
  class SleepTimer {
    constructor(stop, {now = Date.now, schedule = (fn, ms) => setTimeout(fn, ms), unschedule = handle => clearTimeout(handle), onTick = () => {}} = {}) {
      this.stop = stop; this.now = now; this.schedule = schedule; this.unschedule = unschedule;
      this.onTick = onTick; this.deadline = 0; this.handle = null;
    }
    arm(minutes) {
      const value = Number(minutes);
      if (!Number.isFinite(value) || value < 0.1 || value > 240) throw new Error('请输入 0.1 至 240 分钟。');
      this.cancel(); this.deadline = this.now() + value * 60000; this.check();
    }
    cancel() {
      if (this.handle !== null) this.unschedule(this.handle);
      this.handle = null; this.deadline = 0; this.onTick(0, false);
    }
    check() {
      if (this.handle !== null) this.unschedule(this.handle);
      this.handle = null;
      if (!this.deadline) return;
      const remaining = this.deadline - this.now();
      if (remaining <= 0) { this.cancel(); this.stop('sleep'); return; }
      this.onTick(Math.ceil(remaining / 1000), true);
      this.handle = this.schedule(() => this.check(), Math.min(1000, remaining));
    }
  }
  const api = {SleepTimer, safeSourceURL, tedEmbedURL};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.WordlyListeningCore = api;
})(typeof window === 'undefined' ? this : window);
