// 图库数据由首页瞬间和生日配图派生，避免两处重复维护图片路径。
(function () {
  "use strict";
  const moments = (typeof MOMENTS !== "undefined") ? MOMENTS : [];
  const birthdays = (typeof BIRTHDAYS !== "undefined") ? BIRTHDAYS : [];
  const extraFiles = window.GALLERY_EXTRA || [];
  const GALLERY_ROOT = "img/gallery/";
  const items = [];

  moments.forEach((p, i) => {
    items.push({
      id: "moment-" + (i + 1),
      src: GALLERY_ROOT + "moments/" + p.file,
      large: null,
      alt: p.alt || p.cap || "翔霖瞬间",
      title: p.cap || "首页瞬间",
      year: p.year || null,
      source: "首页瞬间",
      tags: ["首页瞬间"]
    });
  });

  birthdays.forEach((y) => {
    function add(person, key) {
      if (!person || !person.pics || !person.pics.length) return;
      person.pics.forEach((url, idx) => {
        const title = y.year + " · " + person.name + "生日 · " +
          (key === "jun" ? "严浩翔的祝福配图" : "贺峻霖的祝福配图");
        items.push({
          id: "birthday-" + y.year + "-" + key + "-" + idx,
          src: url.replace("img/birthday/", GALLERY_ROOT + "birthday/"),
          large: "",
          alt: title,
          title,
          year: y.year,
          source: "生日照片",
          tags: ["生日照片", String(y.year), person.name + "生日"]
        });
      });
    }
    add(y.jun, "jun");
    add(y.xiang, "xiang");
  });

  extraFiles.forEach((file, i) => {
    items.push({
      id: "extra-" + (i + 1),
      src: GALLERY_ROOT + "extra/" + file,
      large: "",
      alt: "照片库照片 " + file,
      title: "照片库 " + file,
      year: null,
      source: "照片库",
      tags: ["照片库"]
    });
  });

  window.GALLERY = items;
})();
