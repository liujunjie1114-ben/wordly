# 内置英语发音维护

2026-10-13 起，内置公开词汇和已收录例句的音频改为 Kokoro-82M v1.0 / bf_emma 英式神经语音。替换此前的 Piper cori-medium 音频，保持静态网站，不增加收费接口、账号或云端学习数据库。

## 生成与发布

生成工具只读取 `index.html` 中公开的 `WANG807` 和 `AUDIO_PACK`，不读取 localStorage、IndexedDB、私人资料包或学习备份。模型在维护者的本机运行，访客只下载 MP3，不下载模型。以自然速度生成，听写普通播放使用 1 倍速；慢读入口仍保留。

使用独立 Python 3.12 环境，安装 `kokoro==0.9.4`、`misaki[en]==0.9.4`、`soundfile`、`lameenc`。按照模型官方说明安装英语转换所需资源；GPU 可选。Windows 的 espeak DLL 如果不能读取中文目录，可把它的数据目录复制到专用 ASCII 工具路径，用 `--espeak-data` 指定，不需要修改全局系统设置。

```powershell
python scripts/generate-neural-audio.py --output C:/wordly-build
# 可先增加 --limit 6 生成样本。正式发布必须完整生成。
# 将官方 https://raw.githubusercontent.com/hexgrad/kokoro/main/LICENSE
# 保存为 C:/wordly-build/kokoro-LICENSE.txt。
node scripts/install-neural-audio.mjs C:/wordly-build
node --test tests/*.test.cjs
node scripts/build-github-pages.mjs
git diff --check
```

生成过程使用日志恢复已完成的内容；输入文本、音素规则、语音或版本变动时，通过 inputHash 重新生成该词。安装脚本在完整性、旧条目覆盖、散列和许可检查通过之后才更新映射。旧 MP3 保留供回滚，当前页面不再引用旧读音。

## 发音纠正

`scripts/pronunciation-overrides.json` 保存反馈词的英式 IPA、Kokoro/Misaki 音素和来源。规则同时应用到单词和包含该词的内置例句，并采用完整单词边界，避免误改其他派生词。

- archaeological：依据 [Cambridge Dictionary](https://dictionary.cambridge.org/dictionary/english/archaeological) 核对英式音节与重音。
- environment：依据 [Cambridge pronunciation](https://dictionary.cambridge.org/pronunciation/english/environment) 核对英式读法。英语存在合法弱化与口音差异，不把这些差异自动判为错误。

IPA 与模型输入符号不同；转换依据 [Misaki 英语音素说明](https://github.com/hexgrad/misaki/blob/main/EN_PHONES.md)。新音频仍是合成参考，不能把模型更换、自动语音识别通过或 HTTP 200 等同于逐词由真人审校。多音词需要核对具体词性和语境。后续反馈应追加纠正规则后重新生成，不能直接覆盖散列命名的旧文件。

## 播放、缓存与数据

`assets/neural-audio-manifest.json` 记录每段公开音频的文本、音素、使用的规则、时长、输入和文件 SHA-256。实际页面继续用 `AUDIO_PACK` 定位资源，无需额外请求清单。`assets/kokoro-LICENSE.txt` 保留 Apache-2.0 许可，模型来源见 [官方模型卡](https://huggingface.co/hexgrad/Kokoro-82M)。

MP3 文件名使用文件 SHA-256 的前 24 位。现有 `assets/word-audio.js` 预载当前及后续三条；`audio-worker.js` 只缓存同站散列命名音频，最多 120 条，不缓存 HTML、学习数据库或录音。无需清理浏览器数据即可换用新读音。

未收录的自定义词汇、修改后的个人例句，以及内置音频请求失败后的备用朗读，仍使用设备英语语音，并在状态提示中标明。设备语音不保证所有浏览器一致。

学习键 `wordly_app_v1`、录音库 `wordly_audio_v1`、词条 ID、个人文本、首次答案、复习到期时间及所有学习记录均保持不变。继续推送同一仓库 main，发布到原 GitHub Pages 与 Vercel 项目；不要为了语音换版改变域名或重置数据库。
