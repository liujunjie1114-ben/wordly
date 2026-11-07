
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const supplementPath = 'assets/speaking-bank-supplement-2026-sep-dec.js';
const data = fs.readFileSync(path.join(root, supplementPath), 'utf8');
const audit = JSON.parse(fs.readFileSync(path.join(root, 'docs/speaking-bank-2026-sep-dec-coverage.json'), 'utf8'));

function loadBank() {
  const start = html.indexOf('const SPEAKING_BANK=');
  const end = html.indexOf('\nconst KEY=', start);
  const scriptTag = html.indexOf(supplementPath);
  assert.ok(start >= 0 && end > start, 'Speaking bank initialisation must exist');
  assert.ok(scriptTag >= 0 && scriptTag < start, 'The supplement must load before bank initialisation');
  const initialisation = html.slice(start, end);
  const context = vm.createContext({ window: {} });
  vm.runInContext(data, context, { filename: supplementPath });
  return vm.runInContext(initialisation + '\nSPEAKING_BANK', context);
}

test('each audited 2026 September–December topic resolves to a usable Wordly card', () => {
  const bank = loadBank();
  for (const part of ['part1', 'part2']) {
    const cards = new Map(bank[part].map(card => [card.id, card]));
    assert.equal(cards.size, bank[part].length, 'Cards must have unique stable IDs');
    for (const [catalogue, pairs] of Object.entries(audit.parts[part])) {
      for (const [sourceKey, wordlyId] of pairs) {
        assert.ok(cards.has(wordlyId), catalogue + '/' + sourceKey + ' has no Wordly card');
      }
    }
    for (const card of cards.values()) {
      assert.ok(card.title && card.titleZh);
      if (card.origin) {
        assert.ok(card.id.startsWith(part === 'part1' ? 'mb26-p1-' : 'mb26-p2-'));
        assert.ok(card.origin === 'classroom' || card.sourceRefs.length > 0);
        assert.ok(card.sourceRefs.every(ref => new URL(ref.url).protocol === 'https:'));
        if (part === 'part1') assert.ok(card.questions.length >= 3);
        else assert.ok(card.prompts.length >= 4 && card.part3.length >= 3);
      }
    }
  }
});

test('the new-law card and distinct variants remain separately selectable', () => {
  const { part2 } = loadBank();
  const ids = (...titles) => titles.map(title => {
    const card = part2.find(item => item.titleZh === title);
    assert.ok(card, title + ' must be present');
    return card.id;
  });
  assert.equal(new Set(ids('想引入的新法律', '现有的一条环保法律', '想引入的一条环保法律')).size, 3);
  assert.equal(new Set(ids('看过的名人采访', '采访名人的经历')).size, 2);
  assert.equal(new Set(ids('收到消息后很久才回复', '发消息后迟迟没收到回复')).size, 2);
});
