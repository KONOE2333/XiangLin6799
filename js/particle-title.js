/* ============================================================
 * particle-title.js — 首页主标题「粒子文字」效果（v2）
 * 由 React Bits <ParticleText /> 移植为原生 JS + Canvas（无依赖）。
 * v2 改进：单行/多行通用、画布=文字精确尺寸（不拉伸不变形）、
 *          聚成后自动循环「散开→重组」、粉色光晕、降级回退普通文字。
 * ============================================================ */
(function () {
  "use strict";

  var root = document.getElementById("particle-title");
  if (!root) return;

  var CONFIG = {
    particleSize: 2.2,
    density: 3,
    color: "#fff6fa",
    highlightColor: "#ff9ecb",
    scatter: 200,
    gatherDuration: 1500,
    stagger: 320,
    pointerRepel: 46,
    repelRadius: 130,
    idleDrift: 0.6,
    glow: true
  };

  var reduceQuery = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  var reducedMotion = !!(reduceQuery && reduceQuery.matches);
  var canvas = document.createElement("canvas");
  canvas.className = "particle-title__canvas";
  canvas.setAttribute("aria-hidden", "true");

  var ctx = canvas.getContext("2d");
  if (!ctx || reducedMotion) return;
  // 手机端（<600px）不启用粒子效果，显示普通发光标题
  if (window.innerWidth < 600) return;

  var textEl = root.querySelector(".particle-title__text");
  // 用 span 的 innerText：<br> 会得到真实换行，支持多行标题
  var content = ((textEl ? textEl.innerText : "") || root.textContent || " ")
    .replace(/\r/g, "").trim();
  if (!content) return;

  var particles = [];
  var animationFrame = null;
  var resizeFrame = null;
  var buildId = 0;
  var gathering = false;
  var gatherStart = 0;
  var width = 0;
  var height = 0;
  var dpr = 1;

  var pointer = { active: false, x: 0, y: 0, smoothX: 0, smoothY: 0 };

  function hexToRgb(hex) {
    var clean = hex.replace("#", "").trim();
    if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16)
    };
  }
  function mixRgb(from, to, amount) {
    return {
      r: Math.round(from.r + (to.r - from.r) * amount),
      g: Math.round(from.g + (to.g - from.g) * amount),
      b: Math.round(from.b + (to.b - from.b) * amount)
    };
  }
  function rgbToCss(rgb) { return "rgb(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ")"; }
  function clamp(value, min, max) { return Math.min(Math.max(value, min), max); }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function startGather(fromScatter) {
    if (!particles.length) return;
    var now = performance.now();
    var spread = reducedMotion ? 0 : CONFIG.scatter;
    particles.forEach(function (p) {
      if (fromScatter) {
        var angle = p.seed * Math.PI * 2;
        var distance = spread * (0.35 + p.depth * 0.75);
        p.x = p.targetX + Math.cos(angle) * distance + (p.depth - 0.5) * spread * 0.55;
        p.y = p.targetY + Math.sin(angle) * distance + (p.seed - 0.5) * spread * 0.55;
      }
      p.startX = p.x;
      p.startY = p.y;
      p.delay = reducedMotion ? 0 : p.seed * CONFIG.stagger;
    });
    gatherStart = now;
    gathering = true;
  }

  function drawParticle(p) {
    var size = p.size;
    ctx.fillStyle = p.color;
    if (size <= 2.1) {
      ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
      return;
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function render(now) {
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    if (CONFIG.glow && !reducedMotion) {
      ctx.shadowBlur = CONFIG.particleSize * 3.2;
      ctx.shadowColor = CONFIG.highlightColor;
    } else {
      ctx.shadowBlur = 0;
    }

    pointer.smoothX += (pointer.x - pointer.smoothX) * 0.18;
    pointer.smoothY += (pointer.y - pointer.smoothY) * 0.18;

    var complete = true;

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var baseX = p.targetX;
      var baseY = p.targetY;
      var progress = 1;

      if (gathering) {
        var local = (now - gatherStart - p.delay) / Math.max(1, reducedMotion ? 1 : CONFIG.gatherDuration);
        progress = clamp(local, 0, 1);
        var eased = easeOutCubic(progress);
        baseX = p.startX + (p.targetX - p.startX) * eased;
        baseY = p.startY + (p.targetY - p.startY) * eased;
        if (progress < 1) complete = false;
      } else if (!reducedMotion && CONFIG.idleDrift > 0) {
        var t = now * 0.001;
        baseX += Math.sin(t * 0.9 + p.seed * 10) * CONFIG.idleDrift * p.depth;
        baseY += Math.cos(t * 0.75 + p.depth * 10) * CONFIG.idleDrift * p.depth;
      }

      if (pointer.active && !reducedMotion && CONFIG.pointerRepel > 0 && CONFIG.repelRadius > 0) {
        var dx = baseX - pointer.smoothX;
        var dy = baseY - pointer.smoothY;
        var dist = Math.hypot(dx, dy);
        if (dist > 0 && dist < CONFIG.repelRadius) {
          var force = Math.pow(1 - dist / CONFIG.repelRadius, 2) * CONFIG.pointerRepel;
          baseX += (dx / dist) * force;
          baseY += (dy / dist) * force;
        }
      }

      var follow = reducedMotion ? 1 : 0.22;
      p.x += (baseX - p.x) * follow;
      p.y += (baseY - p.y) * follow;

      ctx.globalAlpha = clamp(0.35 + progress * 0.65, 0, 1);
      drawParticle(p);
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    if (gathering && complete) gathering = false;

    animationFrame = window.requestAnimationFrame(render);
  }

  function ensureRenderLoop() {
    if (animationFrame === null) animationFrame = window.requestAnimationFrame(render);
  }

  function sampleText() {
    var currentBuild = ++buildId;
    var rect = root.getBoundingClientRect();
    width = Math.floor(rect.width);
    height = Math.floor(rect.height);
    if (width <= 0 || height <= 0) return;

    var computed = window.getComputedStyle(root);
    var family = computed.fontFamily || "serif";
    var weight = computed.fontWeight || 600;
    var resolvedSize = parseFloat(computed.fontSize) || 72;
    var font = weight + " " + resolvedSize + "px " + family;

    var lines = content.split("\n");
    var offscreen = document.createElement("canvas");
    var offCtx = offscreen.getContext("2d", { willReadFrequently: true });
    if (!offCtx) return;

    var maxTextWidth = width * 0.94;
    offCtx.font = font;
    var widths = lines.map(function (l) { return offCtx.measureText(l).width; });
    var measuredWidth = Math.max.apply(null, widths);
    if (measuredWidth > maxTextWidth) {
      resolvedSize = Math.max(18, resolvedSize * (maxTextWidth / measuredWidth));
      font = weight + " " + resolvedSize + "px " + family;
      offCtx.font = font;
      widths = lines.map(function (l) { return offCtx.measureText(l).width; });
      measuredWidth = Math.max.apply(null, widths);
    }

    var lineHeight = resolvedSize * 1.32;
    var ascent = resolvedSize * 0.84;
    var descent = resolvedSize * 0.16;
    var padding = Math.max(16, Math.ceil(resolvedSize * 0.12));
    var textWidth = Math.max(1, Math.ceil(measuredWidth));
    var textHeight = Math.max(1, Math.ceil(lines.length * lineHeight));
    var canvasW = textWidth + padding * 2;
    var canvasH = textHeight + padding * 2;

    // 画布尺寸：桌面铺满容器（保留轻微「撑满」观感）；移动端（<600px）
    // 画布=文字精确尺寸并居中，保证两行标题完整显示、不被裁切
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var exact = width < 600;
    var cssW = exact ? canvasW : width;
    var cssH = exact ? canvasH : height;
    canvas.width = Math.max(1, Math.floor(cssW * dpr));
    canvas.height = Math.max(1, Math.floor(cssH * dpr));
    if (exact) {
      canvas.style.width = cssW + "px";
      canvas.style.height = cssH + "px";
      canvas.style.left = Math.floor((width - cssW) / 2) + "px";
      canvas.style.top = Math.floor((height - cssH) / 2) + "px";
    } else {
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.left = "0px";
      canvas.style.top = "0px";
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    offscreen.width = canvasW;
    offscreen.height = canvasH;
    offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
    offCtx.font = font;
    offCtx.textAlign = "left";
    offCtx.textBaseline = "alphabetic";
    offCtx.fillStyle = "#ffffff";
    lines.forEach(function (line, i) {
      var w = offCtx.measureText(line).width;
      offCtx.fillText(line, (offscreen.width - w) / 2, padding + ascent + i * lineHeight);
    });

    var imageData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
    var targets = [];
    var step = Math.max(2, Math.floor(CONFIG.density));
    var offsetX = exact ? 0 : width / 2 - canvasW / 2;
    var offsetY = exact ? 0 : height / 2 - canvasH / 2;
    for (var y = 0; y < offscreen.height; y += step) {
      for (var x = 0; x < offscreen.width; x += step) {
        var alpha = imageData.data[(y * offscreen.width + x) * 4 + 3];
        if (alpha > 40) {
          targets.push({ x: offsetX + x, y: offsetY + y, alpha: alpha / 255 });
        }
      }
    }

    var maxParticles = Math.max(900, Math.min(5600, Math.floor((width * height) / 70)));
    var stride = Math.max(1, Math.ceil(targets.length / maxParticles));
    var baseRgb = hexToRgb(CONFIG.color);
    var highlightRgb = hexToRgb(CONFIG.highlightColor);

    particles = [];
    for (var k = 0; k < targets.length; k += stride) {
      var target = targets[k];
      var seed = ((k * 9301 + 49297) % 233280) / 233280;
      var depth = 0.45 + (((k * 233 + 97) % 1000) / 1000) * 0.9;
      var blend = baseRgb && highlightRgb ? clamp(target.x / Math.max(1, width) + (seed - 0.5) * 0.35, 0, 1) : 0;
      var pColor = baseRgb && highlightRgb ? rgbToCss(mixRgb(baseRgb, highlightRgb, blend)) : CONFIG.color;
      var angle = seed * Math.PI * 2;
      var distance = (reducedMotion ? 0 : CONFIG.scatter) * (0.35 + depth * 0.75);
      var startX = target.x + Math.cos(angle) * distance + (seed - 0.5) * CONFIG.scatter * 0.45;
      var startY = target.y + Math.sin(angle) * distance + (depth - 0.9) * CONFIG.scatter * 0.45;
      particles.push({
        x: reducedMotion ? target.x : startX,
        y: reducedMotion ? target.y : startY,
        startX: startX,
        startY: startY,
        targetX: target.x,
        targetY: target.y,
        size: Math.max(0.6, CONFIG.particleSize * (0.75 + target.alpha * 0.45)),
        color: pColor,
        seed: seed,
        depth: depth,
        delay: seed * CONFIG.stagger
      });
    }

    pointer.x = canvasW / 2;
    pointer.y = canvasH / 2;
    pointer.smoothX = pointer.x;
    pointer.smoothY = pointer.y;

    root.classList.add("pt-active");
    startGather(false);
    ensureRenderLoop();
  }

  var resizeObserver = null;
  if (window.ResizeObserver) {
    resizeObserver = new ResizeObserver(function () {
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(sampleText);
    });
    resizeObserver.observe(root);
  }

  root.appendChild(canvas);

  function move(e) {
    var rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
    pointer.active = true;
  }
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerenter", function (e) { move(e); });
  canvas.addEventListener("pointerleave", function () { pointer.active = false; });

  if (reduceQuery) {
    reduceQuery.addEventListener("change", function (e) {
      reducedMotion = e.matches;
      if (reducedMotion) {
        root.classList.remove("pt-active");
        canvas.style.display = "none";
        if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      } else {
        canvas.style.display = "";
        sampleText();
      }
    });
  }

  var ready = function () {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { sampleText(); }).catch(function () { sampleText(); });
    } else {
      sampleText();
    }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
  else ready();
})();
