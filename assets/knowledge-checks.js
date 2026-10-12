(function(root,factory){const value=factory();if(typeof module==='object'&&module.exports)module.exports=value;else root.WordlyKnowledgeChecks=value;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  // Newly authored rule checks, not official exam items or copied classroom questions.
  const fill=(id,prompt,answers,explanation)=>({id,type:'fill',prompt,answers,explanation});
  const choice=(id,prompt,options,answer,explanation)=>({id,type:'choice',prompt,options:options.map((text,i)=>({id:String.fromCharCode(97+i),text})),answers:[answer],explanation});
  const make=(entryId,title,questions,note='本组为站内原创规则练习；全部答对仅表示通过这组题。')=>({id:'check-'+entryId,entryId,version:1,title,note,questions});
  const list=[
    make('supp-cause-direction','因果方向：result from / result in',[
      fill('cause-in','Poor planning resulted ___ delays.（只填介词）',['in'],'poor planning 是原因，delays 是结果；原因 result in 结果。'),
      fill('effect-from','Delays resulted ___ poor planning.（只填介词）',['from'],'delays 是结果，poor planning 是原因；结果 result from 原因。'),
      choice('contribution','“Exercise can contribute to better sleep.” 最准确的理解是？',['运动是改善睡眠的唯一原因。','运动可能是有助于改善睡眠的因素之一。','contribute to 后只能接坏结果。'],'b','contribute to 表示促成或作出贡献，不自动表示唯一原因，也不限于负面结果。')]),
    make('kp-read-synonym-boundary','rise / raise：词义与句法',[
      choice('raised','选择正确形式：The company ___ prices yesterday.',['rose','raised','rising'],'b','raise 可以接宾语 prices，过去式为 raised；rise 不这样接宾语。'),
      fill('rose','Prices ___ last week.（用 rise 的过去式填空）',['rose'],'rise 的过去式为 rose；这里 prices 本身上涨，不需要宾语。'),
      choice('object','哪句话语法正确？',['The company rose prices.','Prices raised sharply.','The company raised prices.'],'c','提高某物用 raise + 宾语；The company raised prices 表示公司提高价格。')]),
    make('kp-grammar-only','Only 状语前置：主句倒装',[
      choice('clause','选择正确改写：“我读完报告后才理解问题。”',['Only after did I read the report I understood the problem.','Only after I read the report did I understand the problem.','Only after I read the report I did understood the problem.'],'b','after 从句用正常语序，主句 did + 主语 + 动词原形。'),
      fill('aux','Only then ___ he realise his mistake.（过去发生，只填助动词）',['did'],'only then 状语前置触发主句部分倒装；did 后用 realise 原形。'),
      choice('subject','“Only Maria knew the answer.” 是否需要把 knew 倒装？',['需要，因为出现了 only。','不需要，only 修饰主语 Maria。','需要把 Maria 放到 knew 后面。'],'b','Only 修饰主语时不触发这里的状语前置倒装。')]),
    make('kp-read-evidence','判断题：支持、矛盾与信息不足',[
      choice('true','原文：The library opens at 9 am from Monday to Friday. It is closed on Sundays.\n题干：The library opens at 9 am on Tuesdays.',['True','False','Not Given'],'a','Tuesday 属于 Monday to Friday，原文直接支持该时间。'),
      choice('false','原文：The library opens at 9 am from Monday to Friday. It is closed on Sundays.\n题干：The library is open on Sundays.',['True','False','Not Given'],'b','题干说周日开放，原文说周日关闭，二者明确矛盾。'),
      choice('unknown','原文：The library opens at 9 am from Monday to Friday. It is closed on Sundays.\n题干：The library has three floors.',['True','False','Not Given'],'c','原文没有楼层数量，不能用常识补足，也没有相反楼层数量可判断 False。')]),
    make('kp-listen-number','double / triple 与数字辨识规则',[
      fill('double','电话号码中 “double five” 对应哪两个数字？（填数字）',['55','5 5'],'double 表示同一个数字连续两次，因此 double five 是 55。'),
      fill('triple','电话号码中 “triple two” 对应哪三个数字？（填数字）',['222','2 2 2'],'triple 表示同一个数字连续三次，因此 triple two 是 222。'),
      choice('context','区分 -teen 和 -ty 时，哪种做法更可靠？',['只凭单个重音就下结论。','结合重音、结尾音节和题目语境核对。','只看题目里较常出现哪个数字。'],'b','重音是线索之一，仍需结合结尾音节与语境；本组检测书面规则，不是听音辨识测试。')],'本组检测书面数字规则，不代替真实听音辨识；题目为站内原创。'),
    make('kp-listen-plural','填空检查：单复数与词形',[
      fill('plural','There are several ___ near the station.（用 hotel 的正确形式）',['hotels'],'several 后接可数名词复数，hotel 应变为 hotels。'),
      choice('information','选择自然、正确的表达：I would like ___ information.',['an','a','some'],'c','information 通常是不可数名词，可以说 some information，不能直接用 a/an。'),
      choice('compound','选择“工作坊”的规范拼写。',['work shop','workshop','work-shop'],'b','这里的名词 workshop 写成一个词；不要随意拆开复合词。')]),
    make('lw-3b18c7f17ebac7b464d5','非谓语：主动、被动与目的',[
      choice('active','这些学生正在图书馆学习。The students ___ in the library are preparing for exams.',['studying','studied','studies'],'a','students 与 study 是主动关系，这里用 studying 短语修饰学生。'),
      choice('passive','The window ___ by the storm needs repairing.',['breaking','broken','break'],'b','窗户被暴风雨打破，是被动关系，用 broken 修饰 window。'),
      choice('purpose','表达“她为了备考而去图书馆”：She went to the library ___ for the exam.',['studied','studies','to study'],'c','to study 在这里表示目的，不是不带连接词再加一个独立谓语。')]),
    make('lw-7b45506c8c5fc88af48d','主谓一致：找到中心名词',[
      fill('singular','The building ___ near the station.（用 be 的一般现在时）',['is'],'中心名词 building 为单数，一般现在时用 is。'),
      fill('plural','The two buildings ___ near the station.（用 be 的一般现在时）',['are'],'two buildings 为复数，一般现在时用 are。'),
      choice('head','这里明确指“一栋包含淋浴间和厕所的楼”：A shower and toilet building ___ being renovated.',['is','are','be'],'a','中心名词是单数 building；不能只看到 and 就选 are。')]),
    make('lw-94aa1a66d16c8a5338fe','advice：不可数名词与动词拼写',[
      choice('uncountable','选择正确表达。',['an advice','some advices','some advice'],'c','advice 是不可数名词，通常不用 an，也不加复数 -s。'),
      fill('piece','“一条建议”：a ___ of advice（填一个词）',['piece'],'用 piece 作计数单位：a piece of advice。'),
      fill('verb','She ___ me to practise daily yesterday.（用 advise 的正确过去式）',['advised'],'这里需要动词 advise 的过去式 advised；名词是 advice。')]),
    make('rg-g-77e9a09c90c7af5f','比较级：修饰词、复数与倍数',[
      choice('modifier','选择正确表达：“快得多”。',['very faster','much faster','much more faster'],'b','much 可修饰比较级 faster；不说 very faster，也不重复添加 more。'),
      fill('methods','This is one of the best ___.（用 method 的正确形式）',['methods'],'one of + the + 最高级后接复数名词，表示多个方法中的一个。'),
      choice('multiple','“A is three times as long as B.” 表示什么？',['A 的长度等于 B 的三倍。','A 比 B 增加了三倍，即等于四倍。','A 的长度等于 B 的三分之一。'],'a','three times as long as 表示长度比为 3:1，不等于增加三倍。')])
  ];
  return Object.fromEntries(list.map(q=>[q.entryId,q]));
});
