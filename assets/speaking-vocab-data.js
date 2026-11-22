(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.WordlySpeakingVocabData=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const levels=['基础自然','常用拓展','中等进阶'],items=[],groups=[];
 function add(group,rows){groups.push(group);rows.trim().split('\n').forEach((row,i)=>{const [level,zh,en,alt,example,rescue,tip='']=row.split('|').map(s=>s.trim());items.push({id:'svcm-'+String(groups.length).padStart(2,'0')+'-'+String(i+1).padStart(2,'0'),group,level:levels[+level-1],zh,en,alternatives:alt.split('~'),example,rescue,tip});});}
 add('感受与态度',`
1|松了一口气|feel relieved|feel a sense of relief|I felt relieved when I finished the task.|I was worried, but then I felt much better.|relieved 形容人；relief 是名词。
1|有点紧张|feel a bit nervous|feel a little anxious|I felt a bit nervous before the interview.|I was a little worried about how it would go.|讲过去经历用 felt。
1|感到失望|feel disappointed|feel let down|I felt disappointed with the result.|It wasn't as good as I had hoped.|let down 常有期待落空的感觉。
1|感到自豪|feel proud of|take pride in|I feel proud of the progress I've made.|I'm happy with what I've achieved.|of 后接名词或动名词。
2|对……感到厌倦|get tired of|get fed up with|I get tired of doing the same thing every day.|I don't enjoy it any more because it's always the same.|get fed up with 的不耐烦更强。
2|被……吸引|be drawn to|be attracted to|I'm drawn to places with a relaxed atmosphere.|I like it, and it makes me want to learn more.|不要把 drawn 误当成 draw 的原形。
2|很有成就感|feel a sense of achievement|feel a sense of accomplishment|Finishing the project gave me a sense of achievement.|It felt good to finish something difficult.|常用 give someone a sense of achievement。
2|对……印象深刻|be impressed by|be impressed with|I was impressed by how calmly she handled it.|What I liked most was the way she dealt with it.|by 强调造成印象的事物；with 也常见。
3|百感交集|have mixed feelings|feel conflicted|I had mixed feelings about leaving my hometown.|I felt happy about it, but also a little sad.|mixed feelings 可以说明具体两种感受。
3|不知所措（事情太多）|feel overwhelmed|feel unable to cope|I felt overwhelmed by all the work I had to do.|There was so much to do that I didn't know where to start.|overwhelmed 可用于工作或情绪超出承受范围。
3|对自己更有信心|feel more confident in myself|have more confidence in myself|The experience helped me feel more confident in myself.|After that, I felt I could do it.|confidence 是名词，confident 是形容词。
3|把……视为理所当然|take something for granted|fail to appreciate something|I used to take my parents' support for granted.|I didn't really notice how much they did for me.|something 需替换成具体对象。
`);
 add('决定与思考',`
1|拿不定主意|not be sure what to choose|not know which one to choose|I wasn't sure what to choose at first.|I couldn't decide at first.|根据语境替换 choose 的对象。
1|仔细想一想|think it through|give it some thought|I wanted to think it through before saying yes.|I needed a little more time to think.|think it through 强调考虑周全。
1|最后决定做……|decide to|make up my mind to|I finally decided to sign up for the course.|In the end, I chose to do it.|to 后接动词原形。
1|改变主意|change my mind|have a change of heart|I changed my mind after talking to my friend.|At first I wanted one thing, but then I chose something else.|change of heart 往往指态度发生变化。
2|犹豫着要不要做……|hesitate to|be unsure whether to|I hesitated to apply because I lacked experience.|I wanted to try, but I wasn't sure I could do it.|hesitate to do；whether to do。
2|考虑到……|take something into account|take something into consideration|We need to take the cost into account.|We also need to think about how much it costs.|将 something 替换为 cost、time 等。
2|权衡利弊|weigh the pros and cons|weigh up the advantages and disadvantages|I weighed the pros and cons before making the decision.|I thought about the good and bad sides before choosing.|口语中 good and bad sides 也自然。
2|坚持自己的决定|stick to my decision|stand by my decision|I decided to stick to my decision and give it a try.|I chose it, and I didn't change my mind.|过去式为 stuck to。
3|做出明智的选择|make a sensible choice|make a wise choice|Comparing the options helped me make a sensible choice.|I chose the option that worked best for me.|sensible 强调合理、切合实际。
3|做出冲动的决定|make an impulsive decision|make a decision on impulse|I didn't want to make an impulsive decision.|I didn't want to decide too quickly without thinking.|不要将所有快速决定都叫 impulsive。
3|退一步重新考虑|take a step back|reconsider the situation|I took a step back and thought about what mattered most.|I stopped for a moment and looked at it again.|通常是比喻，不一定真的后退。
3|后悔没有做……|regret not doing|wish I had done|I regret not asking for help earlier.|Looking back, I should have asked for help.|wish I had done 与 regret not doing 结构不同。
`);
 add('行动与习惯',`
1|继续坚持下去|keep going|carry on|It was difficult, but I kept going.|I didn't stop, even when it got hard.|keep going 很常用，不低级。
1|养成习惯|get into the habit of|develop a habit of|I'm trying to get into the habit of reading every day.|I'm trying to do it a little every day.|of 后接 doing。
1|花时间做……|spend time doing|take time to do|I spend time reviewing my mistakes.|I give myself some time to work on it.|spend time doing；take time to do。
1|抽出时间|make time for|set aside time for|I make time for exercise, even when I'm busy.|I try to find a little time for it every day.|make time 强调主动安排。
2|把事情拖到最后|leave things until the last minute|put things off until the last minute|I used to leave things until the last minute.|I often waited too long before starting.|不必每次都找 procrastinate 才能表达。
2|专心做一件事|focus on one thing at a time|concentrate on one task at a time|I work better when I focus on one thing at a time.|I try to do one thing well before starting another.|on 后可接 doing。
2|跟上进度|keep up with the work|stay on track|It's hard to keep up with the work when I miss a class.|I have to work a bit harder so I don't fall behind.|keep up with 后接要跟上的对象。
2|重新回到正轨|get back on track|get back into a routine|After a busy week, I wanted to get back on track.|I wanted to start following my plan again.|get back into a routine 更侧重恢复日常规律。
3|提高做事效率|work more efficiently|make better use of my time|Planning ahead helps me work more efficiently.|I can get more done in the same amount of time.|efficiently 修饰 work。
3|集中精力做……|put my energy into|devote my attention to|I want to put my energy into things that matter.|I want to spend more time on what's important.|into 后接名词或 doing。
3|付诸行动|put an idea into practice|act on an idea|The course gave us a chance to put our ideas into practice.|We didn't just talk about it; we actually tried it.|idea 换成计划时可用 plan。
3|长期坚持|keep at it|stick with it over time|I know I need to keep at it to improve.|I need to keep doing it, even if progress is slow.|keep at it 强调持续努力；over time 强调随时间积累。
`);
 add('学习与成长',`
1|慢慢掌握|get better at|improve at|I gradually got better at speaking in front of people.|It became easier the more I practised.|get better at 后接名词或 doing。
1|从错误中学习|learn from my mistakes|use my mistakes as a chance to learn|I try to learn from my mistakes instead of ignoring them.|When something goes wrong, I think about how to do it better.|不要说 learn my mistakes。
1|向别人求助|ask someone for help|turn to someone for help|I asked my classmate for help when I got stuck.|I told someone I couldn't do it alone.|ask someone for something。
1|尝试新事物|try something new|give something new a try|I enjoy trying something new from time to time.|I like doing things I haven't done before.|give it a try 是自然的替换。
2|获得实际经验|gain practical experience|get hands-on experience|The project helped me gain practical experience.|I learned by actually doing the work.|hands-on 强调亲自操作。
2|逐渐熟悉|get familiar with|become familiar with|I gradually got familiar with the new software.|After using it for a while, I knew how it worked.|familiar with 表示熟悉某事。
2|掌握窍门|get the hang of|get to grips with|It took me a while to get the hang of it.|At first it was hard, but then I understood how to do it.|get to grips with 更侧重着手理解或处理。
2|开阔眼界|broaden my horizons|expand my understanding of the world|Travelling can broaden my horizons.|It helps me see things I hadn't thought about before.|补一个具体认识，别只说空泛结论。
3|走出舒适区|step out of my comfort zone|push myself to try something unfamiliar|Joining the club pushed me to step out of my comfort zone.|I did something I wasn't used to, even though it felt difficult.|用实际行动证明，不只堆词。
3|把知识用到实际中|apply what I've learned|put what I've learned into practice|I wanted to apply what I'd learned in class.|I wanted to use it in a real situation.|过去经历可用 what I'd learned。
3|弥补不足|work on my weaknesses|address my weaknesses|I'm trying to work on my weaknesses in speaking.|I'm spending more time on the parts I find difficult.|避免把 weakness 说成固定不变的能力。
3|打下坚实基础|build a solid foundation|lay a solid foundation|Regular practice helped me build a solid foundation.|It helped me get the basics right.|foundation 后可接 in 或 for，视对象而定。
`);
 add('人物与相处',`
1|相处得来|get along well with|get on well with|I get along well with my classmates.|We feel comfortable spending time together.|英式口语也常用 get on well with。
1|保持联系|keep in touch|stay in touch|We still keep in touch after leaving school.|We still talk to each other from time to time.|说明方式时可加 by text 或 online。
1|善于倾听|be a good listener|listen carefully to others|She's a good listener when I need advice.|She lets me explain things and really listens.|用具体倾听行为支持评价。
1|愿意帮忙|be willing to help|be happy to lend a hand|He's always willing to help when someone has a problem.|If you need help, he'll try to do something for you.|lend a hand 是帮忙，不是借钱。
2|信守承诺|keep a promise|keep my word|I try to keep my promises, even when it's inconvenient.|If I say I'll do something, I try to do it.|keep my word 中 word 通常单数。
2|为别人着想|be considerate of others|think about other people's needs|She's considerate of others and avoids making too much noise.|She thinks about how her actions affect other people.|considerate 与 considerable 不同。
2|承担责任|take responsibility for|accept responsibility for|He took responsibility for the mistake.|He admitted it was his job to deal with it.|for 后接名词或 doing。
2|鼓励我尝试|encourage me to try|give me the confidence to try|My teacher encouraged me to try something new.|She made me feel that I could give it a go.|encourage someone to do。
3|以身作则|lead by example|set a good example|My sister leads by example rather than just giving advice.|She shows us what to do by doing it herself.|set an example for someone。
3|在压力下保持冷静|stay calm under pressure|keep a cool head under pressure|She can stay calm under pressure.|Even when things get difficult, she doesn't panic.|不要在 calm 和 under pressure 中间多加 and。
3|理解别人的立场|see things from someone else's perspective|put myself in someone else's shoes|I try to see things from the other person's perspective.|I try to imagine how the other person feels.|代词可按人物替换。
3|给我留下深刻影响|have a lasting influence on me|have a lasting impact on me|Her advice has had a lasting influence on me.|I still remember her advice and use it today.|influence 或 impact 后常接 on。
`);
 add('经历与转折',`
1|一开始|at first|to begin with|At first, I wasn't sure I would enjoy it.|When it started, I had some doubts.|at first 常与后来的变化对应。
1|后来发生了变化|things started to change|things began to turn around|After a few weeks, things started to change.|It was difficult before, but then it got better.|turn around 常强调好转。
1|结果证明|it turned out that|as it turned out|It turned out that the task was easier than I expected.|In the end, it wasn't as hard as I had thought.|it turned out that 后接完整句。
1|回想起来|looking back|when I think back on it|Looking back, I'm glad I gave it a try.|Now that I think about it, it was a good experience.|不必逐字翻译中文。
2|遇到困难|run into difficulties|come across problems|We ran into difficulties halfway through the project.|Something went wrong, and we had to find a way to fix it.|run 的过去式是 ran。
2|找到解决办法|come up with a solution|find a way to solve the problem|We finally came up with a solution.|We thought of something that could work.|come up with 需要宾语。
2|意想不到|come as a surprise|be unexpected|The result came as a surprise to me.|I really didn't expect it.|说明好意外还是坏意外。
2|值得付出努力|be worth the effort|be worth working for|It was tiring, but it was worth the effort.|It took a lot of work, but I'm glad I did it.|worth 后接名词或 doing。
3|成为一个转折点|be a turning point|mark a turning point|That experience was a turning point for me.|After that, I started to do things differently.|用前后变化说明转折。
3|事情没有按计划发展|things didn't go as planned|things didn't work out as expected|At first, things didn't go as planned.|What happened was different from what we had expected.|as planned 可以直接使用。
3|克服困难|overcome a challenge|get through a difficult situation|We worked together to overcome the challenge.|It was hard, but we found a way to get through it.|overcome 的过去式是 overcame。
3|在落后时逆转|make a comeback|turn things around after falling behind|The player made an amazing comeback.|He was losing at first, but he kept going and won.|体育题要用真实过程支撑 comeback。
`);
 add('地点与体验',`
1|离家很近|be close to my home|be near where I live|The park is close to my home.|It doesn't take me long to get there.|near 后通常不用 to。
1|步行就能到|be within walking distance|be a short walk away|The library is within walking distance.|I can get there on foot in a few minutes.|可补真实步行时间。
1|交通方便|be easy to get to|have good transport links|The place is easy to get to by bus.|I can get there without much trouble.|交通方便不直译 convenient traffic。
1|人很多|be crowded|be full of people|The square was crowded at the weekend.|There were people everywhere.|a lot of people 也完全自然。
2|气氛很轻松|have a relaxed atmosphere|have a laid-back feel|The cafe has a relaxed atmosphere.|It's a place where I can sit down and feel comfortable.|relaxed atmosphere，relaxing place。
2|吵得听不清彼此|be too noisy to hear each other|have to shout to hear each other|It was too noisy to hear each other.|We had to speak really loudly to have a conversation.|描述影响，比只说 noisy 更具体。
2|和想象的一样|live up to my expectations|be as good as I expected|The trip lived up to my expectations.|It was just as good as I had hoped.|通常指达到原有的正面期待。
2|让我感觉像在家一样|make me feel at home|make me feel welcome and comfortable|The friendly staff made me feel at home.|I felt welcome and didn't have to worry about anything.|feel at home 是自在，不一定是家。
3|远离城市喧嚣|get away from the noise of the city|escape the hustle and bustle of the city|I go there to get away from the noise of the city.|It's quiet there, so I can take a break from city life.|简单表达也可以讲得很具体。
3|令人难忘|be memorable|leave a lasting impression|It was a memorable experience.|I still remember it clearly, even now.|forgettable 与 unforgettable 含义相反。
3|全景尽收眼底|enjoy a panoramic view|see the whole area from above|From the top, we could enjoy a panoramic view of the city.|We could see almost the whole city from there.|不确定 panoramic 时直接用简单说法。
3|现场气氛很热烈|have an electric atmosphere|be full of excitement|There was an electric atmosphere in the stadium.|Everyone was cheering, and I could feel the excitement.|只用于确有依据的现场体验。
`);
 add('兴趣与偏好',`
1|我挺喜欢……|be quite into|be quite keen on|I'm quite into taking photos.|I enjoy it and do it whenever I can.|into / on 后接名词或 doing。
1|我不太喜欢……|not be a big fan of|not be particularly keen on|I'm not a big fan of crowded places.|I usually prefer somewhere a bit quieter.|比直接说 hate 更温和。
1|比起……更喜欢……|prefer A to B|like A more than B|I prefer quiet parks to busy shopping centres.|If I had to choose, I'd go for the quieter option.|prefer A to B，不是 prefer A than B。
1|这取决于情况|it depends on the situation|it depends on what I'm doing|It depends on the situation and who I'm with.|Sometimes I like it, and sometimes I don't.|接着说具体情况，别停在 It depends。
2|让我放松下来|help me unwind|help me relax|Listening to music helps me unwind after a busy day.|It helps me stop worrying and feel more relaxed.|unwind 的过去式是 unwound。
2|让我暂时不想烦心事|take my mind off things|take my mind off my worries|A short walk helps take my mind off things.|For a while, I stop thinking about what's worrying me.|things 可换成具体烦恼。
2|沉浸在故事中|get absorbed in the story|immerse myself in the story|When a film is good, I get absorbed in the story.|I become so interested that I forget about everything else.|absorbed in，不是 absorbed to。
2|偶尔换换口味|try something different for a change|do something different now and then|I sometimes try something different for a change.|I don't want to do the same thing every time.|for a change 表示换个样子。
3|很符合我的兴趣|suit my interests|be right up my street|The course really suited my interests.|It was about something I already enjoyed learning about.|right up my street 较口语，英式常见。
3|对……越来越感兴趣|develop an interest in|become increasingly interested in|I gradually developed an interest in design.|The more I learned about it, the more I liked it.|develop an interest in，注意冠词。
3|充分利用空闲时间|make good use of my free time|spend my free time in a worthwhile way|Reading helps me make good use of my free time.|I feel I'm doing something useful with my time.|按情境选，不必翻译得过于抽象。
3|从中获得满足感|get a sense of satisfaction from|find something rewarding|I get a sense of satisfaction from making things myself.|I feel good when I can see the result of my work.|rewarding 强调有价值或满足感。
`);
 add('观点与论证',`
1|在我看来|in my view|the way I see it|In my view, regular practice matters more than long study sessions.|I think doing a little every day works better.|说完观点要补原因。
1|主要原因是|the main reason is that|one key reason is that|The main reason is that it saves time.|It helps because people can get things done faster.|that 后接完整句。
1|举个例子|for example|for instance|For example, students can practise with a partner.|One example is practising with a friend.|例子应当直接支持前面的观点。
1|另一方面|on the other hand|another side to consider is|On the other hand, it can be expensive.|But there is also a problem to think about.|用于补另一面，不只是任意接下一句。
2|带来很大变化|make a big difference|have a significant impact|A little support can make a big difference.|Even a small change can help a lot.|说明变化具体体现在哪。
2|有助于……|help with|contribute to|Regular exercise can contribute to better sleep.|It can help people sleep better.|contribute to 后接名词或 doing。
2|从长远来看|in the long run|over the longer term|In the long run, these habits can save time.|It may take time, but it can help us later.|与马上见效区分。
2|有利有弊|have both advantages and disadvantages|have its pros and cons|Online learning has both advantages and disadvantages.|There are good sides to it, but also some problems.|后面选一两个具体点展开。
3|考虑到个人差异|take individual differences into account|recognise that people have different needs|We should take individual differences into account.|What works for one person may not work for another.|individual differences 不等于不同意见。
3|在……之间找到平衡|strike a balance between|find a balance between|It's important to strike a balance between work and rest.|We need time to work, but we also need time to relax.|between 后接两个对等成分。
3|不能一概而论|there isn't a one-size-fits-all answer|it varies from person to person|There isn't a one-size-fits-all answer to this question.|Different people may need different solutions.|不是每道题都需要这类开头。
3|与其……不如……|rather than|instead of|I'd rather practise regularly than study everything in one night.|I think doing a little every day is a better choice.|would rather do A than do B；instead of 后接名词或 doing。
`);
 add('卡住时继续说',`
1|让我想一下|let me think for a moment|let me think about that|Let me think for a moment. I'd probably choose the first one.|I'd probably choose the first one.|短暂停顿即可，不要反复填充。
1|我想说的是|what I mean is|what I'm trying to say is|What I mean is, I felt more relaxed afterwards.|I felt more relaxed afterwards.|用来澄清，不要每句都重启。
1|简单来说|to put it simply|put simply|To put it simply, it made life easier.|It made life easier.|忘词时可直接讲最简单的意思。
1|比如说……|say, for example|take something as an example|Say, for example, a student has a busy timetable.|For example, a student may have very little free time.|take something as an example 要替换 something。
2|我记不清具体时间了|I can't remember exactly when|I'm not sure of the exact date|I can't remember exactly when, but it was a few years ago.|It was a few years ago, I think.|不确定就说大致时间，不编确切日期。
2|我一时想不起那个词|I can't think of the word right now|the word has slipped my mind|I can't think of the word right now, but it's a tool for cutting wood.|It's a tool that people use to cut wood.|先说类别，再讲用途，尽快接着说。
2|它是一种用来……的东西|it's a kind of tool used for|it's something people use to|It's a kind of tool used for measuring distance.|People use it to see how far away something is.|used for 后接 doing；use to 后接动词。
2|它就是那种……的人／地方|it's the kind of place where|it's a place where you can|It's the kind of place where you can sit quietly and read.|You can sit quietly and read there.|人物可说 someone who，按对象更换结构。
3|换个说法|to put it another way|in other words|To put it another way, I wanted more control over my time.|I wanted to decide how to use my own time.|换说法应更清楚，而非重复同一串词。
3|最让我印象深刻的是|what stood out to me was|what impressed me most was|What stood out to me was how patient she was.|She was very patient, and I remember that clearly.|后接名词或从句，避免双谓语。
3|先不说这个，回到刚才的话题|anyway, going back to what I was saying|to get back to the point|Anyway, going back to what I was saying, the trip helped me relax.|The main thing is that the trip helped me relax.|只在确实偏题后回到中心时用。
3|我没有亲身经历，但我觉得|I haven't experienced it myself, but I think|I can't speak from experience, but I'd say|I haven't experienced it myself, but I think it could be challenging.|I haven't done it, but it sounds quite difficult.|适合观点题；不能用来替代Part 2要求的真实经历。
`);
 return {version:1,title:'口语词汇转换记忆',levels,groups,items};
});
