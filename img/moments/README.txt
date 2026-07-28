【照片上传说明】

把双人合照放进这个文件夹（site/img/moments/），按以下名称命名即可自动显示在首页「我们的瞬间」：

  01.jpg
  02.jpg
  03.jpg
  04.jpg
  05.jpg
  06.jpg
  07.jpg
  08.jpg
  ……依次类推

注意：
1. 文件名必须是两位数字 + .jpg（如果你的照片是 png 格式，
   可以在 site/js/photos-data.js 里把对应的 "01.jpg" 改成 "01.png"）。
2. 每张照片下方的文字说明，在 site/js/photos-data.js 的 MOMENTS 数组里修改 cap 字段。
3. 想增加照片数量，就在 MOMENTS 数组里照格式多加几行。
4. 建议照片宽高比接近方形，显示效果最佳（拍立得相框为正方形取景）。
