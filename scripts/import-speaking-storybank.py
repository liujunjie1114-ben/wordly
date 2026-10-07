"""Import the supplied 28-page PDF without touching browser learning data.

Usage: python scripts/import-speaking-storybank.py PATH_TO_PDF
Requires pypdf and pdfplumber. The checked-in JSON retains every source page.
"""
from pathlib import Path
from html import escape
import hashlib
import json
import re
import shutil
import sys
from pypdf import PdfReader
import pdfplumber

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / 'assets'
SOURCE = Path(sys.argv[1])
PDF_NAME = 'speaking-storybank-2026-10-07.pdf'
pages = [p.extract_text() for p in PdfReader(SOURCE).pages]
assert len(pages) == 28, 'This importer expects the reviewed 28-page source.'
header = 'IELTS SPEAKING · ALL PRACTISED STORY BANK · 2026-10-07\nWordly / Codex integration source · user-specific story bank\n'
def clean(value):
    value=re.sub(r'(?<=\w)-\s*\n\s*(?=\w)','-',value)
    return re.sub(r'\s+', ' ', value).strip()
def body(page):
    assert pages[page-1].startswith(header)
    return pages[page-1][len(header):].strip()
with pdfplumber.open(SOURCE) as pdf:
    tables = {p: pdf.pages[p-1].extract_tables()[0] for p in (2,23,24,25)}

clusters_zh = dict(zip(['LIBRARY','COMMUNITY-CENTRE','MEDICAL-UNCLE','RESTAURANT-UNCLE','SUMMER-SCHOOL','ORGANIZED-SISTER','CHANGSHA','SWIMMING','MOTORCYCLE','FAMILY-MEAL','LEGACY','SPORTS-EVENT','LEGACY-EXPERIENCE','LEGACY-GOAL','LEGACY-TECH'], ['大学图书馆','社区中心','医生叔叔','餐厅叔叔','设计暑校','有条理的姐姐','长沙地标','学游泳','二手摩托车','家庭生日宴','待补故事','体育比赛','改变决定','长期目标','技术问题']))
entries = []
def add(entry):
    entry.setdefault('cluster','')
    entry.setdefault('clusterLabel',clusters_zh.get(entry['cluster'],''))
    entry.setdefault('status','ready')
    entry.setdefault('needsPersonalDetails',False)
    entry.setdefault('file','speaking-story-'+entry['id'].lower()+'.html')
    entry.setdefault('related','')
    entry.setdefault('cue',entry.get('titleEn',''))
    entry.setdefault('keywords','')
    entry.setdefault('tags',entry.get('clusterLabel',''))
    entry.setdefault('description',entry.get('story','')[:160])
    entries.append(entry)
    return entry

for p in range(3,23):
    text = body(p)
    title, rest = text.split('6 KEYWORDS\n',1)
    title_en, meta = title.split('\n',1)
    # The two long titles wrap onto a second line before the Chinese metadata.
    if '   |   ' not in meta.split('\n')[0]:
        line,meta=meta.split('\n',1); title_en += ' '+line
    zh,status,cluster = [clean(s) for s in meta.split('|')]
    cluster=cluster.removeprefix('Cluster: ').strip()
    keywords,rest=rest.split('Story core: ',1)
    story,rest=rest.split('Can link to: ',1)
    related,rest=rest.split('Stable answer / handling note\n',1)
    answer,rest=rest.split('High-value corrections\n',1)
    corrections,rest=rest.split('Active vocabulary: ',1)
    vocabulary,tags=rest.split('Codex tags: ',1)
    source_id=re.search(r'id=([^;]+)',tags)[1]
    needs='needsPersonalDetails=true' in clean(tags)
    corrections=[clean(s) for s in corrections.split('') if clean(s)]
    code=status.split(' - ')[0]
    label={'A':'已练 · 稳定','A2':'已练 · 需复练','B':'已练 · 待核对','B/C':'待补个人细节','C':'待补个人细节'}[code]
    e=add(dict(id='course-impressed' if source_id=='P2-COURSE-SUMMERSCHOOL' else source_id,sourceId=source_id,part=2,kind='part2',title=zh,titleEn=re.sub(r'^\d+\s+','',title_en),cluster=cluster,sourceStatus=status,statusLabel=label,status='draft' if needs else 'ready',needsPersonalDetails=needs,keywords=clean(keywords),story=clean(story),answer=clean(answer),corrections='\n'.join(corrections),errorFixes=corrections,activeVocabulary=clean(vocabulary),related=clean(related),sourcePages=[p]))
    if e['id']=='course-impressed': e['file']='speaking-part2-course.html'

p1_titles=['社交媒体','电影与电影院','老师','唱歌与音乐课','整洁习惯','邻居与住宿','科学','手表','公园与花园','晚间习惯','睡眠','家庭旅行','回收与垃圾','网上买鞋','礼貌','水果与蔬菜','广告','纸张与手写','网站','照片','公共交通','无聊','太空','音乐','梦想与抱负','耳机','高中','记住名字']
rows=[[*row,23] for row in tables[23][1:]]
for row in tables[24][1:]:
    if not row[0]:
        assert rows[-1][0]=='Boredom'
        rows[-1][2]+=' '+row[2] # PDF page break splits "change my mood".
        rows[-1][3]=[23,24]
    else: rows.append([*row,24])
assert len(rows)==28
for i,(row,zh) in enumerate(zip(rows,p1_titles),1):
    title,story,vocab,page=row
    add(dict(id=f'P1-{i:02}',part=1,kind='part1',title=zh,titleEn=clean(title),sourceStatus='Practised topic outline',statusLabel='已练 · 提纲',story=clean(story),activeVocabulary=clean(vocab),keywords=clean(vocab),sourcePages=page if isinstance(page,list) else [page],description=clean(story),tags='Part 1，已练话题',answer='',sections=[['答题节奏','20-30 seconds. Direct answer -> reason -> one detail. The detail must support the exact question.'],['已有个人素材',clean(story)],['主动表达与纠错目标',clean(vocab)],['继续完善','原文保留的是素材提纲，并非完整答案。点击“补充本题”写下本次回答与纠错。']]))

p3_titles=['无聊与应对','本地新闻','医生与医疗','幸福与金钱','工作面试','做决定','环境与企业','组织能力','噪音与公共行为','自然与城市','存钱与财商教育','记忆 · 待续练']
assert len(tables[25][1:])==12
for i,(row,zh) in enumerate(zip(tables[25][1:],p3_titles),1):
    title,kind,logic,vocab=map(clean,row)
    pending=i==12
    add(dict(id=f'P3-{i:02}',part=3,kind='part3',title=zh,titleEn=title,sourceStatus=kind,statusLabel='待续练' if pending else '已练 · 逻辑',status='draft' if pending else 'ready',needsPersonalDetails=pending,story=logic,keywords=vocab,activeVocabulary=vocab,sourcePages=[25],tags=kind,description=logic,sections=[['答题节奏','45-60 seconds. PEEL = Point -> Explanation -> Example/Effect -> Link. If you cannot think of two points, complete one strong point instead of forcing two weak ones.'],['题型',kind],['已练逻辑／待续练问题',logic],['主动表达',vocab],['继续完善','点击“补充本题”记录自己的观点、例子和老师纠错。']]))

legacy_lines=body(27).splitlines()
legacy_titles=['有名人出演的广告','擅长学语言的人','必须很早起床的一次经历','喜欢拜访但不想住的家','特别食物 · 饺子样例边界','体育比赛 · 通用样例边界']
legacy_body='\n'.join(legacy_lines[3:])
legacy_starts=['Advertisement with a famous person','Person who is good at learning languages','A time you had to get up very early','A home you like to visit but would not want to live in','Special food on an occasion - dumplings','Sports event generic football sample']
for i,(en,zh) in enumerate(zip(legacy_starts,legacy_titles)):
    start=legacy_body.index(en)+len(en)
    end=legacy_body.index(legacy_starts[i+1]) if i+1<len(legacy_starts) else len(legacy_body)
    note=clean(legacy_body[start:end])
    add(dict(id=f'LEGACY-{i+1:02}',part=2,kind='legacy',title=zh,titleEn=en,cluster='LEGACY',status='draft',statusLabel='待补个人细节',sourceStatus='Exposed topic, not a stable personal story',needsPersonalDetails=True,story=note,description=note,sourcePages=[27],sections=[['资料边界',clean('\n'.join(legacy_lines[1:3]))],['原文保留说明',note],['等待补充','先记录真实的人物、时间、地点和细节，再形成自己的答案。此处不把通用样例写成个人经历。']]))

teacher,error=body(26).split('Global Error Bank｜全局自动化规则\n')
teacher_lines=teacher.splitlines()[1:]
teacher_labels=['Exact-question control','Names topic','Part 2 coherence','Part 3 method','Vocabulary','Grammar','Pronunciation']
def split_sections(text,labels):
    result=[]
    for i,label in enumerate(labels):
        start=text.index(label)+len(label)
        end=text.index(labels[i+1],start) if i+1<len(labels) else len(text)
        result.append([label,clean(text[start:end])])
    return result
add(dict(id='REFERENCE-MAP',part=0,kind='reference',title='串题总地图与使用说明',statusLabel='学习参考',sourcePages=[1,2],tags='串题，状态，Part 1，Part 2，Part 3',description='11 组可复用故事；从大学图书馆、设计暑校到家庭生日宴，按题目切换叙述重点。',sections=[['资料简介',clean(body(1))],['练习状态与答题节奏',clean(body(2).split('1. 串题总地图')[0])]],table=[[clean(c) for c in row] for row in tables[2]],tableTitle='串题总地图'))
add(dict(id='REFERENCE-TEACHER',part=0,kind='reference',title='老师点评 · 2026-10-05',statusLabel='学习参考',sourcePages=[26],tags='老师点评，答题逻辑，语法，发音',description='答准问题、Part 2 连贯性、Part 3 五种题型，以及词汇、语法和发音重点。',sections=split_sections('\n'.join(teacher_lines),teacher_labels)))
error_labels=['Past tense:','Pronouns:','be + adjective:','Modal + base verb:','feel + adjective:','Uncountables:','Collocations:','Restart control:','Filler control:','Scope control:']
add(dict(id='REFERENCE-ERRORS',part=0,kind='reference',title='全局纠错与表达规则',statusLabel='学习参考',sourcePages=[26],tags='纠错，时态，代词，搭配，停顿',description='10 条常见错误检查：过去时、代词、词性、介词搭配、重复重启和填充词。',sections=split_sections(error,error_labels)))
add(dict(id='REFERENCE-SOURCE',part=0,kind='reference',title='资料来源与原文整理说明',statusLabel='学习参考',sourcePages=[28],tags='来源，原文，资料结构',description='保留原 PDF 的来源说明和整理规范，可查看或下载 28 页完整原文。',sections=[['PDF 原文记录',body(28)]]))

assert len(entries)==70
bank=dict(schemaVersion=1,date='2026-10-07',source=dict(file=PDF_NAME,originalName=SOURCE.name,sha256=hashlib.sha256(SOURCE.read_bytes()).hexdigest(),pages=28),storyClusters=[dict(zip(['id','coreMaterial','linkedTopics','status'],map(clean,row))) for row in tables[2][1:]],entries=entries,sourcePages=[dict(page=i+1,text=t) for i,t in enumerate(pages)])
ASSETS.joinpath('speaking-storybank.json').write_text(json.dumps(bank,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
shutil.copyfile(SOURCE,ASSETS/PDF_NAME)
metadata=[]
for e in entries:
    item={k:v for k,v in e.items() if k not in ('sections','table','tableTitle','errorFixes')}
    item['searchText']=' '.join([text for section in e.get('sections',[]) for text in section]+[clean(c) for row in e.get('table',[]) for c in row])
    metadata.append(item)
ASSETS.joinpath('speaking-storybank.js').write_text('(function(root,factory){if(typeof module==="object"&&module.exports)module.exports=factory();else root.WordlySpeakingStorybank=factory();})(typeof globalThis!=="undefined"?globalThis:this,function(){return '+json.dumps(metadata,ensure_ascii=False,separators=(',',':'))+';});\n',encoding='utf-8',newline='\n')

style='''*{box-sizing:border-box}html{color-scheme:light}body{margin:0;background:#f7f9f5;color:#29463a;font:14px/1.85 system-ui,"Microsoft YaHei",sans-serif}.wrap{max-width:860px;margin:auto;padding:24px}a{color:#416e55;text-decoration:none}a:hover{text-decoration:underline}header{padding-bottom:20px}nav{display:flex;justify-content:space-between;gap:15px;font-size:12px;margin-bottom:22px}.kicker{font-size:10px;letter-spacing:1px;color:#86947f}h1{font-size:24px;line-height:1.5;margin:8px 0}h2{font-size:15px;margin:0 0 12px;color:#42634e}.en{font-size:13px;color:#7e8c77;margin:0}.meta{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 0}.meta span,.keywords span{border:1px solid #e1e8da;border-radius:7px;padding:4px 9px;font-size:11px;color:#667f5a}.section{padding:22px;background:#fff;border:1px solid #e2e8dd;border-radius:12px;margin:14px 0}.body{white-space:pre-wrap;overflow-wrap:anywhere}.answer{font-size:15px;line-height:2}.keywords{display:flex;gap:7px;flex-wrap:wrap}.warning{font-size:12px;background:#faf6e8;border:1px solid #e9dfb8;border-radius:10px;padding:13px 16px;color:#8a7541}ul{padding-left:20px;margin:0}li+li{margin-top:9px}.table-wrap{overflow:auto}table{border-collapse:collapse;width:100%;font-size:12px}th,td{text-align:left;vertical-align:top;border-bottom:1px solid #e6ecdf;padding:10px;min-width:115px}th{color:#729065;font-weight:600}.source{font-size:11px;color:#92a088;margin:22px 0}details{margin-top:22px}summary{cursor:pointer;font-weight:600}@media(max-width:560px){.wrap{padding:17px}h1{font-size:21px}.section{padding:17px}.answer{font-size:14px}nav{flex-wrap:wrap}}'''
def section(title,value,cls=''):
    return '<section class="section"><h2>'+escape(title)+'</h2><div class="body '+cls+'">'+escape(value)+'</div></section>'
def content(e):
    output=''
    if e['needsPersonalDetails']: output+='<p class="warning">待补充：原资料尚无稳定的个人答案。请通过“补充本题”完善真实细节。</p>'
    if e['kind']=='part2':
        output+='<section class="section"><h2>快速准备 · 关键词</h2><div class="keywords">'+''.join('<span>'+escape(k.strip())+'</span>' for k in e['keywords'].split(' / ') if k.strip())+'</div></section>'
        output+=section('故事线',e['story'])+section('可串联题目',e['related'])+section('练过的答案' if not e['needsPersonalDetails'] else '原文提纲与待补说明',e['answer'],'answer')
        output+='<section class="section"><h2>高价值纠错</h2><ul>'+''.join('<li>'+escape(c)+'</li>' for c in e['errorFixes'])+'</ul></section>'+section('主动词汇',e['activeVocabulary'])
    else:
        output+=''.join(section(*s) for s in e['sections'])
    if e.get('table'):
        output+='<section class="section"><h2>'+escape(e['tableTitle'])+'</h2><div class="table-wrap"><table><thead><tr>'+''.join('<th>'+escape(c)+'</th>' for c in e['table'][0])+'</tr></thead><tbody>'
        for row in e['table'][1:]:
            output+='<tr>'+''.join('<td>'+escape(c)+'</td>' for c in row)+'</tr>'
        output+='</tbody></table></div></section>'
    output+='<p class="source">来源：2026-10-07 全量口语整理 · PDF 第 '+', '.join(map(str,e['sourcePages']))+' 页 · '+escape(e.get('sourceStatus','资料说明'))+'<br><a href="'+PDF_NAME+'" target="_blank" rel="noopener">查看完整原 PDF（28 页）</a> · <a href="'+PDF_NAME+'" download>下载原 PDF</a></p>'
    return output
for e in entries:
    label='方法与地图' if not e['part'] else 'PART '+str(e['part'])
    page='<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escape(e['title'])+' · Wordly 口语整理</title><style>'+style+'</style></head><body><div class="wrap"><header><nav><a href="../#speaking-library" target="_top">← 返回口语整理库</a><a href="'+PDF_NAME+'" target="_blank" rel="noopener">原 PDF ↗</a></nav><div class="kicker">'+label+' · STORY BANK</div><h1>'+escape(e['title'])+'</h1><p class="en">'+escape(e.get('titleEn',''))+'</p><div class="meta"><span>'+escape(e['statusLabel'])+'</span>'+('<span>'+escape(e['clusterLabel'])+'</span>' if e['clusterLabel'] else '')+'</div></header>'+content(e)+'</div></body></html>'
    if e['id']=='course-impressed':
        # Keep the existing course page and stable id, add the exact PDF version.
        original=ASSETS.joinpath(e['file']).read_text(encoding='utf-8')
        original=re.sub(r'\n*<!-- STORYBANK-SOURCE-START -->.*?<!-- STORYBANK-SOURCE-END -->\n*','\n',original,flags=re.S)
        append='<!-- STORYBANK-SOURCE-START --><style>#storybankCourse .section{padding:18px;border:1px solid #e2e8dd;border-radius:10px;margin:14px 0;background:white}#storybankCourse .body{white-space:pre-wrap;overflow-wrap:anywhere}#storybankCourse .answer{font-size:15px;line-height:2}#storybankCourse .keywords{display:flex;gap:7px;flex-wrap:wrap}#storybankCourse .keywords span{font-size:12px;padding:4px 8px;background:#f0f4ed;border-radius:6px}#storybankCourse .source{font-size:12px;color:#7c8d73}</style><section id="storybankCourse" class="card" style="margin:22px auto;max-width:920px;padding:24px"><h2>全量题库补充 · PDF 第 12 页</h2><p>2026-10-05 已练，仍需复练。以下完整保留本次 PDF 的答案、故事线与纠错；上方原课程整理继续可用。</p>'+content(e)+'</section><!-- STORYBANK-SOURCE-END -->'
        ASSETS.joinpath(e['file']).write_text(original.replace('</body>',append+'\n</body>'),encoding='utf-8',newline='\n')
    else: ASSETS.joinpath(e['file']).write_text(page,encoding='utf-8',newline='\n')
print(json.dumps(dict(entries=len(entries),part2=20,part1=28,part3=12,legacy=6,references=4,pages=28,sourceHash=bank['source']['sha256'])))
