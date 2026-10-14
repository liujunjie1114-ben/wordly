# Wordly 维护约定

- 保持静态 HTML、CSS、原生 JavaScript 结构。生产地址继续使用现有 GitHub Pages 与 Vercel 项目。
- 每次更新必须保留学习数据。不得为了发布、换版、初始化或界面修改而清空 localStorage / IndexedDB。
- 学习数据键保持 `wordly_app_v1`；录音数据库保持 `wordly_audio_v1`。不得换键后把旧数据留在无法读取的位置。
- 保留用户词条、首次听写原答案、听写日志、错词、记忆打字次数、复习到期时间、每日任务、日历、写作/词汇页进度、口语草稿与录音。
- 初始化词库必须幂等，不得覆盖已有掌握程度和用户编辑的例句。需要迁移结构时，先保留旧数据，做可恢复的增量迁移并测试；不能把读取错误静默当作空库再覆盖原记录。
- 新部署仍使用原网址。换域名、浏览器或设备不会自动同步本地数据；学习备份不包含录音，不能声称会自动迁移录音。
- 发布前运行 `node --test tests/*.test.cjs` 和 `node scripts/build-github-pages.mjs`。涉及学习数据时，保留并扩展 `tests/storage-preservation.test.cjs`。
- 修改听力外部资源文件后，运行 `node scripts/version-listening-assets.mjs` 更新缓存版本。
- 口语整理与未完成稿保存在原学习数据库的 `speaking.materials` 与 `speaking.materialDraft`；旧备份缺少这些字段时使用空默认值，不改动其他学习记录。新增个人整理不得上传到公共仓库。
- 修改口语整理模块或内置课程页后，运行 `node scripts/version-speaking-library.mjs`，让模块和内嵌课程页使用同一新缓存版本。
- 仅在此仓库提交与推送，不要修改父目录中的其他 Git 项目。推送 main 自动发布到现有两处站点。
- 课堂诊断叠加在原口语资料上，不重写 2026-10-07 PDF 快照、稳定题目 ID 或用户私人版本。推荐例子不得写成未经确认的个人经历。
- 题干与证据自查保存在 `speaking.coachReview`，按题目及版本分别记录；计时草稿和复盘的八项新自查使用 `coachChecks`，不占用原来的六项 `checks`。旧备份默认空状态，恢复、更新均保留已有记录。
- 修改课堂意见原文后运行 `node scripts/build-speaking-coach.mjs`，再执行口语缓存版本、测试和静态构建。
- 单词音频预载和缓存位于 `assets/word-audio.js` 与 `audio-worker.js`；缓存仅限散列命名的 MP3，不得扩展为缓存 HTML、用户学习数据或录音。修改音频模块后更新 index 中的模块缓存版本，GitHub Pages 必须保留根目录 worker。
- 内置语音使用 Kokoro-82M / bf_emma，本机生成工具为 `scripts/generate-neural-audio.py`，纠正词在 `scripts/pronunciation-overrides.json`；必须完整生成、核对音素和文件散列后运行 `scripts/install-neural-audio.mjs`。新音频使用新散列文件名，禁止覆盖旧散列文件或清理学习数据来刷新音频。未收录文本和备用设备朗读须如实标明，不能声称所有读音均已人工审校。详见 `docs/neural-audio.md`。
- 老师每日单词任务定义在 `assets/teacher-word-tasks.js`，只发布日期、范围和已导入词项ID，不发布私人词库或答题记录。新日期追加，不替换旧任务ID。答案、首次尝试与复测历史保存在原数据库的 `wordTasks`，随完整备份保留；不自动改动30天计划、旧听写和熟练度。修改模块或任务定义后运行 `node scripts/version-word-tasks.mjs`。
- 知识点阅读、熟悉程度、检测历史/草稿保存在 `knowledge.learning`，列表筛选及上次位置在 `knowledge.libraryView`；打开只计看过，提交练习才计练过，自评熟悉不代表自动过关。大库用 `studyLearningData` 无损分离压缩元数据，读取时复原到原知识库。自动题在 `assets/knowledge-checks.js`，改题需递增版本、保留旧成绩快照；未配题和待核对内容不得冒充过关。修改后运行 `node scripts/version-study-library.mjs`，验证备份、重复导入及旧学习记录保留；私人答案不得发布到仓库。

- 大库练习快捷保存只用于 updateWordProgress / checkMemoryTyping；先核对 load.lastRaw 后调用 writeProgressDb。新增其他可变字段不得误用此路径，必须保留完整保存。studyWordProgress / studyWordProgressChanges 是同键内的存储格式，完整备份必须还原到词条字段；修改需验证旧格式、损坏保护、多次练习及备份。内置音频不自动回退设备声音。
- 每日任务先学词表为只读浏览，不得自动计正确、熟练或复习完成。来源书架按当前浏览器knowledge.entries.sources分组；原Word/PDF文件及私人文本不得因增加导航公开上传。来源筛选在knowledge.libraryView.source中可选保存，旧备份默认全库；同名不同路径文件必须区分。修改后运行两套任务/资料版本脚本并检查旧记录保留。
