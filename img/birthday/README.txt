生日纪念板块配图（已本地化托管，2026-07-28）

命名规则：
  {年份}-{寿星}-{序号}.jpg
  jun   = 贺峻霖生日（6/15，严浩翔发的微博配图）
  xiang = 严浩翔生日（8/16，贺峻霖发的微博配图）
  例：2024-jun-1.jpg = 2024 年严浩翔祝贺峻霖生日微博的第 1 张配图

目录结构：
  本目录        = 压缩展示版（最长边 1200px，页面加载用）
  large/        = 微博原图（点击图片新标签页打开）
  两边文件名一一对应。

新增图片步骤：
  1. 原图放入 large/，按命名规则取名；
  2. 生成压缩版放本目录：sips -Z 1200 -s format jpeg -s formatOptions 78 large/xxx.jpg --out xxx.jpg
  3. 在 js/birthday-data.js 对应年份的 pics 数组加 "img/birthday/xxx.jpg"。

这些生日配图也会自动进入「照片球」；只要在 BIRTHDAYS 数据里出现，
照片球会按现有 GALLERY 派生逻辑自动收录。
