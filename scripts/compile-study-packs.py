"""Compile explicitly reviewed local packs. No network, source edits or OCR candidates."""
import argparse
import copy
import hashlib
import json
import re
import tempfile
import unicodedata
from collections import Counter
from pathlib import Path

SUBJECTS = {'listening', 'reading', 'writing', 'speaking', 'grammar'}
LIMIT = 4 * 1024 * 1024

def norm(value):
    return ' '.join(unicodedata.normalize('NFKC', str(value)).casefold().split())

def fingerprint(entry):
    if entry.get('kind') == 'vocabulary':
        return ('vocabulary', norm(entry.get('en')), norm(entry.get('pos', '')), norm(entry.get('zh')))
    return ('knowledge', norm(entry['title']), norm(entry.get('explanation', '')))

def validate(pack):
    if pack.get('schema') != 'wordly-study-pack' or pack.get('version') != 1:
        raise ValueError('Input is not a reviewed study pack')
    entries = pack.get('entries')
    if not isinstance(entries, list) or not 0 < len(entries) <= 1000:
        raise ValueError('Invalid input entry count')
    seen = set()
    for entry in entries:
        identifier = entry.get('id', '')
        if not re.fullmatch(r'[\w-]{1,100}', identifier, flags=re.ASCII) or identifier in seen or identifier in {'__proto__','constructor','prototype'}:
            raise ValueError('Invalid or repeated ID')
        seen.add(identifier)
        if not entry.get('title') or not set(entry.get('categories', [])) & SUBJECTS:
            raise ValueError('Missing title or subject')
        if entry.get('kind', 'knowledge') not in {'knowledge','vocabulary'} or entry.get('status', 'ready') not in {'ready','needs-check'}:
            raise ValueError('Invalid kind or review status')
        if entry.get('kind') == 'vocabulary' and not (entry.get('en') and entry.get('zh')):
            raise ValueError('Vocabulary needs English and core meaning')
        if not entry.get('sources') or any(not s.get('path') or not s.get('locator') for s in entry['sources']):
            raise ValueError('Missing source locator')

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--manifest', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    manifest_path = Path(args.manifest).resolve()
    manifest = json.loads(manifest_path.read_text(encoding='utf-8-sig'))
    base = manifest_path.parent
    out = Path(args.output).resolve()
    if out.exists():
        raise ValueError('Output already exists; choose a new checkpoint directory')
    incoming, input_info, ids = [], [], {}
    for name in manifest['packs']:
        file = (base / name).resolve()
        if not file.is_relative_to(base):
            raise ValueError('Pack escapes manifest directory')
        raw = file.read_bytes()
        if len(raw) > 5 * 1024 * 1024:
            raise ValueError('Input pack exceeds 5 MB')
        pack = json.loads(raw.decode('utf-8-sig'))
        validate(pack)
        input_info.append({'path':name,'sha256':hashlib.sha256(raw).hexdigest(),'entries':len(pack['entries'])})
        for entry in pack['entries']:
            old = ids.get(entry['id'])
            if old and fingerprint(old) != fingerprint(entry):
                raise ValueError('Conflicting entry ID: ' + entry['id'])
            ids[entry['id']] = entry
            incoming.append(copy.deepcopy(entry))
    aliases = manifest.get('aliases', {})
    for old, new in aliases.items():
        if old not in ids or new not in ids or new in aliases or ids[old].get('kind') != ids[new].get('kind'):
            raise ValueError('Invalid or chained manual alias')
    unique, by_key, by_id, duplicates = [], {}, {}, []
    # Alias destinations must exist before their alternative phrasing is processed.
    incoming.sort(key=lambda e: e['id'] in aliases)
    for entry in incoming:
        destination = aliases.get(entry['id'], entry['id'])
        found = by_id.get(destination) or by_key.get(fingerprint(entry))
        if found:
            combined = {(s['path'],s['locator']):s for s in found['sources'] + entry['sources']}
            if len(combined) > 100:
                # Preserve the additional source card rather than silently truncate provenance.
                if entry['id'] in by_id:
                    raise ValueError('Over 100 sources for a repeated ID; split the input source card')
                found = None
            else:
                found['sources'] = list(combined.values())
                found['categories'] = list(dict.fromkeys(found['categories'] + entry['categories']))
                found['tags'] = list(dict.fromkeys(found.get('tags',[]) + entry.get('tags',[])))
                if entry.get('status') == 'needs-check':
                    found['status'] = 'needs-check'
                for field in ('original','correction'):
                    value = entry.get(field, '')
                    if value and value not in found.get(field, ''):
                        found[field] = (found.get(field,'') + '\n' + value).strip()
                duplicates.append({'from':entry['id'],'to':found['id'],'manual':entry['id'] in aliases})
                by_id[entry['id']] = found
        if found is None:
            unique.append(entry)
            by_id[entry['id']] = entry
            by_key[fingerprint(entry)] = entry
    # The browser importer otherwise defaults knowledge identity to its title.
    # Stable explicit identities preserve distinct explanations and source-overflow cards.
    segments = Counter()
    for entry in unique:
        key = fingerprint(entry)
        digest = hashlib.sha256(json.dumps(key,ensure_ascii=False).encode('utf-8')).hexdigest()[:32]
        entry['identity'] = 'reviewed-' + digest + '-' + str(segments[key])
        segments[key] += 1
    actual_sources = {s['path'] for e in unique for s in e['sources']}
    missing = [p for p in manifest.get('expectedOriginals',[]) if p not in actual_sources]
    counts = Counter(e.get('kind','knowledge') + '/' + e.get('status','ready') for e in unique)
    packs, batch, size = [], [], 0
    for entry in unique:
        length = len(json.dumps(entry,ensure_ascii=False).encode('utf-8'))
        if length > LIMIT:
            raise ValueError('One card exceeds export capacity')
        if batch and (len(batch) >= 900 or size + length > LIMIT):
            packs.append(batch)
            batch, size = [], 0
        batch.append(entry)
        size += length
    if batch:
        packs.append(batch)
    out.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='wordly-compile-',dir=out.parent) as temporary:
        work = Path(temporary)
        files = []
        for index, entries in enumerate(packs,1):
            filename = f'pack-{index:03}.json'
            payload = {'schema':'wordly-study-pack','version':1,
                       'batch':{'id':f'ielts-reviewed-{hashlib.sha256(json.dumps(input_info,sort_keys=True).encode()).hexdigest()[:12]}-{index}',
                                'title':f'雅思系统资料 · 第{index}批','scope':'已审校资料与明确待核对项；原始覆盖边界见私人汇总报告。'},
                       'entries':entries}
            raw = json.dumps(payload,ensure_ascii=False,separators=(',',':')).encode('utf-8')
            if len(raw) > 5 * 1024 * 1024:
                raise ValueError('Output batch exceeds capacity')
            (work / filename).write_bytes(raw)
            files.append({'file':filename,'entries':len(entries),'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()})
        def write(name,value):
            (work/name).write_text(json.dumps(value,ensure_ascii=False,indent=2),encoding='utf-8')
        write('manifest.json',{'schema':'wordly-study-pack-manifest','version':1,'packs':files,'total':len(unique),'counts':dict(counts),'inputs':input_info,'duplicates':duplicates})
        write('coverage.json',{'sources':sorted(actual_sources),'expectedWithoutCard':missing,'note':'来源存在不等于整份原件已视觉或音频核验；审读范围以各批coverage/review-ledger为准。'})
        report = f'# 私人资料汇总\n\n{len(incoming)}条输入 → {len(unique)}条独立卡；合并{len(duplicates)}项精确/人工确认重复。\n\n'
        report += '\n'.join(f'- {key}: {value}' for key,value in sorted(counts.items()))
        report += f'\n\n{len(files)}个可单独导入的包。{len(missing)}个清单原路径没有对应卡，需结合各批审读/排除原因核对；不能据此声称全量吸收完成。\n'
        (work/'report.md').write_text(report,encoding='utf-8')
        work.rename(out)
    print(json.dumps({'entries':len(unique),'packs':len(files),'counts':dict(counts),'missingSourceCards':len(missing)},ensure_ascii=False))

if __name__ == '__main__':
    main()
