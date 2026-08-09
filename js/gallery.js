// 照片球：照片从四周汇聚到中心，再散开到 3D 球面。
// 支持自动慢转、拖拽旋转、点击放大、双击空白/双指捏合/ESC 退出。
(function () {
  "use strict";

  const stage = document.getElementById("sphere-stage");
  const sphere = document.getElementById("photo-sphere");
  const exitBtn = document.getElementById("sphere-exit");
  const coreWrap = document.getElementById("memory-core-wrap");
  const memoryCore = document.getElementById("memory-core");
  const ringFill = document.getElementById("core-ring-fill");
  const hint = document.getElementById("sphere-hint");
  const filmStrip = document.getElementById("film-strip");
  const filmRows = document.getElementById("film-rows");
  const filmBack = document.getElementById("film-back");
  const items = window.GALLERY || [];
  if (!stage || !sphere || !items.length) return;
  const CHARGE_MS = 1400;

  const isMobile = window.matchMedia &&
    window.matchMedia("(max-width: 720px), (pointer: coarse)").matches;
  const frameInterval = isMobile ? 33 : 16;
  let lastFrame = 0;

  let open = false;
  let burstTriggered = false;
  let charge = 0;
  let charging = false;
  let chargePointerId = null;
  let lastAngle = 0;
  let lastChargeTime = 0;
  let chargeStart = 0;
  let lastHeartAt = 0;
  let coreAngle = 0;
  let lastTier = -1;
  let rx = 0;
  let ry = 0;
  let centerZ = 0;
  let perspectiveDistance = 1000;
  let selected = null;
  let dragging = false;
  let dragged = false;
  const pointers = new Map();
  let pinchStartDist = 0;
  let filmOpen = false;

  function layout() {
    // 球半径、照片尺寸和透视距离都集中在这里，方便后续微调。
    const R = isMobile
      ? Math.max(220, Math.min(window.innerWidth, window.innerHeight) * 0.42)
      : Math.max(320, Math.min(window.innerWidth, window.innerHeight) * 0.5);
    const size = isMobile
      ? Math.max(84, Math.min(120, R * 0.38))
      : Math.max(120, Math.min(220, R * 0.46));
    centerZ = R * 0.62;
    sphere.style.setProperty("--r", R + "px");
    sphere.style.setProperty("--photo-w", Math.round(size) + "px");
    sphere.style.setProperty("--photo-h", Math.round(size * 0.75) + "px");
    // 相机仍位于球内，但球心向后退一段，使正前方照片更近；
    // 同时用更长的透视距离减少四周照片的拉扯畸变。
    perspectiveDistance = isMobile
      ? 800
      : Math.max(1000, Math.min(window.innerWidth, window.innerHeight) * 1.2);
    stage.style.setProperty("--perspective", perspectiveDistance + "px");
  }

  function applyRotation() {
    sphere.style.transform =
      "translateZ(" + (perspectiveDistance - centerZ).toFixed(2) + "px) rotateX(" +
      rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg)";
  }

  function deselect() {
    if (!selected) return;
    selected.classList.remove("selected");
    selected = null;
  }

  function buildFilmStrip() {
    if (!filmRows || filmRows.children.length) return;
    const rows = [
      document.createElement("div"),
      document.createElement("div")
    ];
    rows[0].className = "film-row film-row-a";
    rows[1].className = "film-row film-row-b";
    const half = Math.ceil(items.length / 2);
    items.forEach((item, i) => {
      const row = rows[i < half ? 0 : 1];
      const cell = document.createElement("div");
      cell.className = "film-cell";
      cell.innerHTML = '<img src="' + item.src + '" alt="' + (item.alt || "") + '" loading="lazy">';
      row.appendChild(cell);
    });
    rows.forEach((row) => {
      row.innerHTML += row.innerHTML;
    });
    filmRows.appendChild(rows[0]);
    filmRows.appendChild(rows[1]);
  }

  function openFilmStrip() {
    if (!open || filmOpen) return;
    filmOpen = true;
    buildFilmStrip();
    stage.classList.add("film-active");
    sphere.classList.add("is-film");
    if (filmStrip) {
      filmStrip.classList.add("show");
      filmStrip.setAttribute("aria-hidden", "false");
    }
    if (hint) hint.textContent = "胶卷滚动中 · 下滑查看小海盐影像墙";
  }

  function closeFilmStrip() {
    filmOpen = false;
    if (filmStrip) {
      filmStrip.classList.remove("show");
      filmStrip.setAttribute("aria-hidden", "true");
    }
    stage.classList.remove("film-active");
    sphere.classList.remove("is-film");
    if (hint) hint.textContent = "拖拽旋转 · 双击空白区域 → 胶卷模式";
  }

  function openSphere() {
    if (open) return;
    open = true;
    if (coreWrap) coreWrap.classList.add("hidden");
    if (memoryCore) memoryCore.classList.remove("active");
    if (hint) hint.textContent = "拖拽旋转 · 双击空白区域 → 胶卷模式";
    stage.classList.add("burst");
    sphere.classList.add("is-open");
    document.querySelectorAll(".sphere-photo").forEach((photo) => {
      photo.style.animation = "";
      photo.classList.add("launch");
    });
  }

  function coreAngleFor(e) {
    const r = coreWrap.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    return Math.atan2(e.clientY - cy, e.clientX - cx);
  }

  function updateCharge() {
    if (!ringFill) return;
    const C = 2 * Math.PI * 62;
    ringFill.style.strokeDasharray = String(C);
    ringFill.style.strokeDashoffset = String(C * (1 - charge));
    const tier = Math.floor(charge * 8);
    if (tier > lastTier && tier > 0) {
      lastTier = tier;
      if (coreWrap) {
        coreWrap.classList.remove("shake");
        void coreWrap.offsetWidth;
        coreWrap.classList.add("shake");
      }
      if (navigator.vibrate) navigator.vibrate(8);
    }
  }

  function spawnParticle() {
    if (!coreWrap) return;
    const p = document.createElement("i");
    p.className = "core-heart";
    p.textContent = "♥";
    const angle = Math.random() * Math.PI * 2;
    const dist = 48 + Math.random() * 76;
    p.style.setProperty("--px", (Math.cos(angle) * dist).toFixed(0) + "px");
    p.style.setProperty("--py", (Math.sin(angle) * dist).toFixed(0) + "px");
    p.addEventListener("animationend", () => p.remove());
    coreWrap.appendChild(p);
  }

  function completeCharge() {
    if (open || burstTriggered || charge < 1) return;
    burstTriggered = true;
    charging = false;
    chargePointerId = null;
    if (memoryCore) memoryCore.classList.add("charged");
    if (coreWrap) coreWrap.classList.add("charged");
    if (navigator.vibrate) navigator.vibrate(30);
    setTimeout(openSphere, 220);
  }

  const golden = Math.PI * (3 - Math.sqrt(5));
  const count = items.length;
  const sxRange = Math.min(window.innerWidth * 0.85, 900);
  const syRange = Math.min(window.innerHeight * 0.85, 700);

  items.forEach((item, i) => {
    const y = 1 - (i / Math.max(1, count - 1)) * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;
    const lon = Math.atan2(x, z) * 180 / Math.PI;
    const lat = Math.asin(y) * 180 / Math.PI;

    const photo = document.createElement("button");
    photo.type = "button";
    photo.className = "sphere-photo";
    photo.style.setProperty("--sx", ((Math.random() * 2 - 1) * sxRange).toFixed(0) + "px");
    photo.style.setProperty("--sy", ((Math.random() * 2 - 1) * syRange).toFixed(0) + "px");
    photo.style.setProperty("--sphere",
      "rotateY(" + lon.toFixed(2) + "deg) rotateX(" + (-lat).toFixed(2) +
      "deg) translateZ(var(--r)) rotateY(180deg)");
    photo.style.setProperty("--delay", (i * 45) + "ms");
    photo.style.setProperty("--launch-delay", (i * 20) + "ms");
    photo.innerHTML =
      '<img src="' + item.src + '" alt="' + (item.alt || "") + '" decoding="async">';

    photo.addEventListener("animationend", (e) => {
      photo.style.animation = "none";
      photo.style.opacity = "1";
      if (e.animationName === "photo-converge") {
        photo.style.transform = "translate(0, 0) scale(0.72)";
      }
      if (e.animationName === "photo-launch") {
        photo.style.transform = "var(--sphere)";
      }
    });

    photo.addEventListener("click", (e) => {
      e.stopPropagation();
      if (dragged) return;
      if (selected === photo) {
        deselect();
      } else {
        deselect();
        selected = photo;
        photo.classList.add("selected");
      }
    });

    sphere.appendChild(photo);
  });

  stage.addEventListener("pointerdown", (e) => {
    if (!open) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragged = false;
    if (pointers.size === 2) {
      const pts = [...pointers.values()];
      pinchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    }
    if (pointers.size === 1) dragging = true;
  });

  document.addEventListener("pointermove", (e) => {
    if (!pointers.has(e.pointerId)) return;
    if (!open) return;
    const prev = pointers.get(e.pointerId);
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 1 && dragging) {
      ry += dx * 0.22;
      rx = Math.max(-70, Math.min(70, rx + dy * 0.18));
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) dragged = true;
      applyRotation();
    }

    if (pointers.size === 2) {
      const pts = [...pointers.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (pinchStartDist && dist < pinchStartDist * 0.78) openFilmStrip();
      pinchStartDist = dist;
    }
  });

  function releasePointer(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchStartDist = 0;
    if (pointers.size === 0) {
      dragging = false;
      setTimeout(() => { dragged = false; }, 0);
    }
  }

  document.addEventListener("pointerup", releasePointer);
  document.addEventListener("pointercancel", releasePointer);
  stage.addEventListener("click", (e) => {
    if (!e.target.closest(".sphere-photo")) deselect();
  });
  stage.addEventListener("dblclick", (e) => {
    if (!open) return;
    if (!e.target.closest(".sphere-photo")) openFilmStrip();
  });

  if (memoryCore) {
    memoryCore.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      charging = true;
      charge = 0;
      lastTier = -1;
      chargePointerId = e.pointerId;
      chargeStart = performance.now();
      lastHeartAt = 0;
      memoryCore.classList.add("active");
      updateCharge();
    });

    function stopCharge(e) {
      if (e.pointerId !== chargePointerId) return;
      charging = false;
      memoryCore.classList.remove("active");
      chargePointerId = null;
      if (charge < 1) {
        charge = 0;
        updateCharge();
      }
    }

    document.addEventListener("pointerup", stopCharge);
    document.addEventListener("pointercancel", stopCharge);
  }

  setTimeout(() => {
    if (!open && coreWrap) {
      coreWrap.classList.add("show");
      if (hint) hint.textContent = "长按记忆核心 · 蓄力充能";
    }
  }, 1300);

  if (filmBack) filmBack.addEventListener("click", closeFilmStrip);
  document.addEventListener("keydown", (e) => {
    if (!open) return;
    if (e.key === "Escape" && filmOpen) closeFilmStrip();
    if (e.key === "ArrowLeft") { ry -= 4; applyRotation(); }
    if (e.key === "ArrowRight") { ry += 4; applyRotation(); }
    if (e.key === "ArrowUp") { rx = Math.max(-30, rx - 3); applyRotation(); }
    if (e.key === "ArrowDown") { rx = Math.min(30, rx + 3); applyRotation(); }
  });
  window.addEventListener("resize", layout);

  layout();
  applyRotation();

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (charging) {
      const now2 = performance.now();
      charge = Math.min(1, (now2 - chargeStart) / CHARGE_MS);
      updateCharge();
      if (now2 - lastHeartAt > 90) {
        lastHeartAt = now2;
        spawnParticle();
      }
      if (charge >= 1) completeCharge();
    }
    if (open && !dragging) {
      const speed = selected ? 0.03 : (isMobile ? 0.06 : 0.12);
      ry += speed * dt * 60;
      applyRotation();
    }
    if (isMobile && now - lastFrame < frameInterval) {
      requestAnimationFrame(tick);
      return;
    }
    lastFrame = now;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
