// ===================== 舞台高光 · 渲染 + 分类筛选 =====================
(function () {
  const grid = document.getElementById("stages-body");
  if (!grid) return;

  let overlay = null; // 当前打开的播放器浮层

  // 关闭浮层：移除 DOM、恢复 BGM
  function closePlayer() {
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
    if (window.XLAudio) window.XLAudio.resumeAfterVideo();
  }

  // 打开一个居中的独立播放器浮层（直接挂在 body，避免被父元素层叠影响）
  function openPlayer(v) {
    closePlayer(); // 先关掉旧的，保证只播一个

    const box = document.createElement("div");
    box.className = "stage-player-box";

    let mediaHtml = "";
    if (v.type === "embed") {
      // autoplay=1 让点击后直接开播
      mediaHtml = '<iframe src="' + v.src.replace("autoplay=0", "autoplay=1") +
        '" allow="autoplay; encrypted-media; fullscreen" allowfullscreen frameborder="0"></iframe>';
    } else if (v.type === "local") {
      mediaHtml = '<video src="' + v.src + '" controls autoplay></video>';
    }

    box.innerHTML =
      '<button class="stage-close" type="button" aria-label="关闭">×</button>' +
      '<div class="stage-player-media">' + mediaHtml + "</div>";

    box.querySelector(".stage-close").addEventListener("click", (e) => {
      e.stopPropagation();
      closePlayer();
    });

    overlay = document.createElement("div");
    overlay.className = "stage-player-overlay";
    overlay.appendChild(box);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closePlayer();
    });

    document.body.appendChild(overlay);
    if (window.XLAudio) window.XLAudio.pauseForVideo(); // 看视频时暂停 BGM
  }

  VIDEOS.forEach((v) => {
    const card = document.createElement("div");
    card.className = "stage-card";
    if (v.type === "link") card.classList.add("is-link");

    const badge = v.platform ? '<span class="stage-badge">' + v.platform + "</span>" : "";
    const thumb = v.cover
      ? '<img class="stage-thumb" src="' + v.cover + '" alt="" loading="lazy" referrerpolicy="no-referrer">'
      : "";

    card.innerHTML =
      '<div class="stage-cover">' + thumb + '<span class="stage-play">▶</span>' + badge + "</div>" +
      '<div class="stage-meta"><h3>' + v.title + "</h3><p>" + (v.sub || "") + "</p></div>";

    const cover = card.querySelector(".stage-cover");

    if (v.type === "embed" || v.type === "local") {
      cover.addEventListener("click", () => openPlayer(v));
    } else { // link：新标签页打开
      cover.addEventListener("click", () => window.open(v.url, "_blank", "noopener"));
    }

    grid.appendChild(card);
  });

  // ESC 关闭
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePlayer(); });
})();
