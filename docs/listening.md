# TED / BBC 听力专区

## 听力课堂复盘（更新至 2026-10-18）

已按日期收录 2026-10-03、2026-10-07、2026-10-12、2026-10-17 和 2026-10-18 五次课堂。`assets/listening-lessons.html` 为统一目录；各阅读页互相链接。10月17日为 Test 1 四个 Section 的整理；10月18日为刺柏题回顾及工作满意度研究、中世纪手稿两篇 Section 4 的课堂方法与参考答案。均未发布个人填写记录或实际成绩。历史日期、“今晚”、原一周计划和老师作业按原记录保留，未写入当前计划；尤其不将老师原10页807任务改为网站每日两页任务，也不自动更改用户现行任务。

- `assets/listening-lesson-2026-10-12.md`：用户授权加入网站的课堂笔记，原文件逐字保留（1416 行）。
- `assets/listening-lesson-2026-10-17.md`：Test 1 听力四个 Section 的公开复习笔记，保留知识点与参考答案，不含私人作答。
- `assets/listening-lesson-2026-10-18.md`：当日课堂的预判、定位、信号词与两篇 Section 4 答案核对笔记，不含私人作答和老师录音。
- `assets/listening-lesson-2026-10-12.html`：静态全文阅读页，含 30 节目录、一页速记、70 分钟课后训练及原始 Markdown 下载。原题和课堂音频未提供，例题结论依据笔记，未独立核验。
- `scripts/build-listening-lesson.mjs`：配置课堂日期、标题、快捷入口及阅读重点，从各篇原始 Markdown 生成阅读页和总目录。支持一级或二级章节标题，转义原文 HTML，保留代码块、表格、列表、引文和编号章节。
- 今日计划、听力科目首页及 TED / BBC 页均提供入口；阅读页在新标签中打开，原页面的听写、计时及未保存编辑保持原状。
- 不导入个人数据库、不标记任务完成、不改变复习队列和存储键。后续私人复盘仍留在本机，不能因本次公开笔记而自动发布用户数据库。

更新笔记后运行 `node scripts/build-listening-lesson.mjs`，再按仓库约定运行全套测试和静态构建。该脚本同时生成 `study-dashboard.js` 的课堂入口函数并更新 index 内 dashboard JS/CSS 哈希缓存版本；请先修改 CSS 再运行生成脚本。后续新增课堂在脚本 `lessons` 配置中加入日期及入口，原文件保存为 `assets/listening-lesson-YYYY-MM-DD.md`。

保留静态 HTML 技术结构，没有服务端账号、付费接口或新数据库。

- `index.html`：新增导航与专区入口；原有单词朗读、听写及录音会协调停止听力音频，避免同时播放。
- `assets/listening.js`：节目列表、BBC 原生音频播放器、TED 官方嵌入播放器、英文文稿、夜间显示与跨栏目播放控制。
- `assets/listening-core.js`：睡眠截止时间与官方来源 URL 校验，支持浏览器和 Node 测试。
- `assets/listening.css`：专区和浮动播放器样式，沿用网站配色，保持无粗彩色装饰线的卡片。
- `assets/listening-catalog.json`：BBC 和 TED 的节目元数据及官方链接。音频、视频、字幕及 PDF 留在官方服务器，不重新上传内容。

TED 链接传入英语音轨与英文字幕偏好，但官方播放器可能按访客语言自动改为中文配音。首次播放时可在 TED Fluent 中选择 English（ORIGINAL）或关闭配音，再在字幕菜单选择 English；专区已显示这一提示。BBC 有英文 PDF 文稿的节目支持内嵌预览；没有 PDF 时链接到对应官方节目页。BBC 文稿不是逐句同步字幕。官方播放器或 PDF 预览受访问者网络及浏览器影响，始终提供官方链接。

睡眠定时支持 15、30、60 分钟及 0.1–240 分钟自定义。时间从设置时开始，取消定时不会停止播放；切换网站栏目不会取消定时。到点暂停 BBC 音频并移除 TED 播放器；TED 再次打开会重新载入。后台恢复时校验绝对截止时间。浏览器被操作系统冻结或网页关闭时，无法保证精确后台计时。

## 更新与检查

在仓库目录运行：

```powershell
node scripts/update-listening-catalog.mjs
node scripts/version-listening-assets.mjs
node --test tests/listening.test.cjs
node scripts/check-listening-sources.mjs
node scripts/build-github-pages.mjs
```

目录更新脚本从 BBC 官方 RSS 和节目页面读取最新 8 集的元数据、音频链接与文稿链接；TED 精选在该脚本中维护。网页中的“刷新 BBC 节目”可直接读官方 RSS，显示最多 30 集，刷新失败仍保留现有列表。

修改 JS/CSS/节目目录后务必运行版本脚本，避免 Vercel 的资源长期缓存显示旧版本。将变更提交并推送到同一仓库 `main` 后，Vercel 和 GitHub Pages 自动更新，分享网址保持不变。

新增听力专区不改变原有 localStorage / IndexedDB 数据格式和备份文件。睡眠倒计时只保留在当前网页会话，不在关闭网页后继续运行。
