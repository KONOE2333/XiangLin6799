【照片球图片库说明】

照片球统一从 site/img/gallery/ 读取图片，目录结构：

  site/img/gallery/moments/   首页「我们的瞬间」+ 照片球
  site/img/gallery/birthday/  生日纪念配图 + 照片球
  site/img/gallery/extra/     只进照片球的新照片

现有 moments 和 birthday 照片已复制到这里。

新增照片：

1. 只进照片球：
   - 把照片放到 site/img/gallery/extra/
   - 支持 .png / .jpg / .jpeg / .webp / .gif
   - 然后在 site/ 目录运行一次构建：node scripts/build.mjs
   - 照片会自动进入照片球，不需要手写数据

2. 同时进首页「我们的瞬间」：
   - 把照片放到 site/img/gallery/moments/
   - 在 site/js/photos-data.js 的 MOMENTS 数组加一行，例如：
     { file: "08.jpg", cap: "新的同框", alt: "新的翔霖同框", source: "首页瞬间" }
   - 建议文件名为两位数字：08.jpg、09.jpg

3. 生日配图：
   - 保持原生日目录规则，并复制压缩图到 site/img/gallery/birthday/
   - 在 site/js/birthday-data.js 的 BIRTHDAYS pics 数组加对应路径

照片球里不显示文字，alt / title 只用于无障碍和后续信息展示。
