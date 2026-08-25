// ===================== 岁岁年年 · 生日纪念 渲染 =====================
(function () {
  const body = document.getElementById("birthday-body");
  if (!body) return;

  const fmt = (d) => { const p = d.split("-"); return p[0] + "." + p[1]; };

  // 生日倒计时：并列展示Oliver（8/16）与 Tina（6/15）
  (function renderCountdown() {
    const box = document.getElementById("bd-countdown");
    if (!box) return;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const events = [
      { name: "Oliver", m: 7, d: 16 },   // 8/16
      { name: "Tina", m: 5, d: 15 }    // 6/15
    ];

    function daysTo(ev) {
      let year = now.getFullYear();
      let date = new Date(year, ev.m, ev.d);
      if (date < today) { date = new Date(year + 1, ev.m, ev.d); }
      return { diff: Math.round((date - today) / 86400000), md: (ev.m + 1) + "/" + ev.d };
    }

    function piece(ev) {
      const { diff, md } = daysTo(ev);
      if (diff === 0) {
        return '<span class="cd-unit"><b class="cd-name">' + ev.name +
          '</b><span class="cd-line"><span class="cd-text"> Birthday today 🎂</span></span></span>';
      }
      return '<span class="cd-unit"><b class="cd-name">' + ev.name +
        '</b><span class="cd-line"><span class="cd-text">Birthday in </span><b class="cd-num">' + diff +
        '</b><span class="cd-text">days · ' + md + '</span></span></span>';
    }

    box.innerHTML = events.map(piece).join('<span class="cd-divider">|</span>');
  })();


  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function renderPics(pics, hasVideo) {
    if (!pics || !pics.length) {
      // 有视频的卡片不显示「配图待补充」占位
      return hasVideo ? "" : '<div class="bd-pics bd-pics--empty">Original photos pending</div>';
    }
    // 配图已本地化托管：展示用压缩版 img/birthday/xxx.jpg，
    // 点击在新标签页打开原图 img/birthday/large/xxx.jpg
    return '<div class="bd-pics">' +
      pics.map((url) => {
        const large = url.startsWith("img/birthday/")
          ? url.replace("img/birthday/", "img/birthday/large/")
          : url;
        return '<img src="' + url + '" alt="" loading="lazy"' +
          ' onclick="window.open(\'' + large + '\', \'_blank\')">';
      }).join("") +
      "</div>";
  }

  // 视频卡：封面 + 播放按钮，点击后加载 B站播放器并暂停 BGM
  function renderVideo(video) {
    if (!video) return "";
    return '<div class="bd-video" data-bvid="' + video.bvid + '">' +
             '<img src="' + video.cover + '" alt="" loading="lazy">' +
             '<span class="bd-video-play">▶</span>' +
             '<span class="bd-video-title">' + escapeHtml(video.title || "") + "</span>" +
           "</div>";
  }

  // person: 寿星数据；from: 「谁写的祝福」；replyLabel: 「谁回复的」。person 为 null 时不渲染。
  function card(person, from, replyLabel) {
    if (!person) return "";
    const who = person.name + " · " + fmt(person.date);
    const wish = person.wish ? escapeHtml(person.wish)
      : '<span style="opacity:.5">No public post archived yet</span>';
    const link = person.link
      ? '<a class="bd-link" href="' + person.link + '" target="_blank" rel="noopener">View Weibo →</a>'
      : "";
    const reply = person.reply
      ? '<div class="bd-reply"><span class="bd-reply-label">' + replyLabel + "：</span>" + escapeHtml(person.reply) + "</div>"
      : "";
    const fromLine = person.video ? "" : '<div class="bd-from">' + from + "</div>";
    return '<div class="bd-card">' +
             '<div class="bd-who">' + who + "</div>" +
             fromLine +
             '<div class="bd-wish">' + wish + "</div>" +
             renderPics(person.pics, !!person.video) +
             renderVideo(person.video) +
             link +
             reply +
           "</div>";
  }

  // 按年份倒序；每年先Tina(6/15)后Oliver(8/16)
  BIRTHDAYS.forEach((y) => {
    const block = document.createElement("div");
    block.className = "yr-block";
    const cards =
      card(y.jun, "From Oliver", "Tina 的回复") +
      card(y.xiang, "From Tina", "Oliver 的回复");
    // 只有一张卡时加单卡样式（居中、不拉伸成两列）
    const single = (!y.jun || !y.xiang) ? " bd-grid--single" : "";
    block.innerHTML =
      '<div class="yr-title">' + y.year + "</div>" +
      '<div class="bd-grid' + single + '">' + cards + "</div>";
    body.appendChild(block);
  });

  // 视频封面点击 → 原位加载 B站播放器，同时暂停 BGM
  body.addEventListener("click", (e) => {
    const box = e.target.closest(".bd-video");
    if (!box || box.classList.contains("playing")) return;
    if (window.XLAudio && window.XLAudio.pauseForVideo) window.XLAudio.pauseForVideo();
    const bvid = box.getAttribute("data-bvid");
    box.classList.add("playing");
    box.innerHTML =
      '<iframe src="https://player.bilibili.com/player.html?bvid=' + bvid +
      '&autoplay=1&high_quality=1" allowfullscreen="true" frameborder="0" scrolling="no"></iframe>';
  });
})();
