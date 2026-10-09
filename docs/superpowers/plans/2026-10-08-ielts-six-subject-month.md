# IELTS Six-subject Month Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用“今日任务→到期复习→六科入口”的清晰动线承载每天6小时、30天的真实资料学习计划。

**Architecture:** 新增小型 UMD 计划纯逻辑模块与仪表盘UI模块，继续使用原生单页导航。计划独立保存于原数据库 `db.studyPlan`，与资料导入共同事务；旧训练、媒体、录音、哈希入口全部保留。资料安全导入先按配套计划实施。

**Tech Stack:** HTML、CSS、原生JavaScript、Node内置测试；不引入框架或远程服务。

**Spec:** `docs/superpowers/specs/2026-10-08-ielts-month-study-design.md`（用户已确认）。

## Global Constraints

- 保留现有静态 HTML/CSS/原生 JavaScript、原网站地址、学习记录和录音数据库。
- 主导航：今日计划、听力、阅读、写作、口语、单词、语法；每科统一“学知识 → 做练习 → 留复盘”。
- 每天360分钟，其中学习330分钟、休息30分钟；不锁定起床或就寝时间。
- 词汇65、听力50、阅读55、口语60、写作55、语法25、当日复盘20分钟；三次10分钟休息。
- 默认开始日期是用户点击开始当天的北京时间；先预览30天，再显式开始。
- 待核对不排入任务；打开内容不代表掌握；勾选只能标“自报完成”。
- 旧备份缺少计划字段时使用空默认值，不影响其他学习记录；私人内容不公开。

## Review Focus

- 北京时间跨日、闰日或用户换时区：计划日期仍正确，不依赖主机时区（任务1）。
- 空库、只有待核对内容、超出六小时容量：显示原因及未排入量，不伪造内容或完成率（任务1、3）。
- 计划启动后新增/修改/删除知识卡：已完成任务和证据保持不变，未来安排可核验（任务1、2）。
- 正在录音、听写、编辑未保存时：新导航继续尊重旧阻挡机制，不丢草稿（任务2、3）。
- 窄屏、键盘、屏幕阅读器或减少动画偏好：主行动和焦点顺序明确，无横向溢出（任务3、4）。

## File Structure

- Create `assets/month-plan-core.js`：纯数据计划、日期、追加、顺延、自报与证据引用。
- Create `tests/month-plan.test.cjs`：合成卡片测试，不包含私人文本。
- Create `assets/study-dashboard.js`, `assets/study-dashboard.css`：今日计划、30天预览和六科同构入口。
- Create `tests/study-dashboard.test.cjs`：页面结构、路由与安全呈现测试。
- Modify `assets/study-library.js`：支持显式打开科目、具体卡和指定复习队列。
- Modify `index.html`：模块加载、统一导航、首页接入、`db.studyPlan`规范化和事务保存。
- Modify `tests/storage-preservation.test.cjs`：计划与资料联合保存、旧记录守恒。
- Modify `docs/study-library.md`：六科路径、30天启动及自报/实测区别。

### Task 1: 30天计划核心与容量边界

**Interfaces:** `WordlyMonthPlan.normalize(value) -> Plan|null`；`chinaDay(nowMs) -> YYYY-MM-DD`；`create({entries,startDay,now}) -> Plan`；`append(plan,entries,today) -> Plan`；`setTask(plan,taskId,{selfReported,notes,evidence}) -> Plan`；`daily(plan,day,review) -> DailyView`。Plan为 `{version:1,id,startDay,created,days:[{day,index,phase,tasks:Task[]}],unassigned:string[]}`；Task为 `{id,subject,minutes,entryIds:string[],selfReported:boolean,notes:string,evidence:[{type:'knowledge-review'|'dictation-log'|'speaking-log',id:string}]}`。每天7学习任务及3休息任务，休息不计算学习完成率。

- [ ] **Step 1:** 新建测试断言：30天连续、学习330/休息30；`chinaDay(Date.parse('2026-10-08T16:01:00Z')) === '2026-10-09'`；`2028-02-28`开始跨闰日正确；仅ready真ID；新学ID全计划唯一；review重复练习另标不冒充新覆盖；空库不能开始；超量留下unassigned且无假覆盖。
- [ ] **Step 2:** 运行 `node --test tests/month-plan.test.cjs`，应因模块不存在失败。
- [ ] **Step 3:** 实现上述接口。26天为新学窗口，7/14/21降低新学并累计复测，27–30模拟与补漏；按科目/题型标签和稳定ID排序。分配时以认义词15秒、主动使用词45秒、知识卡90秒为初始估算；每天至少保留35分钟词汇旧卡回忆、各科至少半数时间用于实际练习，余量分配新卡。计入这些估算并显示可调整，不把全部词强塞进65分钟。超量明确未排入、提供先诊断已认识词/降低复习负担/延长计划的提示，不自动增加用户六小时预算。
- [ ] **Step 4:** 增加并通过 `append keeps completed task byte-identical`、`overdue tasks stay visible without extending time`、`deleted or newly unverified source is not silently reassigned`；任务ID一经开始稳定，未来剩余容量才接纳新增卡，旧完成证据不重排，缺失来源显示失效原因。
- [ ] **Step 5:** 暂存这两个新文件并提交 `feat: generate bounded thirty-day IELTS study plans`，不推送。

### Task 2: 原数据集成与明确复习入口

**Interfaces:** 应用新增 `saveStudyPlan(value) -> boolean`；`saveStudyMaterials(value,pack)` 在同一事务更新knowledge、words和未完成未来计划，失败三者都回滚。库新增 `open({subject='',kind='',entryId=null,reviewIds=null}) -> void`，仅接受有效科目/现有ID且排除待核对复习，保留现有 configure/mount/navigation guards。

- [ ] **Step 1:** 增加存储测试：旧备份`studyPlan === null`且旧字段完全相同；完整导出/恢复保留Plan和证据；配额失败knowledge/words/studyPlan三者不变；新增包不改已完成Task；悬空证据不提升掌握状态。
- [ ] **Step 2:** 运行 `node --test tests/storage-preservation.test.cjs tests/study-library.test.cjs` 确认新断言先失败。
- [ ] **Step 3:** 实现normalizeDb追加计划字段、saveStudyPlan和联合事务；压缩readDb/writeDb仍保留该字段。按明确动作调用库open后再mount，指定ID不存在时提示而非随机打开；未保存编辑时仍阻止切页。旧hash仍可达知识、听力、口语整理，新增语义hash使用明确映射，不复用已有路由ID冒充新页面。
- [ ] **Step 4:** 重跑测试。额外断言进入/退出资料页不把打开次数写入knowledge.review，计划checkbox只改selfReported，日志证据只能引用实际已有日志。
- [ ] **Step 5:** 暂存 `index.html assets/study-library.js tests/storage-preservation.test.cjs tests/study-library.test.cjs`，提交 `feat: preserve month-plan history alongside private imports`。

### Task 3: 首页和六科学习动线

**Interfaces:** `WordlyStudyDashboard.configure({getDb,savePlan,navigate,openKnowledge,notify})`；`mountHome(node)`；`mountSubject(node,subject)`；`beforeRender()`。subject为listening/reading/writing/speaking/words/grammar；navigate调用原go并尊重录音、听写、草稿保护。UI状态不另开存储键。

- [ ] **Step 1:** 新建测试：主导航顺序固定；首页今日任务DOM先于到期/错题、六科和日历；每科有知识/练习/复盘；题目HTML样字符串被转义；空库指向导入而非显示虚构任务；任务备注为自报，实测证据单独标明。
- [ ] **Step 2:** 运行 `node --test tests/study-dashboard.test.cjs`，确认模块/布局缺失失败。
- [ ] **Step 3:** 实现小模块与CSS，沿用米白绿。首页先显示开始前预览或今日“下一项”；到期复习使用实际review中已学习且到期项，不把所有未学卡都算积压。六科卡只显示真实可用/待核对量；日历、统计、历史放后方折叠区。导航主项7个、管理次项集中，旧听写/词汇书/自建听写/口语整理仍由科内练习入口到达。每科统一三个分区，不一次展开上千词卡。
- [ ] **Step 4:** 增加并通过路由保护测试：正在录音/听写或未保存编辑时新导航不能绕开原go；“开始计划”只能点击后保存；取消30天预览不改db；继续任务打开实际ID，存在多个目标时先列当次短队列。
- [ ] **Step 5:** 提交 `assets/study-dashboard.js assets/study-dashboard.css index.html tests/study-dashboard.test.cjs`，消息 `feat: organize six IELTS subjects around today's study`。

### Task 4: 完整验收、容量校准与原网址交付

**Interfaces:** 消费前3任务及配套导入计划；交付原正式网址，不新建站点或跨域迁移用户数据。

- [ ] **Step 1:** 运行 `node --test tests/*.test.cjs`、`node scripts/build-github-pages.mjs`、`git diff --check`。若触及口语库/听力外部资源，分别运行现有对应version脚本，否则只更新本次新模块缓存版本。
- [ ] **Step 2:** 用合成大词库检查计划生成耗时、压缩保存和未分配提示；统计实际导入ready数量对应30天估计负担，在计划预览展示覆盖率与超量数，不宣传全部掌握。正式站开始日期由用户选择，默认不自动启动。
- [ ] **Step 3:** 用浏览器UI核验桌面与390px窄屏：首页首行动、六科、搜索、编辑、重载保持；Tab焦点、Enter确认、普通空格/Shift+Space原听写行为保留；录音保护；无自动发音/动画；减少动画偏好生效。保存可展示的最终界面截图。
- [ ] **Step 4:** 按配套导入计划完成发布与正式站私人导入、前后备份比对，重新验证错题仍在、原日志与排期未变。页面展示6小时预算、30天预览和真实覆盖账本。
- [ ] **Step 5:** 提交使用说明与最终修正，明确文件列表和原网址；最终回复说明实际导入/待核对、六小时安排、开始方法及任何剩余容量限制，不将未完成项写成成功。

## Self-review

任务1覆盖日期、容量、阶段与顺延；任务2覆盖数据、证据与旧入口；任务3覆盖今日优先/六科同构/视觉层级；任务4覆盖窄屏键盘与发布验证。私有源审读及重复处理归配套计划。实现前需要用户审阅两份计划并选择执行方式；建议Native以减少互相依赖接口的集成开销，最终独立复核。
