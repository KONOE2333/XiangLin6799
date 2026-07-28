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

  // 第一段：相识年月从 0 涨到目标
  let cur = 0;
  const timer = setInterval(() => {
    cur += 1;
    if (cur >= totalMonths) { cur = totalMonths; clearInterval(timer); showReunion(); }
    yEl.textContent = Math.floor(cur / 12);
    mEl.textContent = cur % 12;
  }, 14);

  // 第二段：重逢天数从无到有出现并跳动到目标
  function showReunion() {
    setTimeout(() => {
      reunionLine.classList.add("show");
      let d = 0;
      const step = Math.max(1, Math.floor(reunionDays / 110));
      const t2 = setInterval(() => {
        d += step;
        if (d >= reunionDays) { d = reunionDays; clearInterval(t2); }
        rEl.textContent = d.toLocaleString();
      }, 16);
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
        let w = Math.min(cellW * 0.82, 26 * vw);
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
      btn.textContent = "收起瞬间 ✧";
    } else {
      hide();
      btn.textContent = "我们的瞬间 ✦";
    }
  });
})();

// （背景音乐逻辑已统一移至 js/audio.js，全站三页共用，跳转不重播）
