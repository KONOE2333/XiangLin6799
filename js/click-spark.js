/* ============================================================
 * click-spark.js — 鼠标点击火花动效（React Bits <ClickSpark /> 原生移植）
 * 每次点击，从点击处放射 sparkCount 条火花线，向外扩散并缩短消失。
 * 粉/青双色 + 微光，适配全站梦核配色；prefers-reduced-motion 时关闭。
 * ============================================================ */
(function () {
  "use strict";

  var reduceQuery = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduceQuery && reduceQuery.matches) return;

  var canvas = document.createElement("canvas");
  canvas.id = "click-spark";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var W = 0, H = 0, dpr = 1, sparks = [];
  var CONFIG = {
    color: "#ffb3d9",
    color2: "#7fd8ff",
    size: 14,
    radius: 72,
    count: 8,
    duration: 420
  };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.max(1, Math.floor(W * dpr));
    canvas.height = Math.max(1, Math.floor(H * dpr));
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  function easeOut(t) { return t * (2 - t); }

  var rafId = null;

  function draw(timestamp) {
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 2;
    ctx.shadowBlur = 7;
    ctx.shadowColor = "rgba(255, 179, 217, 0.85)";

    sparks = sparks.filter(function (sp) {
      var elapsed = timestamp - sp.t0;
      if (elapsed >= CONFIG.duration) return false;
      var p = easeOut(elapsed / CONFIG.duration);
      var dist = p * CONFIG.radius;
      var len = CONFIG.size * (1 - p);
      var x1 = sp.x + dist * Math.cos(sp.angle);
      var y1 = sp.y + dist * Math.sin(sp.angle);
      var x2 = sp.x + (dist + len) * Math.cos(sp.angle);
      var y2 = sp.y + (dist + len) * Math.sin(sp.angle);
      ctx.strokeStyle = sp.c;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      return true;
    });

    ctx.shadowBlur = 0;

    if (sparks.length) {
      rafId = requestAnimationFrame(draw);
    } else {
      rafId = null;
      ctx.clearRect(0, 0, W, H);
    }
  }

  function spawn(e) {
    var now = performance.now();
    for (var i = 0; i < CONFIG.count; i++) {
      sparks.push({
        x: e.clientX,
        y: e.clientY,
        angle: (2 * Math.PI * i) / CONFIG.count + (Math.random() * 0.3 - 0.15),
        t0: now,
        c: i % 2 === 0 ? CONFIG.color : CONFIG.color2
      });
    }
    if (rafId === null) rafId = requestAnimationFrame(draw);
  }

  document.addEventListener("click", spawn, { passive: true });
})();
