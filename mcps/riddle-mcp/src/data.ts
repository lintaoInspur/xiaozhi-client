/**
 * 离线谜题库（适合 3-10 岁）
 *
 * 两类：
 *  - riddle：传统谜语，答案是一个具体事物（西瓜、太阳……）
 *  - brain ：脑筋急转弯，答案偏巧思
 * 每条含 question（念给孩子）、answer（判题用）、hint（答错时的小提示）。
 * 扩充只需往 RIDDLES 数组加条目。
 */

export type RiddleType = "riddle" | "brain";

export interface Riddle {
  type: RiddleType;
  question: string;
  answer: string;
  hint: string;
}

export const RIDDLES: Riddle[] = [
  // —— 传统谜语 ——
  { type: "riddle", question: "身穿绿衣裳，肚里水汪汪，生的孩子多，个个黑脸膛。打一种水果。", answer: "西瓜", hint: "夏天常吃，切开红红的、有黑籽。" },
  { type: "riddle", question: "一个老头，不跑不走，请他睡觉，他就摇头。打一物品。", answer: "不倒翁", hint: "你怎么推它，它都会晃回来。" },
  { type: "riddle", question: "白天见面，晚上不见，有它亮堂堂，没它黑漆漆。打一自然物。", answer: "太阳", hint: "清晨从东边升起，傍晚落下。" },
  { type: "riddle", question: "身子弯弯像小船，皮儿黄黄软又甜。打一种水果。", answer: "香蕉", hint: "猴子最爱吃，剥皮才能吃。" },
  { type: "riddle", question: "白胖娃娃泥里藏，清脆可口脆又香。打一蔬菜。", answer: "莲藕", hint: "长在水塘的泥里，切开有好多小洞。" },
  { type: "riddle", question: "一只鸟儿真稀奇，不会飞来只会跑，肚子底下藏宝宝。打一物品。", answer: "火车", hint: "在铁轨上跑，一节一节连起来。" },
  { type: "riddle", question: "圆圆脑袋小尾巴，身上穿着白褂褂，跳进锅里浮起来。打一食物。", answer: "汤圆", hint: "元宵节吃的，甜甜的。" },
  { type: "riddle", question: "千条线，万条线，掉到水里看不见。打一自然现象。", answer: "雨", hint: "从天上落下来，滋润小草。" },
  { type: "riddle", question: "小时青青老来黄，碾成白末做食粮。打一农作物。", answer: "水稻", hint: "金黄的田，能变成白米饭。" },
  { type: "riddle", question: "有头没有颈，身上冷冰冰，有翅不能飞，无脚也能行。打一动物。", answer: "鱼", hint: "在水里游，用鳃呼吸。" },

  // —— 脑筋急转弯 ——
  { type: "brain", question: "什么东西越洗越脏？", answer: "水", hint: "你用来洗别的东西，它自己却变脏了。" },
  { type: "brain", question: "什么帽子不能戴在头上？", answer: "螺丝帽", hint: "它拧在机器上，不是头上戴的。" },
  { type: "brain", question: "小明的爸爸有三个儿子，大儿子叫大毛，二儿子叫二毛，三儿子叫什么？", answer: "小明", hint: "题目开头已经说了是谁的爸爸啦。" },
  { type: "brain", question: "什么东西你有，别人也有，但合起来比分开更亮？", answer: "眼睛", hint: "两个人一起看，看到的更多（也可以回答：手电/灯）。" },
  { type: "brain", question: "什么车寸步难行？", answer: "风车", hint: "它一直转，但不会往前走。" },
  { type: "brain", question: "冬瓜、黄瓜、西瓜、南瓜都能吃，什么瓜不能吃？", answer: "傻瓜", hint: "这是一个形容人的词，不是真的瓜。" },
  { type: "brain", question: "什么时候有人敲门，你绝不会说“请进”？", answer: "上厕所的时候", hint: "那时候你可不想被人进来。" },
  { type: "brain", question: "把大象装进冰箱总共分几步？", answer: "三步", hint: "开门、把大象放进去、关门。" },
];
