// ===================== 舞台高光 · 视频数据 =====================
// 三种呈现方式（type）：
//   "embed"  直接内嵌播放（推荐）—— 用 B站 / YouTube 的「嵌入链接」
//   "link"   点击跳转到外部链接（新标签页打开），适合无法嵌入的视频
//   "local"  本地视频 —— 把 mp4 放进 site/video/，src 写 "video/xxx.mp4"
// B站嵌入链接格式：https://player.bilibili.com/player.html?bvid=BVxxxx&autoplay=0
// 想新增视频：往数组里加一项即可，页面会自动渲染。
// （本地视频示例：
//   { title:"本地片段", sub:"本地", type:"local", src:"video/clip1.mp4", platform:"本地" },
// )

const VIDEOS = [
  {
    title: "严浩翔 / 贺峻霖《耻辱柱》官摄修音版",
    sub: "双人合作舞台",
    type: "embed",
    src: "https://player.bilibili.com/player.html?bvid=BV1mxxWeeE5r&autoplay=0",
    cover: "http://i0.hdslb.com/bfs/archive/5c2b2f87d709cd6d2ef34f8e10ff96c7b79699ab.jpg",
    platform: "Bilibili"
  },
  {
    title: "《做我的猫》Cover",
    sub: "翔霖双人舞台 · 人猫共舞",
    type: "embed",
    src: "https://player.bilibili.com/player.html?bvid=BV1Dy4y1k7d5&autoplay=0",
    cover: "http://i0.hdslb.com/bfs/archive/9a8636401cc73ba4e2d31ccdb0ead63375d95fb6.jpg",
    platform: "Bilibili"
  },
  {
    title: "《我想了太多关于你的形容》Cover",
    sub: "时代少年团 TNT",
    type: "embed",
    src: "https://player.bilibili.com/player.html?bvid=BV1JT4y1u7px&autoplay=0",
    cover: "http://i2.hdslb.com/bfs/archive/22788e33c0acd931e2f9f97cf5f5d895d85877e4.jpg",
    platform: "Bilibili"
  },
  {
    title: "《花园》+《我想了太多关于你的形容》纯享",
    sub: "五月粉丝见面会实况",
    type: "embed",
    src: "https://player.bilibili.com/player.html?bvid=BV1fy4y1K75G&autoplay=0",
    cover: "http://i1.hdslb.com/bfs/archive/9695e348d0ba86e5607597dd9432d77f10d95a00.jpg",
    platform: "Bilibili"
  },
  {
    title: "《屋顶着火》3D环绕",
    sub: "严浩翔 × 贺峻霖",
    type: "embed",
    src: "https://player.bilibili.com/player.html?bvid=BV11B4y1P7GM&autoplay=0",
    cover: "http://i2.hdslb.com/bfs/archive/a12ebb5a5e2bf34a0d606a34356e4dec790ad886.jpg",
    platform: "Bilibili"
  },
  {
    title: "《茫》双人合作舞台",
    sub: "『冠岁』海口演唱会 · 官摄版",
    type: "embed",
    src: "https://player.bilibili.com/player.html?bvid=BV1QMjbztEnF&autoplay=0",
    cover: "http://i2.hdslb.com/bfs/archive/c783dcb57a9023f1b97beb568cdebd7de9a3f4b3.jpg",
    platform: "Bilibili"
  }
];
