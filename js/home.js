// 通用转义（供音乐列表 / 日志渲染使用）
function escapeHtml2(s) {
  return (s || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ===================== 相识 xx 年 xx 月 → 重逢 xx 天 =====================
(function () {
  const yEl = document.getElementById("met-years");
  const mEl = document.getElementById("met-months");
  const reunionLine = document.getElementById("reunion-line");
  const rEl = document.getElementById("reunion-days");

  const now = new Date();
  const meet = new Date(MEET_DATE);

  // 相识总月数（月份粒度）
  let totalMonths = (now.getFullYear() - meet.getFullYear()) * 12 + (now.getMonth() - meet.getMonth());
  if (totalMonths < 0) totalMonths = 0;

  // 重逢总天数
  const reunionDays = Math.floor((Date.now() - new Date(REUNION_DATE).getTime()) / 86400000);

  // 第一段：相识年月从 0 涨到目标（按真实耗时推进，不因低帧率/卡顿变慢）
  let cur = 0;
  const cStart = performance.now();
  const cDur = Math.max(1, totalMonths) * 14;
  (function frame(now) {
    const p = Math.min(1, (now - cStart) / cDur);
    cur = Math.round(totalMonths * p);
    yEl.textContent = Math.floor(cur / 12);
    mEl.textContent = cur % 12;
    if (p < 1) requestAnimationFrame(frame);
    else showReunion();
  })(performance.now());

  // 第二段：重逢天数跳动到目标（同样按真实耗时）
  function showReunion() {
    setTimeout(() => {
      reunionLine.classList.add("show");
      const rStart = performance.now();
      const rDur = 110 * 16;
      (function frame2(now) {
        const p = Math.min(1, (now - rStart) / rDur);
        const d = Math.round(reunionDays * p);
        rEl.textContent = d.toLocaleString();
        if (p < 1) requestAnimationFrame(frame2);
      })(performance.now());
    }, 350);
  }
})();

// ===================== 我们的瞬间（拍立得浮在首页文字之上，看似随机实则互不重叠、完整可见） =====================
(function () {
  const btn = document.getElementById("moments-btn");
  const layer = document.getElementById("polaroid-layer");
  const DIR = "img/moments/";
  let shown = false;
  let timers = [];

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function show() {
    layer.innerHTML = "";
    const n = MOMENTS.length;
    if (!n) return;

    const W = window.innerWidth, H = window.innerHeight;
    const vw = W / 100, vh = H / 100;
    // 按屏幕比例选网格：每张照片都有足够大的“格子”，看起来随机、其实互不重叠
    const aspect = W / H;
    let cols = Math.max(1, Math.round(Math.sqrt(n * aspect)));
    let rows = Math.ceil(n / cols);
    const cells = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) cells.push({ c, r });
    shuffle(cells);
    const used = cells.slice(0, n);
    const cellW = W / cols, cellH = H / rows;

    MOMENTS.forEach((p, i) => {
      const cell = used[i];
      const card = document.createElement("div");
      card.className = "polaroid";
      const rot = (Math.random() * 8 - 4).toFixed(1);
      card.style.setProperty("--rot", rot + "deg");
      // 不显示任何文字，只保留白边拍立得相框
      card.innerHTML = '<div class="frame"><img src="' + DIR + p.file + '" alt="' + (p.cap || "") + '"></div>';
      const img = card.querySelector("img");

      const place = (ar) => {
        ar = ar > 0 ? ar : 0.8;                 // ar = 宽/高
        const vwCap = window.innerWidth < 600 ? 38 : 26;   // 手机端照片更大
        let w = Math.min(cellW * 0.86, vwCap * vw);
        let h = w / ar;
        if (h > cellH * 0.82) { h = cellH * 0.82; w = h * ar; }   // 超高图按高度收住，保证完整可见
        const cx = (cell.c + 0.5) * cellW;
        const cy = (cell.r + 0.5) * cellH;
        const jx = (Math.random() * 2 - 1) * Math.max(0, (cellW - w) / 2) * 0.55;
        const jy = (Math.random() * 2 - 1) * Math.max(0, (cellH - h) / 2) * 0.55;
        let left = cx + jx - w / 2;
        let top = cy + jy - h / 2;
        left = Math.max(6, Math.min(left, W - w - 6));
        top = Math.max(78, Math.min(top, H - h - 6));   // 顶部给导航留白，底部不超出屏幕
        card.style.width = w + "px";
        card.style.height = h + "px";
        card.style.left = left + "px";
        card.style.top = top + "px";
      };

      img.onload = function () {
        const ar = (this.naturalWidth && this.naturalHeight) ? this.naturalWidth / this.naturalHeight : 0.8;
        place(ar);
      };
      img.onerror = function () {
        this.parentElement.innerHTML = '<span class="ph-star">✦</span>';
        place(0.8);
      };

      layer.appendChild(card);
      // 依次缓慢出现：第 i 张延迟 i×1.5s（0.5s 淡入 + 1s 停留）
      timers.push(setTimeout(() => card.classList.add("pop"), 200 + i * 1500));
    });
  }

  function hide() {
    timers.forEach(clearTimeout);
    timers = [];
    layer.querySelectorAll(".polaroid").forEach((c, i) => {
      setTimeout(() => c.classList.remove("pop"), i * 60);
    });
    setTimeout(() => { layer.innerHTML = ""; }, MOMENTS.length * 60 + 700);
  }

  btn.addEventListener("click", () => {
    shown = !shown;
    if (shown) {
      show();
      btn.textContent = "Hide ✧";
    } else {
      hide();
      btn.textContent = "Our Moments ✦";
    }
  });
})();

// ===================== 今日一句抽签（逐字弹出 + 随机字号 + 宋体） =====================
(function () {
  const textEl = document.getElementById("quote-text");
  const fromEl = document.getElementById("quote-from");
  const btn = document.getElementById("quote-btn");
  if (!textEl || typeof QUOTES === "undefined" || !QUOTES.length) return;

  let idx = -1;
  let typingTimer = null;

  function pick() {
    let n;
    do { n = Math.floor(Math.random() * QUOTES.length); }
    while (QUOTES.length > 1 && n === idx);
    idx = n;
    return QUOTES[n];
  }

  function renderChars(text) {
    if (typingTimer) clearInterval(typingTimer);
    textEl.innerHTML = "";
    const PUNCT = /[，。！？、；：「」『』“”‘’（）【】…—～·]/;
    const chars = text.split("");
    const spans = [];

    // 按字数动态计算基础字号：目标文字区占卡片高度约 2/3
    const avgPerLine = 7;
    const lines = Math.max(1, Math.ceil(chars.length / avgPerLine));
    const targetH = 220; // 约 2/3 卡片高度（px）
    const base = Math.min(96, Math.max(46, targetH / (lines * 1.42)));
    // 小屏时按视口比例缩小，大屏不超过计算上限
    textEl.style.setProperty("--q-base", `clamp(36px, 5.2vw, ${base}px)`);

    chars.forEach((ch) => {
      // 标点附到前一个字，避免单独换行
      if (PUNCT.test(ch) && spans.length) {
        spans[spans.length - 1].textContent += ch;
        return;
      }
      const span = document.createElement("span");
      span.className = "q-char";
      span.textContent = ch;
      // 字号在小范围内随机：0.88 ~ 1.12 倍
      const r = 0.88 + Math.random() * 0.24;
      span.style.setProperty("--r", r.toFixed(3));
      span.style.fontSize = "calc(1em * var(--r))";
      textEl.appendChild(span);
      spans.push(span);
    });

    let i = 0;
    const baseDelay = 55; // 基础逐字间隔
    typingTimer = setInterval(() => {
      if (i >= spans.length) { clearInterval(typingTimer); typingTimer = null; return; }
      spans[i].classList.add("show");
      i++;
    }, baseDelay);
  }

  function render(q, animate) {
    if (animate) {
      textEl.classList.add("swapping");
      setTimeout(() => {
        renderChars(q.q);
        if (fromEl) fromEl.textContent = q.a || "";
        textEl.classList.remove("swapping");
      }, 350);
    } else {
      renderChars(q.q);
      if (fromEl) fromEl.textContent = q.a || "";
    }
  }

  render(pick(), false);
  btn.addEventListener("click", () => render(pick(), true));
})();

// 更新日志渲染已迁移至 js/changelog.js（首页状态栏 + About 页列表共用）

// ===================== 音乐播放器 UI =====================
(function () {
  const titleEl = document.getElementById("mp-title");
  const artistEl = document.getElementById("mp-artist");
  const btnToggle = document.getElementById("mp-toggle");
  const btnPrev = document.getElementById("mp-prev");
  const btnNext = document.getElementById("mp-next");
  const progress = document.getElementById("mp-progress");
  const list = document.getElementById("mp-list");
  if (!titleEl || !window.XLAudio) return;
  const A = window.XLAudio;

  if (list) {
    (window.MUSIC_PLAYLIST || []).forEach((t, i) => {
      const li = document.createElement("li");
      li.innerHTML = '<span class="mp-li-no">' + (i + 1) + "</span>" + escapeHtml2(t.title);
      li.addEventListener("click", () => A.play(i));
      list.appendChild(li);
    });
  }

  function update(info) {
    titleEl.textContent = info.title;
    if (artistEl) artistEl.textContent = info.artist || "";
    if (btnToggle) btnToggle.classList.toggle("playing", !!info.playing);
    if (progress && !window.__xlSeeking) progress.style.width = (info.duration ? (info.time / info.duration * 100) : 0) + "%";
    if (list) Array.prototype.forEach.call(list.children, (li, i) => li.classList.toggle("active", i === info.index));
  }
  A.onChange(update);
  update(A.getInfo());
  if (btnToggle) btnToggle.addEventListener("click", () => A.toggle());
  if (btnNext) btnNext.addEventListener("click", () => A.next());
  if (btnPrev) btnPrev.addEventListener("click", () => A.prev());
})();

// （背景音乐逻辑已统一移至 js/audio.js，全站三页共用，跳转不重播）
