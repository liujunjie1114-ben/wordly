# TED / BBC 听力专区

保留静态 HTML 技术结构，没有服务端账号、付费接口或新数据库。

- `index.html`：新增导航与专区入口；原有单词朗读、听写及录音会协调停止听力音频，避免同时播放。
- `assets/listening.js`：节目列表、BBC 原生音频播放器、TED 官方嵌入播放器、英文文稿、夜间显示与跨栏目播放控制。
- `assets/listening-core.js`：睡眠截止时间与官方来源 URL 校验，支持浏览器和 Node 测试。
- `assets/listening.css`：专区和浮动播放器样式，沿用网站配色，保持无粗彩色装饰线的卡片。
- `assets/listening-catalog.json`：BBC 和 TED 的节目元数据及官方链接。音频、视频、字幕及 PDF 留在官方服务器，不重新上传内容。

TED 默认使用原版英语音轨和英文字幕。BBC 有英文 PDF 文稿的节目支持内嵌预览；没有 PDF 时链接到对应官方节目页。BBC 文稿不是逐句同步字幕。官方播放器或 PDF 预览受访问者网络及浏览器影响，始终提供官方链接。

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
