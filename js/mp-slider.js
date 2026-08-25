/* ============================================================
 * mp-slider.js — 音乐播放器「弹性进度条」（ElasticSlider 原生移植）
 * 拖动即跳转播放进度；拖出两端时进度条被拉伸/压扁、对应方向按钮
 * 弹跳一下，松手后弹簧回弹。拖动期间不覆盖进度显示（__xlSeeking）。
 * ============================================================ */
(function () {
  "use strict";

  var bar = document.getElementById("mp-bar");
  var track = document.getElementById("mp-track");
  var range = document.getElementById("mp-progress");
  var audio = document.getElementById("bgm");
  if (!bar || !track || !range || !audio) return;

  var MAX_OVERFLOW = 50;
  var seeking = false;

  function decay(value, max) {
    if (max === 0) return 0;
    var entry = value / max;
    var sigmoid = 2 * (1 / (1 + Math.exp(-entry)) - 0.5);
    return sigmoid * max;
  }

  function setSeek(clientX) {
    var rect = track.getBoundingClientRect();
    var ratio = (clientX - rect.left) / Math.max(1, rect.width);
    ratio = Math.min(1, Math.max(0, ratio));
    range.style.width = (ratio * 100) + "%";
    if (audio.duration && isFinite(audio.duration)) {
      audio.currentTime = ratio * audio.duration;
    }

    // 弹性溢出：拖出左/右边缘
    var overflow = 0;
    var region = "";
    if (clientX < rect.left) { overflow = rect.left - clientX; region = "left"; }
    else if (clientX > rect.right) { overflow = clientX - rect.right; region = "right"; }
    overflow = Math.min(MAX_OVERFLOW, decay(overflow, MAX_OVERFLOW));

    track.style.transform =
      "scaleX(" + (1 + overflow / Math.max(1, rect.width)) +
      ") scaleY(" + (1 - (overflow / MAX_OVERFLOW) * 0.2) + ")";
    track.style.transformOrigin = region === "right" ? "left center" : "right center";

    var btn = region === "left" ? document.getElementById("mp-prev")
      : region === "right" ? document.getElementById("mp-next") : null;
    if (btn && !btn.classList.contains("pop")) {
      btn.classList.add("pop");
      setTimeout(function () { btn.classList.remove("pop"); }, 280);
    }

    track.classList.add("drag");
    if (!seeking) { seeking = true; window.__xlSeeking = true; }
  }

  function endDrag() {
    if (!seeking) return;
    seeking = false;
    window.__xlSeeking = false;
    track.classList.remove("drag");
    track.style.transform = ""; // 触发弹簧回弹（CSS transition）
  }

  bar.addEventListener("pointerdown", function (e) {
    bar.setPointerCapture(e.pointerId);
    setSeek(e.clientX);
  });
  bar.addEventListener("pointermove", function (e) {
    if (e.buttons > 0) setSeek(e.clientX);
  });
  bar.addEventListener("pointerup", endDrag);
  bar.addEventListener("pointercancel", endDrag);
  bar.addEventListener("lostpointercapture", endDrag);
})();
