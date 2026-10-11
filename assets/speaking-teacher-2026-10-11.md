# IELTS Speaking Website Update Spec — 2026-10-11

> 课程主题：Part 2 串题逻辑、论证有效性、题干识别、素材修正  
> 用途：直接作为网站内容更新与后续开发依据  
> 状态：本节课后需要执行的版本

---

# 1. 本节课的核心结论

这节课最重要的不是继续增加新的 Part 2 故事，而是提高现有素材的 **题目匹配度、论证有效性和可变形能力**。

网站后续不能只做“题目 → 一篇固定答案”的模式，而应该升级成：

**题目关键词 → 选择答题逻辑 → 调用故事素材 → 调整论证重点 → 补充专业细节 → 输出对应版本**

核心原则：

> 同一个故事可以串多个题，但不能只改开头。  
> 每换一道题，必须重新调整中心、证据和结尾。

---

# 2. Part 2 的两种核心答题逻辑

## 2.1 时间线 / Storyline

适合有明显事件发展的经历类题目。

结构：

1. Background
2. Beginning
3. Development
4. Turning point
5. Ending
6. Feeling / Lesson

适用题型：

- sports event
- journey / trip
- learning a skill
- changed a decision
- difficult experience
- memorable experience

网站应增加标签：

`[Storyline]`

并显示固定提示：

> 一开始发生了什么？  
> 接下来发生了什么？  
> 中间有没有转折？  
> 最后结果如何？  
> 你的感受或收获是什么？

---

## 2.2 因果逻辑 / Claim → Evidence

适合 Why 很重、评价性强的题目。

结构：

1. Main claim
2. Reason 1
3. Evidence / Example
4. Reason 2
5. Evidence / Example
6. Conclusion

适用题型：

- a movie you dislike
- a place you recommend
- a place you want to visit again
- something you like / dislike
- why-based questions

网站应增加标签：

`[Claim–Evidence]`

核心提示：

> 不要先讲完全部故事再补一句“所以我喜欢/不喜欢”。  
> 先说观点，再用细节证明观点。

---

# 3. 网站需要增加的“论证有效性”检查

每一个 Part 2 素材都增加下面四项：

### Q1. 题目真正要求证明什么？
例如：

- successful → 证明“成功”
- responsible → 证明“负责”
- special → 证明“特殊”
- difficult → 证明“做的事情很难”
- would like to work → 证明“未来想做”，不是“已经在做”

### Q2. 当前故事中的细节是否直接服务主题？

如果只是相关，但不能证明主题，应标记：

`⚠ Weak Evidence`

### Q3. 是否加入至少 1–2 个具体细节？

建议包含：

- 专业词
- 具体动作
- 具体场景
- 具体结果

### Q4. 是否存在“套旧答案”的风险？

如果题目只改了一个关键词，但旧故事中心没有调整，应标记：

`⚠ Retarget Required`

---

# 4. 今日重点题：Describe an experience of watching a sports event

## 当前故事

羽毛球单打比赛。

### 故事主线

- 喜欢一名选手
- 去看比赛
- 第一局状态很差
- 第一局快速输掉
- 第二局仍然落后
- 对手接近 match point
- 教练进行调整
- 选手稳定情绪
- 改变 tactics
- 逐渐追分
- 双方 neck and neck
- 最终 comeback
- 全场 erupted
- 学到 resilience / never give up

## 推荐专业词

- singles match
- match point
- tactics
- defense
- aggressive attacking style
- cross-court smash
- lift
- net kill
- elite player
- neck and neck
- arena
- the whole arena erupted
- on the edge of my seat
- sportsmanship
- resilience
- mental strength
- make an incredible comeback

## 网站提醒

不要写：

`round 1 / round 2`

优先写：

`the first game / the second game`

不要写：

`single match`

优先写：

`singles match`

---

# 5. 当前故事库诊断

## 5.1 Boring Place — 图书馆

### 当前素材
图书馆很安静、不能讲话、只能学习，所以很无聊。

### 诊断
**不建议继续使用。**

问题：

图书馆本身就是学习场所。  
“不能聊天”“很安静”属于正常功能，不足以证明它是一个“不合理的 boring place”。

### 网站状态
`Critical — Replace Story`

### 修改建议
换成真正缺乏内容和体验的地方，例如：

- 空荡的商业楼
- 没有任何娱乐设施的场所
- 很偏僻、没有活动内容的地方

---

## 5.2 Tall Building

### 原素材
学校图书馆 / 教学楼。

### 诊断
“压抑、只能学习”与“tall building”本身关联太弱。

### 推荐新素材
大型 shopping mall。

### 可证明“喜欢”的细节

- seven floors
- restaurants
- cinema
- shops
- entertainment
- rooftop
- city view at night

### 网站状态
`Important — Replace Recommended`

---

## 5.3 Changed a Decision

### 原问题
试图与 important decision 强行串联。

### 诊断
不需要每个决定都很重大。

### 推荐素材

- recently started running
- stopped staying up late
- changed a daily habit
- changed a study plan

### 网站状态
`Important — Simplify`

---

## 5.4 Local News

### 当前素材
附近新开 community centre。

### 诊断
可用。

### 应补充

- newly opened / newly built
- library
- gym
- community activities
- free opening events
- one-month free access
- local residents are interested

### 网站状态
`Good — Expand Details`

---

## 5.5 Medical Field

### 关键风险
题目版本不同。

#### Version A
`who would like to choose a career in the medical field`

代表：

> 现在还不是医生，只是未来想从医。

推荐素材：

- 正在学医的朋友
- 医学学习困难
- 想帮助医疗资源不足的人
- make a contribution

#### Version B
`who works in the medical field`

才适合：

- 已经工作的医生
- 医院经历
- 对病人的态度

### 网站状态
`Critical — Wording Sensitive`

网站应显示：

> ⚠ Check tense and status before answering.

---

## 5.6 Successful Business Person

### 当前素材
开餐厅的叔叔。

### 问题
原答案中过多强调：

- 厨艺好
- 人很好
- 帮助别人
- 我能吃好吃的

这些不能直接证明“successful”。

### 应强化成功证据

- busy every day
- many regular customers
- positive reviews
- first restaurant became successful
- opened a second branch
- second branch also became popular

### 不同题目的重心

#### successful business person
重点：商业结果

#### responsible person
重点：食材、卫生、员工、顾客、质量

#### person you admire
重点：人格、工作态度、对你的影响

### 网站状态
`Important — Retarget by Topic`

---

## 5.7 Interview

### Version A
`Describe a time you interviewed someone`

重点：

- 你是 interviewer
- 你问问题
- 你紧张
- 对方友好
- 得到专业建议

### Version B
`Describe a time you watched a famous person being interviewed`

重点：

- 你是 viewer
- 别人在采访
- 你观察回答内容
- 你从采访中得到启发

### 网站状态
`Critical — Role Sensitive`

---

## 5.8 Important Decision

### 当前素材
是否参加暑校。

### 逻辑
原计划：

- 学英语
- 做自己的事情

后来：

- 暑校更有利于专业规划
- 选择参加暑校
- 学到很多
- 对结果满意

### 网站状态
`Good — Keep`

---

## 5.9 Person Who Did Something Difficult

### 当前素材
Miss Zhang 创业。

### 关键修改
不能只说：

> 她遇到了很多困难。

应该说：

> 她具体做了什么困难的事情。

可加入：

- started with a small team
- dealt with business pressure
- collected feedback
- changed the design repeatedly
- solved practical problems
- gradually built the company

### 网站状态
`Important — Focus on Action`

---

## 5.10 Organized / Tidy Person

### 当前素材
姐姐。

### 可保留内容

- very organized
- keeps the house tidy
- makes daily plans
- prioritizes tasks
- finishes work on time
- efficient

### 网站状态
`Good — Keep`

---

## 5.11 Noisy Place

### 当前素材
长沙五一广场。

### 可保留内容

- shopping area
- crowded
- traffic
- advertisements
- music
- tourists
- very noisy

### 网站状态
`Good — Keep`

---

## 5.12 Natural Place

### 当前素材
岳麓山。

### 可保留内容

- near university area
- easy to reach
- childhood memories
- used to go with parents
- now go with friends
- hiking
- camping
- night view
- personal meaning

### 网站状态
`Good — Keep`

---

## 5.13 Swimming

这是一组非常适合串题的素材。

### Topic A — A Skill You Learned

中心：

> 我怎么学会游泳。

细节：

- hold my breath
- kicking
- arm movements
- breathing
- freestyle
- repeated practice

### Topic B — A Person Who Taught You a Skill

中心：

> 对方怎么教我。

细节：

- demonstrated first
- broke the movement into steps
- corrected my kicking
- taught me breathing
- encouraged me

### 网站状态
`Good — Excellent Example of Retargeting`

---

## 5.14 Save Money to Buy Something Special

### 高风险点

`special ≠ expensive`

“很多学生买不起”只能证明贵，不能证明特殊。

### special 应该证明什么？

例如：

- special material
- special craftsmanship
- emotional value
- unusual design
- special function

### 老师示例

一个杯子：

- 汝窑 / 特殊烧制方式
- 感温涂层
- 倒入热水会变色
- 出现山水图案

### 网站状态
`Critical — Concept Distinction`

---

# 6. 网站建议新增的状态系统

每一个故事增加状态标签：

- `Good — Keep`
- `Good — Expand Details`
- `Important — Retarget`
- `Important — Simplify`
- `Important — Replace Recommended`
- `Critical — Replace Story`
- `Critical — Wording Sensitive`
- `Critical — Role Sensitive`
- `Critical — Concept Distinction`

这样用户复习时，不只是看到“有没有学过”，还可以知道：

> 这个故事现在能不能直接上考场。

---

# 7. 建议新增“题干关键词”模块

网站每道题顶部显示：

## Keyword Focus

例如：

### successful business person

关键词：

`successful`

网站提示：

> 你的主要细节必须证明商业上的成功，而不是只证明这个人很好。

### something special

关键词：

`special`

提示：

> expensive 不等于 special。

### would like to choose a career

关键词：

`would like to`

提示：

> 对方未来想做，但现在还不是该职业。

### watched a famous person being interviewed

关键词：

`watched`

提示：

> 你不是 interviewer。

---

# 8. 建议增加“故事复用地图”

示例：

## Swimming Story

可串：

- a skill you learned
- a person who taught you a skill

但网站必须显示：

| 题目 | 中心 |
|---|---|
| Skill | How I learned |
| Person | How the person taught me |

---

## Restaurant Uncle Story

可串：

- successful business person
- responsible person
- person you admire

| 题目 | 中心 |
|---|---|
| Successful | Business results |
| Responsible | Quality + responsibility |
| Admire | Personality + influence |

---

## Miss Zhang Story

可串：

- person who did something difficult
- person you admire
- interview-related topics

但需要根据：

- role
- tense
- topic keyword

重新组织。

---

# 9. 建议增加“答案生成检查清单”

每次用户练完一题，网站自动显示：

- [ ] 我是否真正回答了题目的关键词？
- [ ] 我的故事逻辑是 Storyline 还是 Claim–Evidence？
- [ ] 是否出现至少一个具体场景？
- [ ] 是否出现 1–2 个专业词？
- [ ] 是否出现一个明确的转折或原因？
- [ ] 我的结尾是否回到题目？
- [ ] 有没有把旧题答案直接搬过来？
- [ ] 时态、角色、题目条件是否正确？

---

# 10. 本次课后任务优先级

## P0 — 必须立刻修改

1. 替换 `Boring Place — Library`
2. 检查 `Medical Field` 两个版本
3. 检查 `Interview` 的 interviewer / viewer
4. 修正 `Something Special`：special ≠ expensive

## P1 — 重点优化

5. Tall Building 改为 shopping mall
6. Successful Business Person 加成功证据
7. Difficult Person 强化“做了什么”
8. Sports Event 加专业细节

## P2 — 可以继续保留

9. Important Decision — Summer School
10. Organized Person — Sister
11. Noisy Place — Wuyi Square
12. Natural Place — Yuelu Mountain
13. Swimming Story

---

# 11. 网站下一版本建议结构

## Dashboard

显示：

- Total Stories
- Ready for Exam
- Need Retargeting
- Critical Issues
- Today’s Review

---

## Story Library

每个故事显示：

- Story Name
- Topics it can cover
- Logic Type
- Status
- Core Vocabulary
- Main Evidence
- Retarget Notes

---

## Question Page

顺序建议：

1. IELTS Question
2. Keyword Focus
3. Logic Type
4. Recommended Story
5. Retarget Instructions
6. Vocabulary
7. Story Outline
8. Full Answer
9. Self-check
10. Teacher Notes

---

# 12. 下一节课预告

下一节开始进入：

# Part 3

老师计划先讲：

**五种主要 Part 3 题型 + 对应答题公式**

网站后续建议新增：

`Part 3 Framework`

并为每一类题建立：

- Question Type
- Answer Formula
- Linking Phrases
- Common Errors
- Sample Answer
- Practice Mode

---

# 13. 最终结论

当前网站最需要从：

> “保存答案的网站”

升级为：

> **“帮助判断题目 → 调整故事 → 检查论证 → 训练输出”的系统。**

本节课暴露出的核心问题不是故事数量不足，而是：

1. 题目关键词识别不够严格
2. 串题时论证中心没有完全转换
3. 专业细节不足
4. 题干 wording 改动后容易继续套旧答案
5. 缺少“这个故事现在是否真的可上考场”的状态判断

后续网站修改应围绕这五点展开。
