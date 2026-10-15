(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.WordlySpeakingCoachData=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const v=(id,title,focus,evidence,outline,notes=[],frame='')=>({id,title,focus,evidence,outline,notes,frame});
  const p=(severity,status,logic,diagnosis,confirmed,suggestions,pending,vocabulary,variants)=>({severity,status,logic,diagnosis,confirmed,suggestions,pending,vocabulary,variants});
  const profiles={
    'P2-LIBRARY-BORING':p('important','Showroom 新版 · 待复练','claim','2026-10-15 已按要求换成家具展厅：用展品重复、缺少参与和等待场景解释无聊。新版是口语练习稿，尚未经老师复审。',[],['按下方英文、中文和六段记忆版本练习；先记故事路线，再用关键词复述。'],['时间、地点、同行者及购物细节按真实经历替换；不要把练习情境直接当成已确认的个人经历。'],['furniture showroom','compare prices and materials','nothing new to explore','be involved in choosing','different shades of grey',"couldn’t tell them apart"],[v('showroom-20261015','Describe a boring place','说明你在家具展厅的体验为什么无聊。',['逛完后展品重复，没有新内容可探索','没有参与挑选，只能坐着等待','不停看手机，以为很久却只过了五分钟'],['家乡家具展厅，与父母买沙发','学设计，起初有兴趣','父母比较价格材质，自己逛完坐着等','原因一：家具相似，缺少新鲜感','原因二：没有参与，分不清灰色','看时间才过五分钟，回扣无聊'],['此版本由本次对话选定，尚未获得老师复审。','原图书馆稿只保留在下方历史资料中。'])]),
    'P2-LIBRARY-HIGHRISE':p('important','Important — Replace Recommended','claim','“只能学习、很压抑”与 tall building 的关联太弱。建议换成能描述楼层、空间和体验的建筑。',[],['大型 shopping mall；seven floors、restaurants、cinema、shops、entertainment、rooftop、city view at night。'],['商城名称、是否七层、屋顶是否开放、夜景是否亲眼见过，都需用真实经历确认。'],['shopping mall','seven floors','rooftop','city view at night'],[v('mall','Describe a tall building you like or dislike','先说明喜欢或不喜欢，再用建筑空间与体验证明。',['楼层和空间布局','餐饮、影院与商店怎样方便你','若真实体验过，补充屋顶和夜景'],['定位建筑','表达态度','理由一：空间和设施','具体使用场景','理由二：体验或景观','总结态度'],['Retarget Required：不能沿用图书馆无聊的中心。'])]),
    'P2-CHANGED-DECISION':p('important','Important — Simplify','storyline','不必强行串“重要决定”。重点是原决定、改变原因和新决定的差异。',[],['最近开始跑步、停止熬夜、改变日常习惯或学习计划。'],['选择真正改变过的一件小事；确认改变前后的行为和结果。'],['change my mind','reconsider','daily habit','study plan'],[v('habit','Describe a time when you changed a decision','证明决定确实发生了改变。',['原来准备怎么做','什么让你改变想法','后来实际怎么做、结果如何'],['原计划','开始行动','遇到问题','改变原因','新的选择和结果','感受与收获'])]),
    'P2-LOCALNEWS-COMMUNITY':p('good','Good — Expand Details','claim','社区中心故事可用；围绕为什么本地居民感兴趣补充具体设施和活动。',['附近新开社区中心；姐姐告诉你；图书馆、健身房和共享活动空间。'],['newly opened / newly built、community activities、free opening events、one-month free access。'],['免费开幕活动和一个月免费体验属于建议细节，确认真实存在后才写进答案。'],['newly opened','local residents','community activities','free opening events','one-month free access'],[v('news','Describe a piece of local news that people were interested in','证明这则新闻与居民日常生活有关。',['图书馆和健身房满足什么需求','社区活动如何方便居民','若确认属实，再讲免费开放活动'],['直接说明新闻','交代获知方式','介绍已知设施','解释居民需求','补充真实活动细节','说明社区影响'])]),
    'P2-MEDICAL-UNCLE':p('critical','Critical — Wording Sensitive','claim','would like to choose a career 指未来想从医；works in the medical field 才能用已经工作的医生。回答前检查时态和身份。',['旧资料保留的是在医院工作的医生叔叔。'],['未来版本可以选正在学医的真实朋友，说明学医困难、服务医疗资源不足的人和 make a contribution。'],['未来版本的人物、学习状态和动机尚需真实补充；不能把叔叔直接改写成医学生。'],['medical field','medical student','limited access to medical care','make a contribution'],[
      v('working','Describe a person you know who works in the medical field','证明对方现在从事医疗工作。',['真实工作和医院经历','耐心对待病人的具体行动','对你的影响'],['说明已工作的身份','关系和认识时间','真实工作场景','对病人的具体行动','你的评价','回扣医疗工作'],['Check tense and status before answering.']),
      v('future','Describe someone who would like to choose a career in the medical field','证明对方未来想从医，不能说已经是医生。',['真实学习状态','为什么想帮助病人','面对学医困难如何准备'],['说明人物和当前状态','未来职业目标','学习或准备过程','具体动机与例子','面临的困难','回扣未来愿望'],['当前状态用现在时，职业意愿用 would like to / hopes to。'],'[Person] is currently [real status] and would like to become [career]. One reason is [real motivation]. For example, [confirmed detail].')
    ]),
    'P2-BUSINESS-UNCLE':p('important','Important — Retarget by Topic','claim','厨艺好、人很好、能免费吃饭不能直接证明商业成功。每换题必须重选证据和结尾。',['叔叔经营餐厅；重视食材质量、顾客需求，已有回头客素材。'],['成功版本可核实 busy every day、many regular customers、positive reviews、opened a second branch。'],['每天忙碌、好评、第一家店的经营结果、是否开了第二家及其表现，都需要核实。'],['regular customers','positive reviews','second branch','food quality','take responsibility'],[
      v('successful','Describe a successful business person you know','successful：重点是商业结果。',['真实顾客量和回头客','可核实的评价或经营结果','仅在属实时使用分店结果'],['定位经营者','提出成功判断','经营结果一','具体例子','经营结果二及原因','回到商业成功'],['Weak Evidence：善良和厨艺只相关，不能替代成功证据。']),
      v('responsible','Describe a responsible person you know','responsible：重点是质量和责任。',['食材新鲜与卫生','如何照顾员工','如何处理顾客问题'],['定位人物','提出负责的判断','食材和质量行为','具体顾客问题','对员工的责任','解释责任心'],['不要只用营业额证明负责。']),
      v('admire','Describe a person you admire','admire：重点是人格、工作态度和对你的影响。',['你欣赏的具体工作态度','一个真实行为','这怎样影响你的选择'],['定位人物','说清欣赏的品质','具体行为','为什么触动你','对你的影响','回扣敬佩'],['不要只换开头，保留原来的商业结果结尾。'])
    ]),
    'P2-INTERVIEW-ZHANG':p('critical','Critical — Role Sensitive','storyline','interviewed someone 中你是采访者；watched someone being interviewed 中你是观众。角色不能互换。',['旧故事是你在设计暑校采访工业设计师，紧张后逐渐放松，得到专业建议。'],['观众版本应描述观看渠道、他人的提问、受访者回答和你得到的启发。'],['观看采访版本的真实节目、人物、时间及回答尚需补充。'],['interviewer','viewer','being interviewed','professional advice','design inspiration'],[
      v('interviewer','Describe a time you interviewed someone','你问问题，描述采访过程和所得。',['你提出的专业问题','紧张到放松的变化','对方给出的具体建议'],['介绍受访者','采访场合','你为何紧张','你问了什么','得到的回答和建议','感受与启发'],['你是 interviewer。']),
      v('viewer','Describe a time you watched a famous person being interviewed','你观看别人采访，描述观察到的回答。',['通过什么渠道观看','主持人问了什么','受访者的回答如何启发你'],['介绍观看对象','时间和渠道','采访主题','具体问答','你的观察','所得启发'],['你是 viewer；不要沿用 I asked him…。'],'I watched [person] being interviewed on [real channel]. The interviewer asked about [topic]. What stayed with me was [actual answer], because [reason].')
    ]),
    'P2-DECISION-SUMMERSCHOOL':p('good','Good — Keep','storyline','暑校决定可以保留。用原计划与专业规划的取舍，解释为什么满意。',['选择参加设计暑校，学习专业内容，对结果满意。'],['补充原计划学英语或做自己的事情，以及暑校更有利于专业规划的比较。'],['原暑假计划和比较过程用自己的真实情况确认。'],['original plan','professional development','valuable advice','internship opportunity'],[v('decision','Describe an important decision you made and were happy with','证明这次选择为什么值得、为什么满意。',['原计划与暑校的取舍','对专业规划的具体帮助','已有学习成果'],['原计划','犹豫和比较','决定参加','暑校经历','具体收获','满意的原因'])]),
    'P2-DIFFICULT-SUCCESS-ZHANG':p('important','Important — Focus on Action','storyline','不能只说遇到很多困难，要说明具体做了什么难事、采取什么行动和结果。',['设计师从小团队开始创业，面对客户少和商业压力，听取反馈并积累声誉。'],['collected feedback、changed the design repeatedly、solved practical problems、gradually built the company。'],['本次笔记用 Miss Zhang，旧资料用 Mr Zhang；姓名称谓与代词需确认，不自动改写。新增行动细节也需核实。'],['small team','business pressure','collect feedback','change the design repeatedly','solve practical problems'],[v('difficult','Describe a person who did something difficult and was successful','difficult：证明做的事情有难度，再给行动和结果。',['任务为什么难','如何收集反馈并反复修改','怎样逐步建立公司'],['说明人物和任务','困难的具体来源','第一次尝试','调整与行动','最终结果','你的评价'],['不要把全部篇幅用来介绍你如何认识对方。'])]),
    'P2-ORGANIZED-SISTER':p('good','Good — Keep','claim','姐姐的素材可保留，用日常行动证明有条理和高效率。',['列计划、关注截止日期、保持整洁、为第二天做准备。'],['prioritizes tasks、finishes work on time、efficient。'],['如补充新例子，请用姐姐的真实行动。'],['organized','tidy','daily plans','prioritize tasks','efficient'],[v('organized','Describe a person who is very organized','证明做事有条理，而不只是房间干净。',['计划与优先级','按时完成任务','节约时间和减少压力'],['提出有条理的判断','日常计划','具体工作例子','整洁和准备','带来的效果','你的评价'])]),
    'P2-NOISY-WUYI':p('good','Good — Keep','claim','五一广场素材可以保留，用具体声音来源和场景证明 noisy。',['长沙五一广场；购物、游客、交通和商店音乐带来噪音。'],['补充你实际听到的广告、音乐、人群和交通声音。'],['声音细节应来自自己的经历。'],['shopping area','crowded','traffic','advertisements','tourists'],[v('noisy','Describe a noisy place you have been to','证明这个地方怎样吵闹，以及你的感受。',['具体声音来源','你当时所在的场景','噪音与热闹氛围的关系'],['定位地点','交代去的场合','声音来源一','具体场景','声音来源二','个人感受'])]),
    'P2-NATURE-YUELU':p('good','Good — Keep','claim','岳麓山素材可保留，把景观、方便到达和个人记忆连接到喜欢的原因。',['大学区附近、容易到达、从小和父母去、现在与朋友去、徒步和夜景。'],['可补充真实的 hiking、camping 与 personal meaning。'],['露营、夜景和具体地点只讲确实经历过的部分。'],['near the university area','easy to reach','hiking','camping','personal meaning'],[v('nature','Describe a natural place you like','证明喜欢这处自然地点的具体原因。',['可到达性和景观','父母与朋友的真实记忆','这些经历对你的意义'],['定位自然地点','喜欢的原因一','真实活动','喜欢的原因二','个人记忆','回扣个人意义'])]),
    'P2-SWIMMING-SKILL':p('good','Good — Excellent Example of Retargeting','storyline','同样的游泳故事，技能题讲“我如何学会”，人物题讲“对方如何教我”。',['小时候怕水，朋友耐心帮助，练习手脚配合和呼吸，最终能自己游。'],['技能：hold my breath、kicking、arm movements、breathing、freestyle；人物：demonstrated first、broke the movement into steps、corrected my kicking、encouraged me。'],['自由泳泳姿、具体纠正动作等新细节需确认真实发生。'],['hold my breath','kicking','arm movements','breathing','freestyle','demonstrated first'],[
      v('skill','Describe a skill you learned','How I learned：中心是我的学习过程。',['最初不会的动作','练习呼吸和手脚配合','反复练习后的变化'],['不会与害怕','开始学习','动作和呼吸困难','练习中的转折','终于独立完成','我的收获']),
      v('teacher','Describe a person who taught you a skill','How the person taught me：中心是对方的教学行动。',['先示范再分解动作','纠正踢腿和呼吸','如何耐心鼓励你'],['介绍教你的人','你面临的困难','对方如何示范','怎样拆解和纠正','鼓励和学习结果','你为何感激'],['Retarget Required：不要只把 skill 改成 person。'])
    ]),
    'P2-SAVED-MOTORCYCLE':p('critical','Critical — Concept Distinction','claim','special ≠ expensive。买不起只能证明贵；特殊要靠材料、工艺、情感价值、设计或功能。',['旧故事是存钱购买实用的二手摩托车。'],['特殊物品可从 special material、craftsmanship、emotional value、unusual design、special function 选证据。'],['老师的汝窑／感温变色山水杯只是示例，不是你的购买经历。摩托车是否特殊需要补充真实证据。'],['special material','craftsmanship','emotional value','unusual design','special function'],[
      v('wanted','Describe a time you saved money to buy something you wanted','wanted：说明想买、存钱和购买结果。',['实际需要','怎样节省和选择二手商品','购买后的作用'],['购买动机','资金限制','存钱或寻找方案','购买过程','实际作用','个人感受'],['原摩托车素材可以服务 wanted / useful，不等于 special。']),
      v('special','Describe a time you saved money to buy something special','special：证明这个物品有什么特殊价值。',['真实材料或工艺','独特设计或功能','个人情感意义'],['定位真实物品','说明特殊之处','具体设计或工艺证据','存钱与购买过程','情感或使用结果','回扣特殊价值'],['Weak Evidence：不能用 expensive 替代 special。'],'The item was special to me because [real feature or meaning], rather than simply because it was expensive. For example, [specific evidence].')
    ]),
    'P2-SPORTS-EVENT':p('important','Important — Expand Professional Details','storyline','本节新增羽毛球单打逆转故事。通过局势、调整和具体动作，让 resilience 有证据。',['羽毛球单打；喜欢的选手首局很快输掉，第二局仍落后；对手接近赛点，教练调整，选手稳住情绪、改变战术，追到势均力敌并逆转，全场欢呼。'],['可核实具体的防守、进攻或击球动作；不为了堆术语虚构比赛细节。'],['真实观看时间、地点、选手、同行者、现场或转播方式仍需填写。'],['singles match','match point','tactics','defense','aggressive attacking style','cross-court smash','lift','net kill','elite player','neck and neck','arena','the whole arena erupted','on the edge of my seat','sportsmanship','resilience','mental strength','make an incredible comeback'],[v('badminton','Describe an experience of watching a sports event','讲清比赛的转折与逆转，并用过程支撑收获。',['首局迅速失利、第二局落后','接近赛点时的情绪与战术调整','追分、逆转和全场反应'],['喜欢的选手与观看背景','首局状态差并输掉','第二局仍落后、对手接近赛点','教练调整、稳定情绪和改变战术','逐渐追分、neck and neck、comeback','全场欢呼与 resilience 的收获'],['the first game / the second game，不用 round 1 / round 2。','singles match，不用 single match。'],'I watched a badminton singles match [when / where / how]. The player I supported lost the first game quickly. In the second game, [confirmed match-point detail]. After [real adjustment], the player changed tactics and made an incredible comeback. [Describe the real crowd reaction.] This showed me [your own reflection].')])
  };
  // Current practice revision overlays the immutable 2026-10-07 source archive.
  profiles['P2-LIBRARY-BORING'].material={
    date:'2026-10-15',title:'无聊的地方 · 家具展厅',cluster:'SHOWROOM',clusterLabel:'家具展厅',
    keywords:'showroom / parents + new sofa / study design / compare + wait / similar + not involved / phone + five minutes',
    story:'陪父母买沙发 → 起初因学设计而感兴趣 → 逛完坐着等 → 家具相似 → 没有参与挑选 → 看手机才过五分钟。',
    tags:'家具展厅，showroom，无聊的地方，购物，记忆版本',
    related:'Boring place / Shopping experience（换题后重选中心与结尾）',
    answer:`I’d like to talk about a furniture showroom in a shopping centre in my hometown. I went there with my parents last summer because they wanted to buy a new sofa for our living room.

The showroom was quite large, with sofas, tables and beds arranged like rooms in a real home. At first, I enjoyed looking around because I study design, and some of the furniture looked quite nice.

However, after about twenty minutes, I started to get bored. My parents were comparing different sofas and asking the salesperson about prices and materials. I walked around, sat on a few chairs, and eventually stayed on one sofa while I waited for them.

There were two main reasons why I found the place boring. First, most of the displays looked very similar. Once I’d walked around the whole showroom, there was nothing new to explore. I would have enjoyed seeing how the furniture was made, but there were only finished products.

The second reason was that I wasn’t really involved in choosing the sofa. My parents were discussing small differences between several shades of grey, and I honestly couldn’t tell them apart. I remember checking the time on my phone and being surprised that only five minutes had passed.

So, although my parents found the visit useful, I felt there was very little for me to do. I wouldn’t choose to spend another afternoon there.`,
    answerZh:`我想讲的是我家乡一家购物中心里的家具展厅。去年夏天，我陪父母去那里，因为他们想给客厅买一张新沙发。

展厅挺大的，里面摆着各种沙发、桌子和床，有些区域还布置得像真正的房间。一开始，我还挺感兴趣的，因为我学设计，而且有些家具看起来确实不错。

但大约二十分钟后，我就开始觉得无聊了。父母一直在比较不同的沙发，还向销售人员询问价格和材质。我四处走走，试坐了几把椅子，最后就坐在一张沙发上等他们。

我觉得那里无聊，主要有两个原因。首先，大部分展品看起来都很相似。整个展厅逛完一圈后，就没有什么新东西可探索了。如果能看看这些家具是怎么制作的，我可能会更感兴趣，但那里只有成品。

其次，我也没怎么参与挑选。父母一直在讨论几种深浅不同的灰色，但我实在分不清它们的区别。我记得自己拿出手机看时间，惊讶地发现才过去五分钟。

所以，虽然父母觉得那次购物很有用，但对我来说，实在没什么可做的。我不想再在那里待一个下午了。`,
    memory:[
      {title:'① 去哪儿、跟谁',keywords:'hometown / parents / new sofa',en:'I’d like to talk about a furniture showroom in my hometown. I went there with my parents last summer because they wanted to buy a new sofa.',zh:'家乡的家具展厅；去年夏天陪父母买新沙发。'},
      {title:'② 最初印象',keywords:'large / study design / interested',en:'The showroom was quite large, with lots of sofas, tables and beds. At first, I enjoyed looking around because I study design.',zh:'展厅很大；因为学设计，一开始挺感兴趣。'},
      {title:'③ 做了什么',keywords:'prices / materials / sit and wait',en:'My parents were comparing prices and materials. I walked around, tried a few chairs, and eventually sat on a sofa to wait for them.',zh:'父母比较价格和材质；自己逛完，坐在沙发上等。'},
      {title:'④ 原因一',keywords:'similar / nothing new',en:'There were two main reasons why I found it boring. First, most of the furniture looked similar. After walking around the whole showroom, I had nothing new to explore.',zh:'家具相似，逛完一圈就没有新鲜内容。'},
      {title:'⑤ 原因二',keywords:'not involved / shades of grey',en:'Second, I wasn’t involved in choosing the sofa. My parents spent ages discussing different shades of grey, but I couldn’t tell them apart.',zh:'没有参与挑选；父母讨论不同灰色，自己分不清。'},
      {title:'⑥ 具体感受',keywords:'phone / five minutes / another afternoon',en:'I kept checking the time on my phone. It felt like an hour, but only five minutes had passed. So I wouldn’t want to spend another afternoon there.',zh:'反复看手机，感觉一小时，其实才五分钟；不想再待一下午。'}
    ]
  };
  return {date:'2026-10-11',profiles,sourceFile:'speaking-teacher-2026-10-11.md',reference:{id:'REFERENCE-TEACHER-20261011',part:0,kind:'reference',title:'本节课意见 · 题干、证据与串题',file:'speaking-teacher-2026-10-11.html',date:'2026-10-11',status:'ready',statusLabel:'课堂意见',description:'两种答题逻辑、四项证据检查、14 组故事诊断、羽毛球逆转故事及下一课 Part 3 预告。',tags:'老师点评，Storyline，Claim–Evidence，Weak Evidence，Retarget Required'}};
});
