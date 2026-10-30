/**
 * 离线诗词/儿歌/绕口令库（适合 3-10 岁）
 *
 * type: 古诗 | 儿歌 | 绕口令
 * 古诗为经典短篇（含作者）；儿歌为常见童谣歌词；绕口令用于口齿练习。
 * 扩充只需往 POEMS 数组加条目。
 */

export type PoemType = "古诗" | "儿歌" | "绕口令";

export interface Poem {
  type: PoemType;
  title: string;
  author?: string;
  content: string;
  /** 建议最小年龄（岁） */
  age: number;
}

export const POEMS: Poem[] = [
  // —— 古诗 ——
  { type: "古诗", title: "咏鹅", author: "骆宾王", age: 3, content: "鹅，鹅，鹅，曲项向天歌。白毛浮绿水，红掌拨清波。" },
  { type: "古诗", title: "静夜思", author: "李白", age: 4, content: "床前明月光，疑是地上霜。举头望明月，低头思故乡。" },
  { type: "古诗", title: "春晓", author: "孟浩然", age: 4, content: "春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。" },
  { type: "古诗", title: "悯农", author: "李绅", age: 5, content: "锄禾日当午，汗滴禾下土。谁知盘中餐，粒粒皆辛苦。" },
  { type: "古诗", title: "登鹳雀楼", author: "王之涣", age: 5, content: "白日依山尽，黄河入海流。欲穷千里目，更上一层楼。" },
  { type: "古诗", title: "池上", author: "白居易", age: 4, content: "小娃撑小艇，偷采白莲回。不解藏踪迹，浮萍一道开。" },
  { type: "古诗", title: "小池", author: "杨万里", age: 5, content: "泉眼无声惜细流，树阴照水爱晴柔。小荷才露尖尖角，早有蜻蜓立上头。" },
  { type: "古诗", title: "村居", author: "高鼎", age: 5, content: "草长莺飞二月天，拂堤杨柳醉春烟。儿童散学归来早，忙趁东风放纸鸢。" },
  { type: "古诗", title: "所见", author: "袁枚", age: 4, content: "牧童骑黄牛，歌声振林樾。意欲捕鸣蝉，忽然闭口立。" },
  { type: "古诗", title: "古朗月行（节选）", author: "李白", age: 4, content: "小时不识月，呼作白玉盘。又疑瑶台镜，飞在青云端。" },

  // —— 儿歌 ——
  { type: "儿歌", title: "两只老虎", age: 2, content: "两只老虎，两只老虎，跑得快，跑得快，一只没有耳朵，一只没有尾巴，真奇怪，真奇怪。" },
  { type: "儿歌", title: "小星星", age: 2, content: "一闪一闪亮晶晶，满天都是小星星，挂在天上放光明，好像许多小眼睛。" },
  { type: "儿歌", title: "找朋友", age: 2, content: "找呀找呀找朋友，找到一个好朋友，敬个礼，握握手，你是我的好朋友。" },
  { type: "儿歌", title: "数鸭子", age: 3, content: "门前大桥下游过一群鸭，快来快来数一数，二四六七八。嘎嘎嘎嘎，真呀真多呀。" },
  { type: "儿歌", title: "拔萝卜", age: 3, content: "拔萝卜，拔萝卜，嘿哟嘿哟拔萝卜，老婆婆快快来，快来帮我们拔萝卜。" },
  { type: "儿歌", title: "世上只有妈妈好", age: 3, content: "世上只有妈妈好，有妈的孩子像块宝，投进妈妈的怀抱，幸福享不了。" },

  // —— 绕口令 ——
  { type: "绕口令", title: "四是四", age: 5, content: "四是四，十是十，十四是十四，四十是四十。谁说十四是四十，就打谁十四；谁说四十是十四，就打谁四十。" },
  { type: "绕口令", title: "葡萄皮", age: 5, content: "吃葡萄不吐葡萄皮，不吃葡萄倒吐葡萄皮。" },
  { type: "绕口令", title: "板凳与扁担", age: 6, content: "板凳宽，扁担长，扁担绑在板凳上。板凳不让扁担绑在板凳上，扁担偏要绑在板凳上。" },
  { type: "绕口令", title: "灰化肥", age: 6, content: "灰化肥发黑，黑化肥发灰。灰化肥发黑会挥发，黑化肥发灰会发挥。" },
  { type: "绕口令", title: "胖娃娃", age: 5, content: "一个胖娃娃，抓了三个大花活蛤蟆；三个胖娃娃，抓了一个大花活蛤蟆。" },
];
