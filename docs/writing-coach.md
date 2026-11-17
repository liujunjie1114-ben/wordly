# Wordly 写作教练

写作教练是 Wordly 内部页面，入口为侧栏“写作教练”或“写作 → 打开写作教练”。手机使用后一个入口。

生产地址：https://liujunjie1114-ben.github.io/wordly/#writing-coach

## 一次导入，继续学习

在“写作教练”点击“导入完整教练包”，选择本机的 `Wordly完整写作教练包.json`。现有课程包含 19 节完整教学和 49 条配套资料，保留先理清整篇思路、再用 PEEL 写段落及双语表达训练等原方法。

课程正文保存在当前浏览器的 `wordly_app_v1.writingCoach`，配套资料保存在原 `knowledge` 资料库；同编号或同内容重复导入不增加副本。已有个人解释、例句与复习日期优先保留。可导出完整教练包，也可通过“设置与备份”导出完整学习备份。

导入课程不清空词条、原始听写答案、错题、写作记录、每日任务、复习进度或口语草稿，不会把阅读自动标为练习通过。旧标签页保存时同时保留其他标签刚导入的课程和配套资料；双方同时修改同一资料时停止覆盖。格式错误或存储空间不足时停止导入，保留原记录。

私人作文与课程资料不加入公共仓库。当前网址和原学习数据键保持不变；本机网址与线上网址的数据分别保存在各自浏览器存储中。课程包仅包含正文和配套资料，不是完整学习进度备份。录音仍位于 `wordly_audio_v1`，不包含在 JSON 学习备份或课程包中，需要单独下载。

## 文件与验证

- `assets/writing-coach.js`：完整课程校验、安全展示、文件导入导出、配套复习及跨标签课程资料保护。
- `assets/writing-coach.css`：课程目录、正文、表格及移动布局。
- `index.html`：导航、原数据库接入、原子保存、旧备份兼容。
- `assets/study-dashboard.js`：写作主页入口。
- `scripts/version-study-library.mjs`：课程及原资料模块缓存版本。
- `tests/writing-coach.test.cjs`、`tests/storage-preservation.test.cjs`、`tests/study-dashboard.test.cjs`：格式、重复导入、回滚、学习数据保留及导航回归。
- `scripts/verify-writing-coach.cjs`：独立 Edge 浏览器验证，支持本机与线上地址。只使用临时浏览器，不访问真实浏览器学习数据。

仓库运行：

```powershell
node --test tests/*.test.cjs
node scripts/build-github-pages.mjs
python -m http.server 43143 --directory site-pages --bind 127.0.0.1
```

打开 `http://127.0.0.1:43143/#writing-coach`，手动导入课程包即可测试。构建输出 `site-pages/`，公开部署不包含 `private-study/`。

浏览器验证环境变量：

```powershell
$env:WORDLY_COACH_URL='http://127.0.0.1:43143'
$env:WORDLY_COACH_PACK='完整教练包的绝对路径'
$env:WORDLY_PLAYWRIGHT_MODULE='playwright 模块的绝对路径' # 已安装时可省略
node scripts/verify-writing-coach.cjs
```

GitHub Pages 沿用 `.github/workflows/pages.yml`：推送 `main` 后先运行全套测试和静态构建，再发布 `site-pages`，资源使用 `/wordly/` 下的相对路径。
