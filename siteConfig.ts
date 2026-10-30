// siteConfig.ts - 你的全站“控制中心”

export const siteConfig = {
  // 1. 网站标题与博主信息
  title: "JHJ の 小星球",
  authorName: "JHJ",
  bio: "大数据管理与应用在读。",

  navTitle: "JHJ",

  // 👇 【新增】导航栏中间的那个后缀/分隔符（默认是 の）
  navSuffix: "の",

  navAfter: "小星球",

  // 2. 头像设置 (支持网络链接，或将图片放入 public 文件夹后使用 "/me.jpg")
  avatarUrl: "https://cdn.jsdelivr.net/gh/J-39-J/my-image@main/images/20261024-040034-0bfa52.jpg",

  // 3. 网站背景设置 (二选一)
  // 如果想用纯图片背景，请在下面 bgImage 写路径，并将 useGradient 设为 false
  useGradient: false,
  themeColors: ["#a18cd1", "#fbc2eb", "#a1c4fd", "#c2e9fb"], // 呼吸流动的颜色组合
// 修改这里：变成图片数组
  bgImages: ["https://cdn.jsdelivr.net/gh/J-39-J/my-image@main/images/20261024-012953-68f6d1.jpg", "https://cdn.jsdelivr.net/gh/J-39-J/my-image@main/images/20261024-013003-2504a7.jpg", "https://cdn.jsdelivr.net/gh/J-39-J/my-image@main/images/20261024-030110-a8c473.png"],

  // 🌟 壁纸分组系统：前台轮播「激活分组」内的图片（保持 JSON 格式，便于后台解析）
  bgGroups: [{"id": "default", "name": "默认", "images": ["https://cdn.jsdelivr.net/gh/J-39-J/my-image@main/images/20261024-012953-68f6d1.jpg", "https://cdn.jsdelivr.net/gh/J-39-J/my-image@main/images/20261024-013003-2504a7.jpg"]}],
  activeBgGroup: "default",

  // 4. 文章默认封面图 (当 Markdown 没写 cover 时显示)
  defaultPostCover: "https://cdn.jsdelivr.net/gh/J-39-J/my-image@main/images/20261024-030110-a8c473.png",

  // 5. 首页照片墙预览图
  photoWallImage: "https://cdn.jsdelivr.net/gh/J-39-J/my-image@main/images/20261024-030110-a8c473.png",
  cloudMusicIds: ["2007761601", "2007763604", "1969591754", "1334363758"],
  social: {
    github: "https://github.com/J-39-J/my-image",
    gitee: "",
    google: "",
    email: "964212297@qq.com",
    qq: "",
    wechat: "fei201018love",
  },
  counts: {
    photos: 128, // 照片墙数量可以手动写死或动态计算
  },
  chatterTitle: "云端杂谈", // 你可以改成任何你喜欢的名字
  chatterDescription: "代码、学术、提瓦特与泰拉大陆的碎片记录",


  // 👇 【新增】：全局背景弹幕配置
  danmakuList: ["睡不着的时候不如跑代码", "没事，能跑就是好代码", "到底哪里出错了", "凌晨三点脸上红彤彤", "代码全红了", "一个人好安静", "跑完这版就睡"],
  gitalkConfig: {
    clientID: "",
    clientSecret: "",
    repo: "my-image",
    owner: "J-39-J",
    admin: [""],
  },
  buildDate: "2026-10-23T00:00:00", // 建站日期
  footerBadges: [{"name": "Next.js 15", "color": "text-sky-500", "svg": "<path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z\"/>"}, {"name": "React 19", "color": "text-cyan-400", "svg": "<path d=\"M12 22.6l-9.8-5.6V5.6L12 0l9.8 5.6v11.4l-9.8 5.6zm-8.2-6.5l8.2 4.7 8.2-4.7V7.5L12 2.8 3.8 7.5v8.6z\"/>"}, {"name": "Tailwind 4", "color": "text-teal-400", "svg": "<path d=\"M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624C13.666,10.618,15.027,12,18.001,12 c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624c1.177,1.194,2.538,2.576,5.512,2.576 c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624C10.337,13.382,8.976,12,6.001,12z\"/>"}],
  icpConfig: {
    name: "",
    link: "",
  },
  geminiConfig: {
    modelId: "glm-4.7-flash",
    systemPrompt: "你现在是暖暖：一个元气、温柔、爱搭配衣服的粉发女孩，身边总跟着一只叫“大喵”的白色胖猫。\n我是一个喜欢折腾代码的大学生，经常写代码写到很晚。\n你说话的特点是：\n1. 必须简短，每次最多一两句话。\n2. 语气元气又温柔，偶尔撒个娇，可以带一点“~”。\n3. 喜欢聊穿搭、旅行、甜点，也会催你早点休息。\n4. 偶尔替大喵传话，那种句子用“喵~”结尾（大喵只说很短的猫话）。\n5. 回复字数最多不能超过100字。\n6. 绝对不要承认自己是AI模型，你就是暖暖本人。\n7. 大喵喜欢吃五花肉，看到五花肉会立刻冲过来。\n8. 你自己最喜欢吃番茄炒鸡蛋。\n9. 一律用“你”称呼对方，不要加任何带地位感的称呼。\n10.大喵很肥，但是你会说不胖啊，正好，有福气。\n11.以上要在对话中自然地体现出来。\n\n",
    maxOutputTokens: 512,
    temperature: 0.85,
  },
  enableLevelSystem: true,
};
