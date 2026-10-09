# IELTS Private Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将已审校资料安全合并到知识库和正常词库，保留来源、待核对边界以及所有旧学习数据。

**Architecture:** 沿用已编写但未发布的 study-core / study-library 原生模块。私有汇总器生成限额 JSON 包，浏览器先预览后原子保存，不新增后台。此计划独立可交付；六科动线及月计划见第二份计划。

**Tech Stack:** HTML、原生 JavaScript、Node 内置测试、Python 标准库、本地 LZ-String。

**Spec:** `docs/superpowers/specs/2026-10-08-ielts-month-study-design.md`（用户于2026-10-08确认）。

## Global Constraints

- 保留现有静态 HTML/CSS/原生 JavaScript、原网站地址、学习记录和录音数据库。
- 学习数据键保持 `wordly_app_v1`；录音数据库保持 `wordly_audio_v1`。
- 私人内容仍通过网站本机导入，进度保存在同一浏览器；没有新增后台或跨设备同步。
- 分包不超过 1000 条及 5 MB；待核对内容不强行进入背词和每日任务。
- 私人包不进入公开 Git 或构建目录；原文件只读；备份不包含录音。

## Review Focus

- 损坏原存储时：有效备份可显式恢复，但必须先导出原始损坏数据；保存失败不能报成功（任务1）。
- 新批来源与用户手改冲突时：手改内容、第一次答案及排期不被更新覆盖（任务1、3）。
- 词汇例句混有中文编辑标签时：标签可见，但不进入英文朗读字段（任务1）。
- 同英文不同义、同标题不同知识时：不自动错合；来源和真实纠错不丢失（任务2）。
- 私有文件与公开构建同时存在时：构建产物及提交必须排除全部个人资料（任务3）。

## File Structure

- Modify `assets/study-core.js`：例句规范化、压缩/合并安全边界。
- Modify `index.html`：显式有效备份恢复的事务边界；保持旧键与旧训练流程。
- Modify `tests/storage-preservation.test.cjs`, `tests/study-library.test.cjs`：真实应用函数回归和合并测试。
- Create `scripts/compile-study-packs.py`：读取显式私有清单、去重核验、分包和审读统计。
- Create `tests/study-pipeline.test.cjs`：仅使用合成临时输入测试汇总器。
- Private outputs `private-study/import-manifest.json`, `private-study/final/`：实际源路径、显式包列表、手工重复映射、来源覆盖账本及最终包，不提交。
- Modify `docs/study-library.md`：导入、备份、容量限制和待核对含义。

### Task 1: 恢复安全与英文例句

**Interfaces:** 保留 `WordlyStudyCore.mergeWords(current, pack, now) -> {words,added,merged,pending}` 与 `readDb/writeDb`。新增应用函数 `restoreLearningBackup(value) -> boolean`，只在成功持久化后替换当前数据库；失败恢复原 db 和 storageReadFailed。新增 `downloadRecoveryBackup() -> void`，读取失败时下载原始 storage 字符串而非空默认库，否则调用正常备份。

- [ ] **Step 1:** 在 storage 测试增加 `explicit valid restore recovers a blocked store`、`quota failure rolls restore back`、`recovery export retains malformed original bytes`。分别断言有效备份旧 logs/mistakes 保留且读取保护解除、setItem 抛错时 db/标志/存储不变、下载 Blob 内容等于损坏原字符串。在 study 测试增加 `Chinese editorial label is not spoken as English`，断言 `example.en === 'The flat is spacious.'` 且归属说明保留“原创”。
- [ ] **Step 2:** 运行 `node --test tests/storage-preservation.test.cjs tests/study-library.test.cjs`，确认新测试先因缺少恢复函数或例句未分离失败。
- [ ] **Step 3:** 在上述文件实现两个函数；设置页只在恢复返回 true 后清理当前练习状态、关闭预览和报成功。仅剥离已知编辑前缀“整理补充例句（原创，非原文）：”；其他混合语言例句不猜译，留资料卡，不自动加入 example.en。已有个人例句永远优先。异常存储保留原始备份后才启用恢复按钮。
- [ ] **Step 4:** 重跑同一测试，并验证压缩往返、重复导入、旧备份兼容及保存失败回滚全部通过。
- [ ] **Step 5:** 明确暂存 `index.html assets/study-core.js assets/study-library.js assets/study-library.css assets/lz-string.js assets/lz-string.LICENSE.txt .gitignore tests/storage-preservation.test.cjs tests/study-library.test.cjs tests/dictation-keyboard.test.cjs docs/study-library.md scripts/prepare-study-materials.py` 中本任务相关差异，检查暂存不含私人文件，提交 `feat: safely import private study cards without losing progress`；此时不推送。

### Task 2: 可复现私有汇总与覆盖审计

**Interfaces:** `python scripts/compile-study-packs.py --manifest private-study/import-manifest.json --output private-study/final`。清单字段 `{packs:string[], aliases:Record<entryId,entryId>, expectedOriginals:string[]}`。输出 `pack-001.json...`、`manifest.json`（包文件、hash、ready/pending与类别数量）、`coverage.json`（实际来源与审读边界）、`report.md`。任何格式错误、冲突 ID、路径逃逸或缺失列明包失败退出，不发布残缺结果。

- [ ] **Step 1:** 创建合成测试 `bounded batches remain importable`（1001张分包、每包<=1000且<=5MB）、`same English keeps distinct senses`（bank 银行/河岸均保留）、`aliases merge all provenance without changing originals`、`unreviewed OCR candidate is not a pack`、`missing or conflicting input fails`；用 `fs.mkdtempSync` 的测试目录，不访问真实用户源目录。
- [ ] **Step 2:** 运行 `node --test tests/study-pipeline.test.cjs`，确认因汇总器缺失失败。
- [ ] **Step 3:** 实现标准库汇总器。只读取清单指定包，不 glob OCR 候选；精确重复按 kind/规范英文/词性/释义或知识标题与解释指纹识别，语义重复只按人工 aliases 合并。合并来源和科目；不混合相互矛盾答案。不同义词卡分开，正常词库由 mergeWords 合并多义信息。超过100来源时拆卡保留引用，不能截断丢失。分包同时计算 UTF-8 字节和条数。先在临时输出目录验证全部再完成输出。
- [ ] **Step 4:** 重跑合成测试；对最终代理包人工确认清单，执行汇总器，再用 `WordlyStudyCore.readPack` 逐包核验。逐条解决可确定纠错；不确定保留原因。统计原89路径、18新DOCX、24新文件及参考资料，分别列提取/审读/视觉/未包含音频，不能把OCR数量当全吸收数量。
- [ ] **Step 5:** 只提交 `scripts/compile-study-packs.py tests/study-pipeline.test.cjs`，消息 `feat: compile reviewed materials into bounded private batches`；私有清单、包和报告不提交。

### Task 3: 正式站导入与数据守恒核验

**Interfaces:** 消费任务2的 `manifest.json` 与任务1的预览/事务导入能力；交付同一原网址中的私人学习库，正常词库可见新增可用词。

- [ ] **Step 1:** 扩充测试 `public build excludes private source paths and packages`：构建后只存在公开 assets/index；无 private-study、私有包、原始来源路径和备份数据。增加 `reimport preserves evidence and personal edits`，导入两次后历史字段相同、重复包不再新增、pending不进入正常词库。
- [ ] **Step 2:** 运行目标测试，确认新断言有效，再运行 `node --test tests/*.test.cjs`、`node scripts/build-github-pages.mjs`、`git diff --check`，全部通过才发布代码。
- [ ] **Step 3:** 同第二份计划一起检查暂存内容并推送本仓库 main；验证原网址确实加载新版本。只通过正式站原Edge浏览器UI导出新的导入前备份并导入私人包；逐包看预览，失败停在该包，不用旧整库覆盖新进度。
- [ ] **Step 4:** 导出导入后备份，以本地只读比较验证旧词个人字段、错题、首次答案、logs、daily、review、memoryTyping、vocabPractice、reading、speaking草稿/日志无意外变化。验证可搜索知识、词库新增与pending隔离。录音数据库不迁移、不声称JSON含录音。
- [ ] **Step 5:** 更新公开使用说明并提交 `docs: explain private imports and preservation guarantees`；最终报告实际成功导入数量、未核对数量和覆盖缺口，不公开源文本。

## Self-review

设计中的私有导入、去重、纠错、来源、词库合并、备份及数据守恒分别由任务1–3覆盖。所有用户路径仅保留于私有清单。月计划事务由第二份计划补充，发布和正式站导入在两份计划的验收都完成后进行。
