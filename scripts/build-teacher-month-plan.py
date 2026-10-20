"""Map the supplied October 2026 class timetable to existing private-library IDs.

Run locally with the reviewed packs and original workbook present. Publishes only
dates, scopes and stable IDs; never publishes vocabulary or learner records.
"""
import json
import re
from collections import defaultdict
from datetime import date, timedelta
from pathlib import Path
import openpyxl

ROOT = Path(__file__).resolve().parents[1]
PACKS = ROOT / 'private-study/deliverable-v1-20261009'
manifest = json.loads((PACKS / 'manifest.json').read_text('utf-8'))
entries = [e for pack in manifest['packs'] for e in json.loads((PACKS / pack['file']).read_text('utf-8'))['entries']]
lookup = defaultdict(dict)
pages = defaultdict(dict)
for e in entries:
    for s in e.get('sources', []):
        lookup[(s['path'], s['locator'])][e['id']] = e
        chapter = re.search(r'chapter (3|4|5|8|11)[^!]*\.zip', s['path'])
        item = re.fullmatch(r'page (\d+), visual list item (\d+)', s['locator'])
        if chapter and item:
            pages[(int(chapter[1]), int(item[1]))][int(item[2])] = e

def find(part, locator, expected=None):
    found = {e['id']: e for (path, loc), es in lookup.items() if part in path and loc == locator for e in es.values() if expected is None or e.get('en', '').strip().casefold() == expected.strip().casefold()}
    preferred = [e for e in found.values() if e['id'].startswith('voc-')]
    if len(preferred) == 1:
        return preferred[0]
    assert len(found) == 1, (part, locator, expected, list(found))
    return next(iter(found.values()))

book = openpyxl.load_workbook('D:/英语/chapter/雅思阅读同替表（新版）.xlsx', read_only=True, data_only=True)
numbered = {}
for sheet in list(book)[:8]:
    for rownum, row in enumerate(sheet.iter_rows(values_only=True), 1):
        for col in range(0, len(row)-2, 3):
            n = row[col]
            if isinstance(n, (int, float)) and n == int(n):
                numbered[int(n)] = (sheet.title, rownum, col+1, str(row[col+1]).strip())

def reading(n):
    if n not in numbered:
        unit = numbered.get(n-1, numbered.get(n+1, ('阅读同替',)))[0]
        return {'key': f'r-{n}', 'entryId': f'missing-reading-{n}', 'label': f'{unit} · 第{n}词', 'optional': True, 'note': '原表该编号或英文缺失，待核对，不计分。'}
    sheet, row, col, word = numbered[n]
    if not re.search('[A-Za-z]', word):
        return {'key': f'r-{n}', 'entryId': f'missing-reading-{n}', 'label': f'{sheet} · 第{n}词', 'optional': True, 'note': '原表该项是标点或缺英文，不作为单词计分。'}
    e = find('雅思阅读同替表', f'sheet {sheet}, row {row}, cols {col}-{col+2}')
    return {'key': f'r-{n}', 'entryId': e['id'], 'label': f'{sheet} · 第{n}词'}

# Topic -> first strong page, first sprint page. Each page contains ten rows.
topics = {'环境': (3,5), '犯罪': (8,10), '文化': (13,15), '政府': (18,20), '科技': (23,25), '教育': (28,None), '资源': (33,None), '全球化': (None,36), '社会': (39,41), '媒体': (46,48), '发展': (None,51)}
def writing(topic, stage, n):
    first = topics[topic][0 if stage == '强化' else 1]
    page, row = first+(n-1)//10, n
    if topic == '教育' and n >= 31:
        page, row = 31, n-20
    e = find('周周练-写作话题词', f'PDF physical page {page}, table 1, numbered row {row}')
    item = {'key': f'w-plan-{page}-{n}', 'entryId': e['id'], 'label': f'{topic}{stage} · 第{n}词'}
    if e['status'] != 'ready':
        item.update(optional=True, note='原写作资料此项待核对，保留原编号，不计分。')
    return item

def listening(chapter, lo, hi, label):
    result = []
    for page in range(lo,hi+1):
        rows = pages[(chapter,page)]
        assert rows, (chapter,page)
        count=len(rows)
        assert set(rows)==set(range(1,count+1)), (chapter,page,count)
        columns = 3 if chapter==5 and page<39 else 2 if chapter==8 else 1 if chapter==11 else 4
        lengths=[(count+columns-1-col)//columns for col in range(columns)]
        starts=[1+sum(lengths[:col]) for col in range(columns)]
        order=[starts[col]+row for row in range(max(lengths)) for col in range(columns) if row<lengths[col]]
        for position in order:
            e=rows[position]
            item = {'key': f'l-ch{chapter}-{page}-{position}', 'entryId': e['id'], 'label': f'{label} · PDF第{page}页 · 原词项{position}'}
            if e['status'] != 'ready':
                item.update(optional=True, note='原资料此项待核对，不计入检测成绩。')
            result.append(item)
    return result

def wr(topic,stage,lo,hi): return (topic,stage,lo,hi)
# Date, first reading number, writing ranges, listening chapter/page ranges.
schedule = [
 ('10-15',101,[wr('环境','冲刺',11,20),wr('犯罪','强化',1,5)],[(3,14,20,'Chapter 3名词 Test 5–6')]),
 ('10-20',251,[wr('犯罪','冲刺',16,20),wr('文化','强化',1,5)],[(4,4,10,'Chapter 4形容词副词 Test 2–3')]),
 ('10-21',301,[wr('文化','强化',6,20)],[(4,11,11,'Chapter 4副词 Test 4'),(5,1,3,'Chapter 5词组 Test 1')]),
 ('10-22',351,[wr('文化','冲刺',1,15)],[(5,4,9,'Chapter 5词组 Test 2–3')]),
 ('10-23',401,[wr('文化','冲刺',16,20),wr('政府','强化',1,10)],[(5,10,15,'Chapter 5词组 Test 4–5')]),
 ('10-26',451,[wr('政府','强化',11,15),wr('政府','冲刺',1,10)],[(5,16,22,'Chapter 5词组 Test 6–7')]),
 ('10-27',501,[wr('政府','冲刺',11,20),wr('科技','强化',1,5)],[(5,23,30,'Chapter 5词组 Test 8–9')]),
 ('10-28',551,[wr('科技','强化',6,20)],[(5,31,38,'Chapter 5词组 Test 10–11')]),
 ('10-29',601,[wr('科技','冲刺',1,15)],[(5,39,43,'Chapter 5词组 Test 12'),'Chapter 6复数 Test 1']),
 ('10-30',651,[wr('科技','冲刺',16,20),wr('教育','强化',1,10)],['Chapter 6复数 Test 2–3']),
 ('11-02',701,[wr('教育','强化',11,25)],['Chapter 6复数 Test 4–5']),
 ('11-03',751,[wr('教育','强化',26,40)],['Chapter 6复数 Test 6–7']),
 ('11-04',801,[wr('资源','强化',1,15)],['Chapter 6复数 Test 8–9']),
 ('11-05',851,[wr('资源','强化',16,20),wr('全球化','冲刺',1,10)],['Chapter 6复数 Test 10','专项1：数字']),
 ('11-06',901,[wr('全球化','冲刺',11,20),wr('社会','强化',1,5)],['专项1：数字']),
 ('11-09',951,[wr('社会','强化',6,20)],['专项2：字母和数字']),
 ('11-10',1001,[wr('社会','冲刺',1,15)],['专项2：字母和数字']),
 ('11-11',1051,[wr('社会','冲刺',16,30)],['专项3：钱数']),
 ('11-12',1101,[wr('社会','冲刺',31,40),wr('媒体','强化',1,5)],['专项3：钱数']),
 ('11-13',1151,[wr('媒体','强化',6,20)],['专项4：地址']),
 ('11-16',1201,[wr('媒体','冲刺',1,20)],['专项4：地址']),
 ('11-17',1251,[wr('发展','冲刺',1,19)],['专项5：日期']),
 ('11-18',1301,[],['专项5：日期']),
 ('11-19',1351,[],['专项6：专业']),
 ('11-20',1401,[],[(11,1,23,'Chapter 11难词 Section 1–4')]),
]

knowledge = {}
for e in entries:
    if e.get('kind') == 'knowledge' and any('chapter 8' in s['path'] for s in e.get('sources',[])):
        for name, fragment in [('数字','号码分组'),('字母和数字','字母数字串'),('钱数','现金用'),('地址','地址把'),('日期','月份与'),('专业','专业')]:
            if fragment in e['title']: knowledge[name] = e['id']

file = ROOT/'assets/teacher-word-tasks.js'
source = file.read_text('utf-8')
old = json.loads(re.search(r'window.WordlyTeacherTasks=(\[.*?\]);',source).group(1))
# Existing IDs/items are deliberately retained, including answers keyed to old IDs.
old = [t for t in old if not t.get('scheduleVersion')]
for task in old:
    task.pop('displayDays',None)
    task.setdefault('track','oct26-plan')
tasks = list(old)
for short,start,ranges,listen in schedule:
    day = '2026-'+short
    assert not any(t['day']==day for t in tasks), day
    items = [reading(n) for n in range(start,start+50)]
    unit_labels = list(dict.fromkeys(i['label'].split(' · ')[0] for i in items))
    tasks.append({'id':f'teacher-{day}-reading','day':day,'subject':'reading','title':f'阅读同替 · {"、".join(unit_labels)}第{start}–{start+49}词','mode':'meaning','items':items,'note':'按老师安排表及原Excel编号；英文→中文回忆，自评核心义。','track':'oct26-plan','scheduleVersion':1})
    if ranges:
        items = [writing(t,s,n) for t,s,lo,hi in ranges for n in range(lo,hi+1)]
        note = '中文→英文默写；并列表达可自评，首次答案和复测历史保留。'
        if any(t=='教育' and hi>=31 for t,s,lo,hi in ranges): note += '教育强化31–40词按第31页顺序对应，原页误重复标为11–20。'
        tasks.append({'id':f'teacher-{day}-writing','day':day,'subject':'writing','title':'写作 · '+'、'.join(f'{t}{s}第{lo}–{hi}词' for t,s,lo,hi in ranges),'mode':'spelling','items':items,'note':note,'track':'oct26-plan','scheduleVersion':1})
    items,labels,resource_ids,pending = [],[],[],False
    for scope in listen:
        if isinstance(scope,tuple):
            ch,lo,hi,label = scope
            labels.append(label);items.extend(listening(ch,lo,hi,label))
        elif scope.startswith('专项'):
            name=scope.split('：')[1];labels.append('Chapter 8生存 · '+scope)
            if name == '专业': items.extend(listening(8,21,22,'Chapter 8 · 专业'))
            if name in knowledge: resource_ids.append(knowledge[name])
        else:
            labels.append(scope);pending=True
    note = '按老师安排范围和原表横向行列顺序练习；逐词发音用于词汇检测，老师原声横向测试需选择本机音频。'
    if pending: note += 'Chapter 6原压缩包只有未下载完成的音频，没有可用词表，待补资料；本卡不代表该范围已完成。'
    if resource_ids: note += '数字、字符、钱数、地址、日期按专项讲解结合教材原声练习，不用普通单词拼写成绩冒充专项过关。'
    if pending and items: items.append({'key':'pending-chapter6','entryId':'missing-chapter6-source','label':'Chapter 6原词表待补齐','note':'暂无可用原词表，不能计为整批完成。'})
    tasks.append({'id':f'teacher-{day}-listening','day':day,'subject':'listening','title':'听力 · '+'、'.join(labels),'mode':'audio','items':items,'note':note,'track':'oct26-plan','scheduleVersion':1,'pendingSource':pending,'libraryIds':resource_ids})

tasks.sort(key=lambda t:t['day'])
plan,review = [],{}
current=date(2026,10,12)
while current<=date(2026,11,22):
    day=current.isoformat();weekday=current.weekday()
    kind='intro' if day=='2026-10-12' else 'review' if weekday==5 or day=='2026-11-01' else 'dictation' if weekday==6 else 'study'
    title={'intro':'查收／熟悉单词','study':'按计划学习','review':'复习单词','dictation':'听写单词'}[kind]
    plan.append({'day':day,'kind':kind,'title':title})
    if weekday>=5:
        monday=current-timedelta(days=weekday)
        review[day]=sorted({t['day'] for t in tasks if monday.isoformat()<=t['day']<=(monday+timedelta(days=4)).isoformat()})
    current+=timedelta(days=1)
file.write_text('// Teacher scopes and stable references only. Private vocabulary and learner results stay local.\nwindow.WordlyTeacherTasks='+json.dumps(tasks,ensure_ascii=False,separators=(',',':'))+';\nwindow.WordlyTeacherReviewDays='+json.dumps(review,ensure_ascii=False,separators=(',',':'))+';\nwindow.WordlyTeacherPlan='+json.dumps(plan,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8',newline='\n')
print(json.dumps({'days':len(plan),'tasks':len(tasks),'scheduledPracticeItems':sum(len(t['items']) for t in tasks),'resourceDays':[t['day'] for t in tasks if not t['items']],'pendingChapter6':[t['day'] for t in tasks if t.get('pendingSource')]},ensure_ascii=False))
