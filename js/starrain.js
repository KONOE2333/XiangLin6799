// ===================== 星雨背景（雨丝般下坠的星星，全站共用） =====================
(function () {
  const canvas = document.getElementById("star-rain");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let drops = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const n = Math.min(150, Math.floor(window.innerWidth / 9));
    drops = Array.from({ length: n }, () => spawn(true));
  }

  function spawn(anywhere) {
    return {
      x: Math.random() * canvas.width,
      y: anywhere ? Math.random() * canvas.height : -20,
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

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      d.y += d.speed;
      d.x += d.drift;
      d.alpha += d.twinkle;
      if (d.alpha > 0.85 || d.alpha < 0.25) d.twinkle *= -1;

      const grad = ctx.createLinearGradient(d.x, d.y - d.len, d.x, d.y);
      grad.addColorStop(0, "rgba(160, 175, 255, 0)");
      grad.addColorStop(1, "rgba(190, 200, 255," + d.alpha * 0.55 + ")");
      ctx.strokeStyle = grad;
      ctx.lineWidth = d.size * 0.6;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y - d.len);
      ctx.lineTo(d.x, d.y);
      ctx.stroke();

      drawStar(d.x, d.y, d.size, d.alpha);

      if (d.y - d.len > canvas.height) drops[i] = spawn(false);
    }
    requestAnimationFrame(tick);
  }

  window.addEventListener("resize", resize);
  resize();
  tick();
})();
