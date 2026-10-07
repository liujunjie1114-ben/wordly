const { test } = require('node:test');
const assert = require('node:assert/strict');
const { SleepTimer, safeSourceURL, tedEmbedURL } = require('../assets/listening-core.js');

function clock() {
  let now = 1000, id = 0;
  const jobs = new Map(), stopped = [];
  const timer = new SleepTimer(reason => stopped.push(reason), {
    now: () => now,
    schedule: (fn, ms) => { jobs.set(++id, {fn, at: now + ms}); return id; },
    unschedule: key => jobs.delete(key)
  });
  return {timer, stopped, jobs, advance(ms) {
    now += ms;
    for (const [key, job] of [...jobs]) if (job.at <= now) { jobs.delete(key); job.fn(); }
  }};
}

test('sleep deadline stops once, including a suspended browser returning late', () => {
  const c = clock(); c.timer.arm(15); c.advance(899000);
  assert.equal(c.stopped.length, 0);
  c.advance(61000);
  assert.deepEqual(c.stopped, ['sleep']);
  c.timer.check(); assert.equal(c.stopped.length, 1); assert.equal(c.jobs.size, 0);
});
test('cancel and rearm do not leave a previous deadline running', () => {
  const c = clock(); c.timer.arm(1); c.timer.cancel(); c.advance(61000);
  assert.equal(c.stopped.length, 0);
  c.timer.arm(1); c.timer.arm(2); c.advance(60000);
  assert.equal(c.stopped.length, 0); c.advance(60000); assert.equal(c.stopped.length, 1);
});
test('invalid durations leave the existing timer intact', () => {
  const c = clock(); c.timer.arm(1);
  for (const n of [0, -1, NaN, Infinity, 241, '']) assert.throws(() => c.timer.arm(n));
  c.advance(60000); assert.equal(c.stopped.length, 1);
});
test('short custom timer has an exact deadline', () => {
  const c = clock(); c.timer.arm(0.1); c.advance(5999);
  assert.equal(c.stopped.length, 0); c.advance(1); c.timer.check();
  assert.deepEqual(c.stopped, ['sleep']);
});
test('browser timer functions are called without the SleepTimer as receiver', () => {
  const fs = require('node:fs'), vm = require('node:vm');
  const browser = {};
  const script = fs.readFileSync(require.resolve('../assets/listening-core.js'), 'utf8');
  vm.runInNewContext(script, {window:browser, Date, URL,
    setTimeout:function () {'use strict'; assert.equal(this,undefined);return 1;},
    clearTimeout:function () {'use strict'; assert.equal(this,undefined);}
  });
  const timer = new browser.WordlyListeningCore.SleepTimer(()=>{});
  timer.arm(1); timer.cancel();
});
test('only the official HTTPS media and document hosts are accepted', () => {
  assert.equal(safeSourceURL('http://open.live.bbc.co.uk/mediaselector/proto/http/vpid/example.mp3', 'audio'), 'https://open.live.bbc.co.uk/mediaselector/proto/https/vpid/example.mp3');
  for (const url of ['javascript:alert(1)', 'https://evil.example/x.mp3', 'https://user:pass@downloads.bbc.co.uk/x.mp3', 'https://downloads.bbc.co.uk.evil.example/x.mp3']) assert.equal(safeSourceURL(url, 'audio'), null);
  assert.equal(safeSourceURL('https://downloads.bbc.co.uk/example.pdf', 'transcript'), 'https://downloads.bbc.co.uk/example.pdf');
});
test('TED official player receives English audio and subtitle preferences', () => {
  assert.equal(tedEmbedURL('https://www.ted.com/talks/julian_treasure_how_to_speak_so_that_people_want_to_listen'), 'https://embed.ted.com/embed/julian_treasure_how_to_speak_so_that_people_want_to_listen?language=en&audio=en&subtitle=en');
  assert.equal(tedEmbedURL('https://evil.example/talks/x'), null);
});
