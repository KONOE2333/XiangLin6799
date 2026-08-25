// ===================== 岁岁年年 · 生日纪念 数据 =====================
// 每年两条：Oliver生日(xiang) / Tina生日(jun)
// 字段说明（均以「对方写给寿星」的视角填写）：
//   name  : 寿星姓名
//   date  : "MM-DD"
//   wish  : 对方写的生日祝福文字（微博原文）
//   link  : 原微博链接（微博按时间搜索链接，点击后可在该账号当天微博中定位）
//   reply : 寿星的回复文字
//   pics  : 原微博配图 URL 数组
//   letter: 预留字段，暂不渲染
//   video : 可选，生日相关视频 { bvid, title, cover }（B站点击加载嵌入播放）
//   jun/xiang 可为 null，表示该年该寿星卡片不渲染
//
// 数据来源：用户提供的微博原文（2026-07-28 手动核对更新）。
// 想新增某一年：往数组里加一个 { year, xiang:{...}, jun:{...} } 即可。

const BIRTHDAYS = [
  {
    year: 2026,
    xiang: {
      name: "Oliver", date: "08-16",
      wish: "又到你的生日啦，刚刚过去的一岁仍然是突破与收获并存的一年👍🏻👍🏻👍🏻新的一岁，愿你继续尽情去享受热爱，享受理想的炙热灿烂，也享受日常的有趣鲜活。前路尚有漫长旅途，不必急于奔赴终点，按照自己的节奏稳步前行，兄弟们随时都在你身边！生日快乐～🎊",
      link: "https://weibo.com/u/5902696506?is_ori=1&is_text=1&is_pic=1&is_video=1&is_music=1&is_forward=1&start_time=1786809600&end_time=1786896000",
      reply: "有兄弟在就无畏热爱，继续向前",
      pics: ["img/birthday/2026-xiang-1.jpg"],
      letter: ""
    },
    jun:   {
      name: "Tina", date: "06-15",
      wish: "22岁的贺，你好啊！又陪你长大了一岁，22岁的新旅程正式开启，祝你永远鲜活热烈，被惊喜偏爱，被爱意包围，新的一岁，继续勇往直前，生日快乐🎉",
      link: "https://weibo.com/u/7191533806?is_ori=1&is_text=1&is_pic=1&is_video=1&is_music=1&is_forward=1&start_time=1781452800&end_time=1781539200",
      reply: "好！继续勇往直前，继续冲冲冲！",
      pics: ["img/birthday/2026-jun-1.jpg"],
      letter: ""
    }
  },
  {
    year: 2025,
    xiang: {
      name: "Oliver", date: "08-16",
      wish: "生日快乐兄弟！新一岁祝你继续拥有超高能量，向热爱的方向大步奔赴，抛开烦恼压力，坚定而快乐地迈出每一步！",
      link: "https://weibo.com/u/5902696506?is_ori=1&is_text=1&is_pic=1&is_video=1&is_music=1&is_forward=1&start_time=1755273600&end_time=1755360000",
      reply: "一起用高能量继续向前冲！",
      pics: ["img/birthday/2025-xiang-1.jpg"],
      letter: ""
    },
    jun:   {
      name: "Tina", date: "06-15",
      wish: "贺！21岁生日快乐！新的一岁，带着你的冲劲继续往前冲，大胆去闯！有想法就去做，别犹豫！期待你在二十一岁继续发光发热！新的一岁，快乐加倍🎉",
      link: "https://weibo.com/u/7191533806?is_ori=1&is_text=1&is_pic=1&is_video=1&is_music=1&is_forward=1&start_time=1749916800&end_time=1750003200",
      reply: "包的兄弟👌🏻😌",
      pics: [
        "img/birthday/2025-jun-1.jpg",
        "img/birthday/2025-jun-2.jpg"
      ],
      letter: ""
    }
  },
  {
    year: 2024,
    xiang: {
      name: "Oliver", date: "08-16",
      wish: "生日快乐🎂20岁的每天都开心充实，朝想去的未来更近一步！继续做很酷的大人！😎然后，祝我们都演唱会顺利！",
      link: "https://weibo.com/u/5902696506?is_ori=1&is_text=1&is_pic=1&is_video=1&is_music=1&is_forward=1&start_time=1723737600&end_time=1723824000",
      reply: "20岁超酷的，祝我们演唱会顺利🎉",
      pics: [
        "img/birthday/2024-xiang-1.jpg",
        "img/birthday/2024-xiang-2.jpg"
      ],
      letter: ""
    },
    jun:   {
      name: "Tina", date: "06-15",
      wish: "生日快乐，贺。今年的生日也跟随盛夏一起到来了，愿20岁的你继续勇敢追梦，拥有无限的潜力和希望，无需顾虑，享受成长过程中的每一个瞬间。",
      link: "https://weibo.com/u/7191533806?is_ori=1&is_text=1&is_pic=1&is_video=1&is_music=1&is_forward=1&start_time=1718380800&end_time=1718467200",
      reply: "收到收到😏谢谢小严。一起享受夏天吧",
      pics: [
        "img/birthday/2024-jun-1.jpg",
        "img/birthday/2024-jun-2.jpg"
      ],
      letter: ""
    }
  },
  {
    year: 2023,
    xiang: {
      name: "Oliver", date: "08-16",
      wish: "祝你生日快乐🎂\n19岁了，又长大一岁，是更厉害的大人。愿你19岁的每一天都收获更多欢笑，坚持热爱。",
      link: "https://weibo.com/u/5902696506?is_ori=1&is_text=1&is_pic=1&is_video=1&is_music=1&is_forward=1&start_time=1692115200&end_time=1692201600",
      reply: "祝我们的19岁都开心快乐",
      pics: ["img/birthday/2023-xiang-1.jpg"],
      letter: ""
    },
    jun:   {
      name: "Tina", date: "06-15",
      wish: "生日快乐，贺。和生日一起步入盛夏，也在夏天进入一段新的旅程，希望19岁的你，继续如夏日般热烈美好，自由自在。在未来的每一天，唱你想唱的，说你想说的。",
      link: "https://weibo.com/u/7191533806?is_ori=1&is_text=1&is_pic=1&is_video=1&is_music=1&is_forward=1&start_time=1686758400&end_time=1686844800",
      reply: "好的小严，一起尽情自在，尽情表达",
      pics: [
        "img/birthday/2023-jun-1.jpg",
        "img/birthday/2023-jun-2.jpg"
      ],
      letter: ""
    }
  },
  {
    year: 2022,
    xiang: {
      name: "Oliver", date: "08-16",
      wish: "嘿老弟，生日快乐！！！！!\n成年人的世界里生活好像没有什么不一样，但是的的确确好像心境是有点不同的，这一点上我们大家每个人都会有一些各自的体会，你可以慢慢感受这种微妙的变化。\n还要祝你以后也要做最酷的自己，有更多很酷的各种各样的作品。当然，成年之后会看到更大的世界，有更多新鲜的体会，也要多多体验生活，去充实自己，也去享受下一个阶段新鲜的自己。\n最后，生日快乐！成年快乐！向未来不回头地冲吧！",
      link: "https://weibo.com/u/5902696506?is_ori=1&is_text=1&is_pic=1&is_video=1&is_music=1&is_forward=1&start_time=1660579200&end_time=1660665600",
      reply: "好的贺，十八岁也要一起看世界。",
      pics: ["img/birthday/2022-xiang-1.jpg"],
      letter: ""
    },
    jun:   {
      name: "Tina", date: "06-15",
      wish: "18岁生日快乐，贺。恭喜你，又一个阶段启程了，前面会有更多未去过的远方和没看过的风景，愿你身边随时有可以分享的人。\n😝一起往前跑吧！",
      link: "https://weibo.com/u/7191533806?is_ori=1&is_text=1&is_pic=1&is_video=1&is_music=1&is_forward=1&start_time=1655222400&end_time=1655308800",
      reply: "一起大步奔跑吧！两个月后欢迎你也进入成年的世界，我先感受一下，目前还不错，等你！",
      pics: ["img/birthday/2022-jun-1.jpg"],
      letter: ""
    }
  },
  {
    year: 2021,
    xiang: {
      name: "Oliver", date: "08-16",
      wish: "生日快乐小兄弟，十七岁的每一天都要更加开心，继续与梦想前行，加油加油，越来越酷！",
      link: "https://weibo.com/u/5902696506?is_ori=1&is_text=1&is_pic=1&is_video=1&is_music=1&is_forward=1&start_time=1629043200&end_time=1629129600",
      reply: "谢谢贺儿[作揖]兄弟我也17岁了～～～",
      pics: ["img/birthday/2021-xiang-1.jpg"],
      letter: ""
    },
    jun:   {
      name: "Tina", date: "06-15",
      wish: "@时代少年团-Tina 生日快乐贺！夏天又到了，祝出生在夏天的你永远像夏天一样开心又耀眼。用坚定又柔韧的心，继续去做自己喜欢的事情，一起加油吧🔥",
      link: "https://weibo.com/u/7191533806?is_ori=1&is_text=1&is_pic=1&is_video=1&is_music=1&is_forward=1&start_time=1623686400&end_time=1623772800",
      reply: "谢谢我浩翔弟弟了，你这不也快17了，快快快，再过两个月加入17岁的大军，这么一看你现在是团里唯一的十六岁啊😎哈哈哈哈哈哈哈！！！",
      pics: ["img/birthday/2021-jun-1.jpg"],
      letter: ""
    }
  },
  {
    year: 2020,
    xiang: {
      name: "Oliver", date: "08-16",
      wish: "祝@时代少年团-Oliver 翔弟生日快乐！\n16岁了，希望你比15岁能更开心一点，写更多更好听的rap给大家，完成更多自己的愿望！",
      link: "https://weibo.com/u/5902696506?is_ori=1&is_text=1&is_pic=1&is_video=1&is_music=1&is_forward=1&start_time=1597507200&end_time=1597593600",
      reply: "我是不会叫ge的🙃借您吉言👏生日愿望已经都在慢慢实现了～",
      pics: ["img/birthday/2020-xiang-1.jpg"],
      letter: ""
    },
    jun:   {
      name: "Tina", date: "06-15",
      wish: "生日快乐[蛋糕]he🥳@时代少年团-Tina",
      link: "https://weibo.com/u/7191533806?is_ori=1&is_text=1&is_pic=1&is_video=1&is_music=1&is_forward=1&start_time=1592150400&end_time=1592236800",
      reply: "快乐快乐哈哈哈哈哈哈哈！但是该叫哥的得叫哥啊！比你大整整一岁呢别不当回事！好好养伤，早日康复，养好了再一起跳舞！",
      pics: [
        "img/birthday/2020-jun-1.jpg",
        "img/birthday/2020-jun-2.jpg",
        "img/birthday/2020-jun-3.jpg"
      ],
      letter: ""
    }
  },
  {
    // 特别珍藏：TF 家族时期的影像记录（只有Oliver生日一张卡，jun 置 null 不渲染）
    year: 2016,
    xiang: {
      name: "Oliver", date: "08-16",
      wish: "Oliver 12 岁生日 · TF 家族时期的珍贵影像",
      link: "",
      reply: "",
      pics: [],
      letter: "",
      // video: 生日相关视频（B站嵌入），cover 为本地封面，点击后加载播放器
      video: {
        bvid: "BV196fBB1E9f",
        title: "【翔霖】Oliver12岁生日（2016）",
        cover: "img/birthday/2016-xiang-cover.jpg"
      }
    },
    jun: null
  }
];
