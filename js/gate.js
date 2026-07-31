// ===================== 翔霖专属入站验证（轻量开场仪式，仅弹一次） =====================
(function () {
  "use strict";
  var KEY = "xl_gate_passed";
  try { if (localStorage.getItem(KEY) === "1") return; } catch (e) {}

  var overlay = document.createElement("div");
  overlay.className = "gate";
  overlay.innerHTML =
    '<div class="gate-card">' +
      '<div class="gate-kicker">XIANG LIN · VERIFY</div>' +
      '<div class="gate-title">欢迎来到翔霖小站</div>' +
      '<div class="gate-desc">先确认一下你是自己人～ 点亮下面的两位，再进来。</div>' +
      '<div class="gate-options">' +
        '<div class="gate-opt" data-who="x">严浩翔<small>2004.08.16</small></div>' +
        '<div class="gate-opt" data-who="l">贺峻霖<small>2004.06.15</small></div>' +
      '</div>' +
      '<button class="gate-enter" disabled>进 入 ✦</button>' +
      '<button class="gate-skip">下次再说</button>' +
    '</div>';
  document.body.appendChild(overlay);

  var picked = {};
  var enter = overlay.querySelector(".gate-enter");
  overlay.querySelectorAll(".gate-opt").forEach(function (opt) {
    opt.addEventListener("click", function () {
      var who = opt.getAttribute("data-who");
      picked[who] = !picked[who];
      opt.classList.toggle("picked", !!picked[who]);
      enter.disabled = !(picked.x && picked.l);
    });
  });

  function pass() {
    try { localStorage.setItem(KEY, "1"); } catch (e) {}
    overlay.classList.add("hide");
    setTimeout(function () { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 520);
  }
  enter.addEventListener("click", pass);
  overlay.querySelector(".gate-skip").addEventListener("click", pass);
})();
