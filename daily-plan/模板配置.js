// 这是初始任务配置。普通用户也可以在页面点击「修改任务」，不必编辑代码。
// 改此文件后，页面「修改任务 → 载入配置文件 → 保存」可应用新默认值。
window.PLANNER_TEMPLATE = {
  brandName: '今日有序',
  goalLabel: '我的目标 · 倒计时',
  focusName: '核心任务',
  focusCategory: '每天推进一个具体成果',
  focusMinutes: 60,
  focusTime: '10:00—11:00',
  focusHint: '先写成果标准，再专注推进，最后保存成果和下一步。',
  endTitle: '完成今天，也给休息留点位置。',
  endHint: '留出吃饭、活动和睡眠时间，计划可以根据实际情况调整。',
  tasks: [
    {id:'daily-start', title:'确定今天最重要的一件事', group:'morning', time:'09:00—09:15', hint:'把目标写成一个能检查的成果。', note:'今天最重要的事'},
    {id:'focus', title:'核心任务 · 专注 60 分钟', group:'morning', time:'10:00—11:00', hint:'先写清楚成果，再推进一个完整步骤。'},
    {id:'learning', title:'学习与复习', group:'morning', time:'11:15—12:00', hint:'先回忆旧内容，再学习今天的份额。', note:'今天的内容或范围'},
    {id:'practice', title:'完成一项练习', group:'afternoon', time:'14:00—15:00', hint:'完成后检查错误，记录下次要注意的地方。', note:'练习内容'},
    {id:'activity', title:'运动或出门活动', group:'afternoon', time:'16:00—16:30', hint:'按自己的身体状态，选择合适的活动。'},
    {id:'admin', title:'处理必要的零碎事务', group:'afternoon', time:'17:00—17:20', hint:'集中处理消息、整理材料和生活事务。'},
    {id:'review', title:'保存今天的复盘', group:'evening', time:'22:00—22:10', hint:'在底部填写今天的感受、困难和希望调整的地方。'},
    {id:'prepare', title:'写下明天的第一步', group:'evening', time:'睡前', hint:'让明天打开清单时，可以直接开始。'}
  ]
};
