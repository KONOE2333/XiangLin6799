// ===================== 星雨背景（雨丝星 + 流星 + 极光 + 鼠标视差） =====================
(function () {
  const canvas = document.getElementById("star-rain");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const reduced = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = window.matchMedia &&
    window.matchMedia("(max-width: 720px)").matches;

  let W = 0, H = 0, dpr = 1;
  let drops = [];
  let aurora = [];
  let meteors = [];
  let nextMeteor = 0;
  let mouseX = 0, mouseY = 0;   // -0.5 ~ 0.5，用于轻视差

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const n = mobile
      ? Math.min(30, Math.floor(W / 12))
      : Math.min(160, Math.floor(W / 9));
    drops = Array.from({ length: n }, () => spawn(true));

    // 极光/星云光晕：3~4 团缓慢漂移的彩色光斑
    const palette = [
      "rgba(139,127,240,",  // 紫
      "rgba(243,154,194,",  // 粉
      "rgba(127,180,240,"   // 蓝
    ];
    aurora = Array.from({ length: 4 }, (_, i) => ({
      x: Math.random() * W,
      y: Math.random() * H * 0.8,
      r: Math.min(W, H) * (0.28 + Math.random() * 0.22),
      color: palette[i % palette.length],
      dx: (Math.random() - 0.5) * 0.18,
      dy: (Math.random() - 0.5) * 0.14,
      phase: Math.random() * Math.PI * 2,
      sp: 0.0006 + Math.random() * 0.0006
    }));
  }

  function spawn(anywhere) {
    return {
      x: Math.random() * W,
      y: anywhere ? Math.random() * H : -20,
      len: Math.random() * 50 + 25,
      speed: Math.random() * 2.2 + 1.2,
      drift: Math.random() * 0.4 - 0.2,
      size: Math.random() * 1.4 + 0.8,
      alpha: Math.random() * 0.5 + 0.35,
      twinkle: Math.random() * 0.03 + 0.01
    };
  }

  function drawStar(x, y, r, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "rgba(220, 228, 255," + alpha + ")";
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      ctx.ellipse(0, 0, r * 2.2, r * 0.55, (Math.PI / 4) * (i * 2), 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255," + Math.min(1, alpha + 0.25) + ")";
    ctx.fill();
    ctx.restore();
  }

  function spawnMeteor() {
    const fromLeft = Math.random() > 0.5;
    const dir = fromLeft ? 1 : -1;
    const startX = fromLeft ? Math.random() * W * 0.4 : W * (0.6 + Math.random() * 0.4);
    const angle = Math.PI / 5 + Math.random() * 0.2;
    const speed = 7 + Math.random() * 4;
    meteors.push({
      x: startX,
      y: -40,
      vx: Math.cos(angle) * speed * dir,
      vy: Math.sin(angle) * speed + 4,
      life: 0,
      max: 60 + Math.random() * 30,
      len: 120 + Math.random() * 90
    });
  }

  function drawAurora(t) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const a of aurora) {
      a.x += a.dx; a.y += a.dy;
      if (a.x < -a.r) a.x = W + a.r;
      if (a.x > W + a.r) a.x = -a.r;
      if (a.y < -a.r) a.y = H + a.r;
      if (a.y > H + a.r) a.y = -a.r;
      const pulse = 0.05 + 0.03 * Math.sin(t * a.sp + a.phase);
      const g = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.r);
      g.addColorStop(0, a.color + pulse + ")");
      g.addColorStop(0.5, a.color + (pulse * 0.5) + ")");
      g.addColorStop(1, a.color + "0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawStatic() {
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      drawStar(d.x, d.y, d.size, d.alpha);
    }
  }

  function drawMeteors() {
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x += m.vx; m.y += m.vy; m.life++;
      const fade = 1 - m.life / m.max;
      if (fade <= 0 || m.y > H + 60 || m.x < -60 || m.x > W + 60) {
        meteors.splice(i, 1);
        continue;
      }
      const tailX = m.x - m.vx / Math.hypot(m.vx, m.vy) * m.len;
      const tailY = m.y - m.vy / Math.hypot(m.vx, m.vy) * m.len;
      const g = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
      g.addColorStop(0, "rgba(200,210,255,0)");
      g.addColorStop(1, "rgba(255,255,255," + (0.85 * fade) + ")");
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(m.x, m.y);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255," + (0.9 * fade) + ")";
      ctx.beginPath();
      ctx.arc(m.x, m.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  let t = 0;
  function tick() {
    t++;
    ctx.clearRect(0, 0, W, H);

    if (reduced) {
      drawStatic();
      return;
    }

    const ox = mouseX * 14, oy = mouseY * 14; // 视差偏移

    if (!reduced && !mobile) drawAurora(t);

    // 星雨
    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      d.y += d.speed;
      d.x += d.drift;
      d.alpha += d.twinkle;
      if (d.alpha > 0.85 || d.alpha < 0.25) d.twinkle *= -1;

      const x = d.x + ox, y = d.y + oy;
      const grad = ctx.createLinearGradient(x, y - d.len, x, y);
      grad.addColorStop(0, "rgba(160, 175, 255, 0)");
      grad.addColorStop(1, "rgba(190, 200, 255," + d.alpha * 0.55 + ")");
      ctx.strokeStyle = grad;
      ctx.lineWidth = d.size * 0.6;
      ctx.beginPath();
      ctx.moveTo(x, y - d.len);
      ctx.lineTo(x, y);
      ctx.stroke();
      drawStar(x, y, d.size, d.alpha);
      if (d.y - d.len > H) drops[i] = spawn(false);
    }

    if (!reduced && !mobile) {
      if (t > nextMeteor) {
        spawnMeteor();
        nextMeteor = t + 240 + Math.random() * 360; // 约 4~10 秒一颗
      }
      drawMeteors();
    }

    requestAnimationFrame(tick);
  }

  window.addEventListener("resize", () => {
    resize();
    if (reduced) drawStatic();
  });
  window.addEventListener("mousemove", function (e) {
    mouseX = e.clientX / W - 0.5;
    mouseY = e.clientY / H - 0.5;
  }, { passive: true });

  resize();
  if (reduced) nextMeteor = Infinity;
  tick();
})();
