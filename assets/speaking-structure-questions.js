/* Generic practice prompts only. Personal answers, private paths and learning records are never bundled. */
(function(root){const questions=[
  {
    "question": "What films do you like?",
    "topic": "Films and cinemas",
    "sources": [
      "P1话题词汇（带素材版）.pdf p.4",
      "P1话题词汇（带素材版）.pdf p.6"
    ]
  },
  {
    "question": "Did you often watch films when you were a child?",
    "topic": "Films and cinemas",
    "sources": [
      "P1话题词汇（带素材版）.pdf p.4",
      "P1话题词汇（带素材版）.pdf p.6"
    ]
  },
  {
    "question": "Did you ever go to the cinema alone as a child?",
    "topic": "Films and cinemas",
    "sources": [
      "P1话题词汇（带素材版）.pdf p.4",
      "P1话题词汇（带素材版）.pdf p.6"
    ]
  },
  {
    "question": "Do you often go to the cinema with your friends?",
    "topic": "Films and cinemas",
    "sources": [
      "P1话题词汇（带素材版）.pdf p.4",
      "P1话题词汇（带素材版）.pdf p.6",
      "雅思口语真经课讲义2026.9.pdf p.5"
    ]
  },
  {
    "question": "Do you think going to the cinema is a good way to spend time with friends?",
    "topic": "Films and cinemas",
    "sources": [
      "P1话题词汇（带素材版）.pdf p.4",
      "P1话题词汇（带素材版）.pdf p.6"
    ]
  },
  {
    "question": "How often do you watch films?",
    "topic": "Films and cinemas",
    "sources": [
      "P1话题词汇（带素材版）.pdf p.5",
      "P1话题词汇（带素材版）.pdf p.6",
      "雅思口语真经课讲义2026.9.pdf p.8"
    ]
  },
  {
    "question": "Do you prefer to watch films at home or in the cinema?",
    "topic": "Films and cinemas",
    "sources": [
      "P1话题词汇（带素材版）.pdf p.5",
      "P1话题词汇（带素材版）.pdf p.7"
    ]
  },
  {
    "question": "Did you use to keep your room tidy as a child?",
    "topic": "Tidiness",
    "sources": [
      "P1话题词汇（带素材版）.pdf p.23",
      "P1话题词汇（带素材版）.pdf p.24",
      "雅思口语真经课讲义2026.9.pdf p.12"
    ]
  },
  {
    "question": "Are you a tidy person?",
    "topic": "Tidiness",
    "sources": [
      "P1话题词汇（带素材版）.pdf p.23",
      "P1话题词汇（带素材版）.pdf p.24"
    ]
  },
  {
    "question": "How do you keep things tidy?",
    "topic": "Tidiness",
    "sources": [
      "P1话题词汇（带素材版）.pdf p.23",
      "P1话题词汇（带素材版）.pdf p.24"
    ]
  },
  {
    "question": "Do you think people should tidy all the time?",
    "topic": "Tidiness",
    "sources": [
      "P1话题词汇（带素材版）.pdf p.23",
      "P1话题词汇（带素材版）.pdf p.24"
    ]
  },
  {
    "question": "What kinds of music do you listen to?",
    "topic": "Music",
    "sources": [
      "P1话题词汇（带素材版）.pdf p.25",
      "P1话题词汇（带素材版）.pdf p.26",
      "雅思口语真经课讲义2026.9.pdf p.9"
    ]
  },
  {
    "question": "Is it easy to learn music?",
    "topic": "Music",
    "sources": [
      "P1话题词汇（带素材版）.pdf p.25",
      "P1话题词汇（带素材版）.pdf p.26"
    ]
  },
  {
    "question": "Do you take music lessons at school?",
    "topic": "Music",
    "sources": [
      "P1话题词汇（带素材版）.pdf p.25",
      "P1话题词汇（带素材版）.pdf p.26"
    ]
  },
  {
    "question": "What colour clothes do you like when choosing clothes?",
    "topic": "Clothing",
    "sources": [
      "P1话题词汇（带素材版）.pdf p.33",
      "P1话题词汇（带素材版）.pdf p.34"
    ]
  },
  {
    "question": "What's your childhood dream?",
    "topic": "Dream and ambition",
    "sources": [
      "P1话题词汇（带素材版）.pdf p.35",
      "P1话题词汇（带素材版）.pdf p.36"
    ]
  },
  {
    "question": "Are you the kind of person who sticks to dreams?",
    "topic": "Dream and ambition",
    "sources": [
      "P1话题词汇（带素材版）.pdf p.35",
      "P1话题词汇（带素材版）.pdf p.36"
    ]
  },
  {
    "question": "What's your dream job?",
    "topic": "Dream and ambition",
    "sources": [
      "P1话题词汇（带素材版）.pdf p.35",
      "P1话题词汇（带素材版）.pdf p.36"
    ]
  },
  {
    "question": "Do you think you are an ambitious person?",
    "topic": "Dream and ambition",
    "sources": [
      "P1话题词汇（带素材版）.pdf p.35",
      "P1话题词汇（带素材版）.pdf p.36"
    ]
  },
  {
    "question": "Have you ever learnt about outer space and stars?",
    "topic": "Outer space and stars",
    "sources": [
      "P1话题词汇（带素材版）.pdf p.37",
      "P1话题词汇（带素材版）.pdf p.38"
    ]
  },
  {
    "question": "Do you like science fiction movies? Why?",
    "topic": "Outer space and stars",
    "sources": [
      "P1话题词汇（带素材版）.pdf p.37",
      "P1话题词汇（带素材版）.pdf p.38"
    ]
  },
  {
    "question": "Do you want to know more about outer space?",
    "topic": "Outer space and stars",
    "sources": [
      "P1话题词汇（带素材版）.pdf p.37",
      "P1话题词汇（带素材版）.pdf p.38"
    ]
  },
  {
    "question": "Do you want to go into outer space in the future?",
    "topic": "Outer space and stars",
    "sources": [
      "P1话题词汇（带素材版）.pdf p.37",
      "P1话题词汇（带素材版）.pdf p.38"
    ]
  },
  {
    "question": "Do you like science?",
    "topic": "Science",
    "sources": [
      "P1话题词汇（带素材版）.pdf p.42",
      "P1话题词汇（带素材版）.pdf p.44"
    ]
  },
  {
    "question": "When did you start to learn about science?",
    "topic": "Science",
    "sources": [
      "P1话题词汇（带素材版）.pdf p.42",
      "P1话题词汇（带素材版）.pdf p.44"
    ]
  },
  {
    "question": "Which science subject is interesting to you?",
    "topic": "Science",
    "sources": [
      "P1话题词汇（带素材版）.pdf p.42",
      "P1话题词汇（带素材版）.pdf p.44"
    ]
  },
  {
    "question": "What kinds of interesting things have you done with science?",
    "topic": "Science",
    "sources": [
      "P1话题词汇（带素材版）.pdf p.42",
      "P1话题词汇（带素材版）.pdf p.44"
    ]
  },
  {
    "question": "Do you like watching science TV programs?",
    "topic": "Science",
    "sources": [
      "P1话题词汇（带素材版）.pdf p.42",
      "P1话题词汇（带素材版）.pdf p.44",
      "雅思口语真经课讲义2026.9.pdf p.3",
      "我的雅思口语题目与素材大全_2026-11-22_可编辑稿.md"
    ]
  },
  {
    "question": "Do Chinese people often visit science museums?",
    "topic": "Science",
    "sources": [
      "P1话题词汇（带素材版）.pdf p.43",
      "P1话题词汇（带素材版）.pdf p.44"
    ]
  },
  {
    "question": "Are you good at telling jokes?",
    "topic": "Jokes & Comedies",
    "sources": [
      "P1话题词汇（带素材版）.pdf p.47",
      "P1话题词汇（带素材版）.pdf p.48",
      "我的雅思口语题目与素材大全_2026-11-22_可编辑稿.md"
    ]
  },
  {
    "question": "Do your friends like to tell jokes?",
    "topic": "Jokes & Comedies",
    "sources": [
      "P1话题词汇（带素材版）.pdf p.47",
      "P1话题词汇（带素材版）.pdf p.48"
    ]
  },
  {
    "question": "Do you like to watch comedies?",
    "topic": "Jokes & Comedies",
    "sources": [
      "P1话题词汇（带素材版）.pdf p.47",
      "P1话题词汇（带素材版）.pdf p.48",
      "我的雅思口语题目与素材大全_2026-11-22_可编辑稿.md"
    ]
  },
  {
    "question": "Have you ever watched a live show?",
    "topic": "Jokes & Comedies",
    "sources": [
      "P1话题词汇（带素材版）.pdf p.47",
      "P1话题词汇（带素材版）.pdf p.48"
    ]
  },
  {
    "question": "Are comedy shows popular in your country?",
    "topic": "Jokes & Comedies",
    "sources": [
      "P1话题词汇（带素材版）.pdf p.47",
      "P1话题词汇（带素材版）.pdf p.48"
    ]
  },
  {
    "question": "Have you ever bought something because of an advertisement?",
    "topic": "Advertisement",
    "sources": [
      "P1 9-12月新题话题词汇和素材.pdf p.3"
    ]
  },
  {
    "question": "What do you do when you feel bored?",
    "topic": "Feeling bored",
    "sources": [
      "P1 9-12月新题话题词汇和素材.pdf p.4"
    ]
  },
  {
    "question": "Do you think childhood is boring or adulthood is boring?",
    "topic": "Feeling bored",
    "sources": [
      "P1 9-12月新题话题词汇和素材.pdf p.4"
    ]
  },
  {
    "question": "Do people in your country like planting vegetables?",
    "topic": "Fruit and vegetables",
    "sources": [
      "P1 9-12月新题话题词汇和素材.pdf p.7"
    ]
  },
  {
    "question": "Is it easy for you to remember people's names?",
    "topic": "Name",
    "sources": [
      "P1 9-12月新题话题词汇和素材.pdf p.8"
    ]
  },
  {
    "question": "How do you remember people's names?",
    "topic": "Name",
    "sources": [
      "P1 9-12月新题话题词汇和素材.pdf p.8"
    ]
  },
  {
    "question": "How do you feel when people can't remember your name?",
    "topic": "Name",
    "sources": [
      "P1 9-12月新题话题词汇和素材.pdf p.9"
    ]
  },
  {
    "question": "Do you often forget people's names?",
    "topic": "Name",
    "sources": [
      "P1 9-12月新题话题词汇和素材.pdf p.9"
    ]
  },
  {
    "question": "On what occasions should we be polite?",
    "topic": "Politeness",
    "sources": [
      "P1 9-12月新题话题词汇和素材.pdf p.13"
    ]
  },
  {
    "question": "What did you do to show your politeness as a child?",
    "topic": "Politeness",
    "sources": [
      "P1 9-12月新题话题词汇和素材.pdf p.13"
    ]
  },
  {
    "question": "Did you recycle when you were a kid?",
    "topic": "Rubbish and recycling",
    "sources": [
      "P1 9-12月新题话题词汇和素材.pdf p.15"
    ]
  },
  {
    "question": "Is waste sorting common in your country?",
    "topic": "Rubbish and recycling",
    "sources": [
      "P1 9-12月新题话题词汇和素材.pdf p.15"
    ]
  },
  {
    "question": "Do you wear professional training shoes?",
    "topic": "Shoes",
    "sources": [
      "P1 9-12月新题话题词汇和素材.pdf p.19"
    ]
  },
  {
    "question": "What do people usually buy at street markets?",
    "topic": "Street market",
    "sources": [
      "P1 9-12月新题话题词汇和素材.pdf p.20"
    ]
  },
  {
    "question": "Do you prefer to go shopping in a shopping mall or at a street market?",
    "topic": "Street market",
    "sources": [
      "P1 9-12月新题话题词汇和素材.pdf p.20"
    ]
  },
  {
    "question": "Why are some places suitable for meeting friends while others are not?",
    "topic": "Friends",
    "sources": [
      "P1 9-12月新题话题词汇和素材.pdf p.26"
    ]
  },
  {
    "question": "Is there a difference between where you meet your friends now and where you used to meet them in the past?",
    "topic": "Friends",
    "sources": [
      "P1 9-12月新题话题词汇和素材.pdf p.26"
    ]
  },
  {
    "question": "Do you prefer to spend time with one friend or with a group of friends?",
    "topic": "Friends",
    "sources": [
      "P1 9-12月新题话题词汇和素材.pdf p.27"
    ]
  },
  {
    "question": "Do you often go out with your friends?",
    "topic": "Friends",
    "sources": [
      "P1 9-12月新题话题词汇和素材.pdf p.27"
    ]
  },
  {
    "question": "Do you have a friend you have known for a long time?",
    "topic": "Friends",
    "sources": [
      "P1 9-12月新题话题词汇和素材.pdf p.28"
    ]
  },
  {
    "question": "What do you usually do with your friends?",
    "topic": "Friends",
    "sources": [
      "P1 9-12月新题话题词汇和素材.pdf p.28"
    ]
  },
  {
    "question": "Would you invite friends to your home?",
    "topic": "Friends",
    "sources": [
      "P1 9-12月新题话题词汇和素材.pdf p.28"
    ]
  },
  {
    "question": "Where do you often meet each other?",
    "topic": "Friends",
    "sources": [
      "P1 9-12月新题话题词汇和素材.pdf p.29"
    ]
  },
  {
    "question": "How important are friends to you?",
    "topic": "Friends",
    "sources": [
      "P1 9-12月新题话题词汇和素材.pdf p.29"
    ]
  },
  {
    "question": "Where do you come from?",
    "topic": "课堂通用题",
    "sources": [
      "雅思口语真经课讲义2026.9.pdf p.1"
    ]
  },
  {
    "question": "Would you like to live in your hometown in the future?",
    "topic": "课堂通用题",
    "sources": [
      "雅思口语真经课讲义2026.9.pdf p.1"
    ]
  },
  {
    "question": "Do you live in a house or in an apartment?",
    "topic": "课堂通用题",
    "sources": [
      "雅思口语真经课讲义2026.9.pdf p.1"
    ]
  },
  {
    "question": "Do you like your home?",
    "topic": "课堂通用题",
    "sources": [
      "雅思口语真经课讲义2026.9.pdf p.1"
    ]
  },
  {
    "question": "Would you like to live there in the future?",
    "topic": "课堂通用题",
    "sources": [
      "雅思口语真经课讲义2026.9.pdf p.1"
    ]
  },
  {
    "question": "Are you a student or do you have a job?",
    "topic": "课堂通用题",
    "sources": [
      "雅思口语真经课讲义2026.9.pdf p.2"
    ]
  },
  {
    "question": "What do you study?",
    "topic": "课堂通用题",
    "sources": [
      "雅思口语真经课讲义2026.9.pdf p.2"
    ]
  },
  {
    "question": "Do you like reading?",
    "topic": "课堂通用题",
    "sources": [
      "雅思口语真经课讲义2026.9.pdf p.2"
    ]
  },
  {
    "question": "Do you like going to the park?",
    "topic": "课堂通用题",
    "sources": [
      "雅思口语真经课讲义2026.9.pdf p.3"
    ]
  },
  {
    "question": "Are team sports popular in your country?",
    "topic": "课堂通用题",
    "sources": [
      "雅思口语真经课讲义2026.9.pdf p.3"
    ]
  },
  {
    "question": "Do you often go to the park?",
    "topic": "课堂通用题",
    "sources": [
      "雅思口语真经课讲义2026.9.pdf p.5"
    ]
  },
  {
    "question": "Are there tall buildings near your home?",
    "topic": "课堂通用题",
    "sources": [
      "雅思口语真经课讲义2026.9.pdf p.8"
    ]
  },
  {
    "question": "What do you usually do in the morning?",
    "topic": "课堂通用题",
    "sources": [
      "雅思口语真经课讲义2026.9.pdf p.8",
      "雅思口语真经课讲义2026.9.pdf p.9"
    ]
  },
  {
    "question": "What is the most popular animal in China?",
    "topic": "课堂通用题",
    "sources": [
      "雅思口语真经课讲义2026.9.pdf p.8",
      "雅思口语真经课讲义2026.9.pdf p.9"
    ]
  },
  {
    "question": "When do you need to read carefully, and when not?",
    "topic": "课堂通用题",
    "sources": [
      "雅思口语真经课讲义2026.9.pdf p.9"
    ]
  },
  {
    "question": "What are your favourite activities?",
    "topic": "课堂通用题",
    "sources": [
      "雅思口语真经课讲义2026.9.pdf p.9"
    ]
  },
  {
    "question": "How do people remember each stage of their lives?",
    "topic": "课堂通用题",
    "sources": [
      "雅思口语真经课讲义2026.9.pdf p.9"
    ]
  },
  {
    "question": "Did you have any hobbies when you were a child?",
    "topic": "课堂通用题",
    "sources": [
      "雅思口语真经课讲义2026.9.pdf p.10"
    ]
  },
  {
    "question": "Have you ever seen movies where there were a lot of robots?",
    "topic": "课堂通用题",
    "sources": [
      "雅思口语真经课讲义2026.9.pdf p.10"
    ]
  },
  {
    "question": "Have you received a handmade gift?",
    "topic": "课堂通用题",
    "sources": [
      "雅思口语真经课讲义2026.9.pdf p.12"
    ]
  },
  {
    "question": "What made you happy lately?",
    "topic": "课堂通用题",
    "sources": [
      "雅思口语真经课讲义2026.9.pdf p.12"
    ]
  },
  {
    "question": "Are there any differences between what you do in the morning now and what you did in the past?",
    "topic": "课堂通用题",
    "sources": [
      "雅思口语真经课讲义2026.9.pdf p.13"
    ]
  },
  {
    "question": "Has the area where you live changed?",
    "topic": "课堂通用题",
    "sources": [
      "雅思口语真经课讲义2026.9.pdf p.13"
    ]
  },
  {
    "question": "Are there any differences between the activities you liked when you were a child and those you like now?",
    "topic": "课堂通用题",
    "sources": [
      "雅思口语真经课讲义2026.9.pdf p.13"
    ]
  },
  {
    "question": "What’s the difference between team sports and individual sports?",
    "topic": "课堂通用题",
    "sources": [
      "雅思口语真经课讲义2026.9.pdf p.14"
    ]
  },
  {
    "question": "Do you like doing sports?",
    "topic": "01｜核心结论",
    "sources": [
      "我的雅思口语题目与素材大全_2026-11-22_可编辑稿.md"
    ]
  },
  {
    "question": "Are you a morning person?",
    "topic": "02｜常见题型及对应策略",
    "sources": [
      "我的雅思口语题目与素材大全_2026-11-22_可编辑稿.md"
    ]
  },
  {
    "question": "Where do you like to go in your neighborhood?",
    "topic": "02｜常见题型及对应策略",
    "sources": [
      "我的雅思口语题目与素材大全_2026-11-22_可编辑稿.md"
    ]
  },
  {
    "question": "Did you like tidying up your room when you were a child?",
    "topic": "02｜常见题型及对应策略",
    "sources": [
      "我的雅思口语题目与素材大全_2026-11-22_可编辑稿.md"
    ]
  },
  {
    "question": "Do you prefer cold or hot weather?",
    "topic": "02｜常见题型及对应策略",
    "sources": [
      "我的雅思口语题目与素材大全_2026-11-22_可编辑稿.md"
    ]
  },
  {
    "question": "What do you like about your neighbourhood?",
    "topic": "10｜随堂自测题",
    "sources": [
      "我的雅思口语题目与素材大全_2026-11-22_可编辑稿.md"
    ]
  },
  {
    "question": "Have you ever taken music classes?",
    "topic": "10｜随堂自测题",
    "sources": [
      "我的雅思口语题目与素材大全_2026-11-22_可编辑稿.md"
    ]
  }
];if(typeof module==='object'&&module.exports)module.exports=questions;else root.WordlySpeakingStructureQuestions=questions;})(typeof globalThis!=='undefined'?globalThis:this);
