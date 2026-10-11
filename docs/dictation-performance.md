# 听写发音加速 · 2026-10-11

原网址新增直达听写入口 `#study`，继续使用 `wordly_app_v1` 和原录音数据库。

- `assets/word-audio.js` 管理最多 12 个发音播放器，每次只预载当前及后续 3 个词，不下载整库。重复播放重用播放器和已缓冲内容；网络错误后重试会重新加载。
- `audio-worker.js` 只处理当前站点 `assets/` 下 24 位内容散列命名的 MP3，保留最近写入的 120 份音频。查询参数不会产生重复缓存。支持单段 Range、后缀 Range 和 416 响应；多段 Range、HTML、PDF、外站请求和其他资源均交回浏览器。
- 缓存名为 `wordly-pronunciation-v1`，与学习数据和录音独立；不清理其他缓存、不存私人口语内容、不缓存网页或脚本。缓存不可用或满额时仍可联网播放。
- 本地播放器预载及复用立即生效；持久缓存需浏览器支持 Service Worker 和 HTTPS（本地预览地址也支持）。浏览器清理缓存或空间回收后可能需要重新下载。
- 内置音频加载/卡住时，有可用本机英语语音的设备在约 2.5 秒后改用设备英语语音；没有本机语音时最多等待约 8 秒并显示重试提示。停止、切题不会被旧异步回调重新启动播放。
- 听写设置和练习中均支持 1–4 次播放、0/1/3/4/6/8 秒间隔。“快速节奏”设置为 1 次、无间隔，在下一次播放生效；其他练习逻辑、答案、错题、记忆打字、复习时间不变。

初次打开网站、新词尚未缓存时仍受当前网络影响；本次没有迁移域名或制作另一套学习数据库。页面主体仍使用现有 HTML，优化集中在逐词发音等待，不宣称整站可离线使用。

验证命令：

```powershell
node --test tests/*.test.cjs
node scripts/build-github-pages.mjs
```

GitHub Pages 构建器额外复制根目录的 `audio-worker.js`。Vercel 保持原静态发布方式，并要求重新验证 worker 文件，避免旧 worker 长期驻留。

实现参考：[MDN Service Worker 缓存](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)、[音频 Range 缓存响应](https://web.dev/articles/sw-range-requests?hl=en)。
