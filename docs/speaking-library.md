# 口语整理库

主导航选择“口语整理”，或在“口语训练 → 练习整理”中进入。直达地址：`/#speaking-library`；GitHub Pages 的地址为 `/wordly/#speaking-library`。

## 添加自己的练习

1. 点击“新增练习整理”，填写题目名称，选择 Part 1 / 2 / 3。
2. 逐步填写题卡、关键词、故事线、答案、纠错、下次重点和标签。只有题目名称必填。
3. 填写过程自动保留一份未完成草稿，切换栏目和刷新后可继续。正在填写一题时，先保存它再新增另一题。
4. 点击“保存整理”，可把状态设为“待补充”或“已整理”。已保存的题随时可以继续编辑；更新不会创建重复副本。
5. 用分类和搜索查找题目。当前内置一份课程题整理；“补充本题”可建立与原整理关联的个人补充，原课程内容保留。

“设置 → 导出备份”现在包括个人口语整理及未完成稿。旧版备份仍能读取，其他学习记录的存储键不变。录音仍在原 IndexedDB 中，JSON 学习备份不含录音。

个人补充只保存在当前浏览器，不会自动发布给其他访客，也没有账号或跨设备同步。换设备、换网址前先导出备份；不要把含个人练习内容的备份提交到公共仓库。

## 维护网站文件

- `assets/speaking-library.js`：内置资料目录、分类搜索、阅读、编辑、草稿自动保存。
- `assets/speaking-library.css`：整理库与表单样式。
- `assets/speaking-part2-course.html`：现有课程题完整内容；返回入口指向整理库。
- `index.html`：主导航、口语训练标签、原数据库的增量字段与备份兼容。
- `tests/speaking-library.test.cjs`：资料路径、搜索分类、更新与安全文本显示。
- `tests/storage-preservation.test.cjs`：包含个人整理和草稿的加载、保存、旧数据保留。

增加公开的固定资料：在 `assets/` 下添加静态 HTML，并在模块的 `builtins` 数组登记元数据。维护完成后运行：

```powershell
node scripts/version-speaking-library.mjs
node --test tests/*.test.cjs
node scripts/build-github-pages.mjs
```

推送 main 后，原 GitHub Pages 和 Vercel 项目自动发布。用户通过表单新增私人整理不需要重新部署。
# 全量口语资料（2026-10-07）

已将用户提供的 28 页 PDF 完整接入：20 道 Part 2、28 个 Part 1 话题、12 组 Part 3 逻辑、6 个待补题和 4 份方法／来源资料。入口仍为主导航“口语整理”或 `#speaking-library`。

- 按 Part、故事、整理状态和资料来源筛选；搜索覆盖答案、主动词汇、纠错及老师点评。
- 点击“串题地图”查看 11 组故事；同一故事的 Part 2 整理可直接互相跳转。
- 点击“阅读整理”查看完整内容；点击“补充本题”保存自己的回答。内置资料不会覆盖私人笔记。
- A 稳定、A2 需复练、B 待核对；C、未确定个人经历的题及尚未稳定的记忆 Part 3 均保留待补状态。
- 资料提纲不会扩写成未经确认的个人经历。旧课程 `course-impressed` 的 ID、旧页面和私人补充关系保留。
- 原 PDF 保存在 `assets/speaking-storybank-2026-10-07.pdf`。`assets/speaking-storybank.json` 保存结构化内容和全部逐页原文；`.js` 提供搜索目录，各 `speaking-story-*.html` 提供阅读页。
- `scripts/import-speaking-storybank.py` 为此次特定版本的可复现导入脚本（需要 pypdf、pdfplumber）。传入本次原 PDF 的绝对路径后生成资料；不接触 localStorage 或 IndexedDB。新版本资料应先核对页数和结构，再调整导入器。
- 修改后依次运行 `node scripts/version-speaking-library.mjs`、`node --test tests/*.test.cjs`、`node scripts/build-github-pages.mjs`，提交并推送 main 发布到原站点。
