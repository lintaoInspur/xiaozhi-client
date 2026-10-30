/**
 * 离线英语启蒙词库（适合 3-10 岁）
 *
 * 按主题组织，每个单词含：英文、中文、音标（近似）、emoji。
 * 扩充只需往 WORDS 对象里加主题或单词。
 */

export interface Word {
  en: string;
  zh: string;
  phonetic: string;
  emoji: string;
}

export const WORDS: Record<string, Word[]> = {
  颜色: [
    { en: "red", zh: "红色", phonetic: "/red/", emoji: "🔴" },
    { en: "blue", zh: "蓝色", phonetic: "/bluː/", emoji: "🔵" },
    { en: "yellow", zh: "黄色", phonetic: "/ˈjeləʊ/", emoji: "🟡" },
    { en: "green", zh: "绿色", phonetic: "/ɡriːn/", emoji: "🟢" },
    { en: "black", zh: "黑色", phonetic: "/blæk/", emoji: "⚫" },
    { en: "white", zh: "白色", phonetic: "/waɪt/", emoji: "⚪" },
  ],
  动物: [
    { en: "cat", zh: "猫", phonetic: "/kæt/", emoji: "🐱" },
    { en: "dog", zh: "狗", phonetic: "/dɒɡ/", emoji: "🐶" },
    { en: "fish", zh: "鱼", phonetic: "/fɪʃ/", emoji: "🐟" },
    { en: "bird", zh: "鸟", phonetic: "/bɜːd/", emoji: "🐦" },
    { en: "rabbit", zh: "兔子", phonetic: "/ˈræbɪt/", emoji: "🐰" },
    { en: "elephant", zh: "大象", phonetic: "/ˈelɪfənt/", emoji: "🐘" },
  ],
  数字: [
    { en: "one", zh: "一", phonetic: "/wʌn/", emoji: "1️⃣" },
    { en: "two", zh: "二", phonetic: "/tuː/", emoji: "2️⃣" },
    { en: "three", zh: "三", phonetic: "/θriː/", emoji: "3️⃣" },
    { en: "four", zh: "四", phonetic: "/fɔː/", emoji: "4️⃣" },
    { en: "five", zh: "五", phonetic: "/faɪv/", emoji: "5️⃣" },
    { en: "ten", zh: "十", phonetic: "/ten/", emoji: "🔟" },
  ],
  水果: [
    { en: "apple", zh: "苹果", phonetic: "/ˈæpl/", emoji: "🍎" },
    { en: "banana", zh: "香蕉", phonetic: "/bəˈnɑːnə/", emoji: "🍌" },
    { en: "orange", zh: "橘子", phonetic: "/ˈɒrɪndʒ/", emoji: "🍊" },
    { en: "grape", zh: "葡萄", phonetic: "/ɡreɪp/", emoji: "🍇" },
    { en: "watermelon", zh: "西瓜", phonetic: "/ˈwɔːtəmelən/", emoji: "🍉" },
    { en: "peach", zh: "桃子", phonetic: "/piːtʃ/", emoji: "🍑" },
  ],
  身体: [
    { en: "head", zh: "头", phonetic: "/hed/", emoji: "👶" },
    { en: "hand", zh: "手", phonetic: "/hænd/", emoji: "✋" },
    { en: "foot", zh: "脚", phonetic: "/fʊt/", emoji: "🦶" },
    { en: "eye", zh: "眼睛", phonetic: "/aɪ/", emoji: "👀" },
    { en: "nose", zh: "鼻子", phonetic: "/nəʊz/", emoji: "👃" },
    { en: "mouth", zh: "嘴巴", phonetic: "/maʊθ/", emoji: "👄" },
  ],
  食物: [
    { en: "rice", zh: "米饭", phonetic: "/raɪs/", emoji: "🍚" },
    { en: "egg", zh: "鸡蛋", phonetic: "/eɡ/", emoji: "🥚" },
    { en: "milk", zh: "牛奶", phonetic: "/mɪlk/", emoji: "🥛" },
    { en: "bread", zh: "面包", phonetic: "/bred/", emoji: "🍞" },
    { en: "water", zh: "水", phonetic: "/ˈwɔːtə/", emoji: "💧" },
    { en: "cake", zh: "蛋糕", phonetic: "/keɪk/", emoji: "🍰" },
  ],
};

export const THEMES = Object.keys(WORDS);
