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
