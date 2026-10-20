"""Compile visually reviewed local Chapter 6 pages; publish stable IDs only."""
from pathlib import Path
import hashlib
import json
import re
import shutil
import sys
import zipfile

root=Path(__file__).resolve().parents[1]
folder=root/'private-study/chapter6-20261020'
originals=folder/'originals';originals.mkdir(exist_ok=True)
if len(sys.argv)!=2:raise SystemExit('Usage: python scripts/build-chapter6-supplement.py <original-zip>')
source=Path(sys.argv[1])
with zipfile.ZipFile(source) as archive:
    for info in archive.infolist():
        if info.is_dir():continue
        assert info.file_size<20*1024*1024
        target=originals/Path(info.filename).name
        if not target.exists():
            with archive.open(info) as src,target.open('wb') as dst:shutil.copyfileobj(src,dst)
        assert target.stat().st_size==info.file_size
pdf=originals/'chapter 6文档.pdf'
digest=hashlib.sha256(pdf.read_bytes()).hexdigest()
pages=[page for part in sorted(folder.glob('pages-*.json')) for page in json.loads(part.read_text('utf-8'))['pages']]
assert [p['page'] for p in pages]==list(range(1,32))
entries=[]
tests=[{'test':n,'fileName':f'{n:02d} Cambridge {n}-横向测试.mp3','items':[]} for n in range(1,11)]
for page in pages:
    test=int(re.search(r'Cambridge\s+(\d+)',page['heading'])[1])
    positions=set()
    assert [(i['row'],i['col']) for i in page['items']]==sorted((i['row'],i['col']) for i in page['items'])
    for i in page['items']:
        row,col=i['row'],i['col'];assert (row,col) not in positions;positions.add((row,col))
        identifier=f'teacher-ch6-p{page["page"]:02d}-r{row}-c{col}'
        note=i.get('note','')
        entry={'id':identifier,'identity':identifier,'title':i['en']+' · '+i['zh'],'kind':'vocabulary','categories':['listening'],'status':i['status'],'en':i['en'],'zh':i['zh'],'pos':'Chapter 6 原表词项','summary':'复数听写 · '+page['heading'],'explanation':'按原PDF横向行列顺序视觉核对；释义为核心义归纳。'+note,'practice':'先看词表，再结合对应Cambridge原声逐项默写；保留原词头。','pitfalls':'注意词尾、拼写和原表语境。'+note,'correction':note,'tags':['Chapter 6','复数听写',page['heading']],'sources':[{'path':str(pdf),'hash':digest,'locator':f'PDF page {page["page"]}, row {row}, column {col}, {page["heading"]}','role':'original'}]}
        entries.append(entry)
        item={'key':f'l-ch6-{page["page"]}-{row}-{col}','entryId':identifier,'label':f'Chapter 6 · Test {test} · PDF第{page["page"]}页 第{row}行第{col}列'}
        if i['status']!='ready':item.update(optional=True,note='原PDF此项词形或释义待核对，详见本机资料卡，不计分。')
        tests[test-1]['items'].append(item)
assert len(entries)==1042 and len({e['id'] for e in entries})==1042
assert sum(e['status']=='needs-check' for e in entries)==21
for n,start in enumerate(range(0,len(entries),600),1):
    pack={'schema':'wordly-study-pack','version':1,'batch':{'id':f'chapter6-reviewed-20261020-{n}','title':f'Chapter 6 复数 · 已核对词表 {n}/2','scope':'Cambridge 1–10；来源为用户提供的31页原PDF，按横向顺序保留重复词项；疑点暂不进入计分。'},'entries':entries[start:start+600]}
    (folder/f'chapter6-pack-{n}.json').write_text(json.dumps(pack,ensure_ascii=False,separators=(',',':')),encoding='utf-8',newline='\n')
public={'version':1,'sourceHash':digest,'tests':tests}
(root/'assets/teacher-chapter6-task-items.json').write_text(json.dumps(public,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8',newline='\n')
(folder/'report.json').write_text(json.dumps({'pages':31,'items':len(entries),'ready':sum(e['status']=='ready' for e in entries),'pending':21,'tests':[{k:v for k,v in t.items() if k!='items'}|{'count':len(t['items'])} for t in tests]},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'items':len(entries),'ready':1021,'pending':21,'testCounts':[len(t['items']) for t in tests],'privatePacks':2},ensure_ascii=False))
