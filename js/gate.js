// ===================== 翔霖专属入站验证（轻量开场仪式，仅弹一次） =====================
(function () {
  "use strict";
  var KEY = "xl_gate_passed";
  try { if (localStorage.getItem(KEY) === "1") return; } catch (e) {}

  var ANSWER = "拜仁慕尼黑"; // 5 个字

  var overlay = document.createElement("div");
  overlay.className = "gate";
  overlay.innerHTML =
    '<div class="gate-card">' +
      '<div class="gate-kicker">XIANG LIN · VERIFY</div>' +
      '<div class="gate-title">欢迎来到翔霖小站</div>' +
      '<div class="gate-desc">先确认一下你是自己人～ 回答一个小问题，再进来。</div>' +
      '<div class="gate-question">我们最爱的球队是什么？（5 个字）</div>' +
      '<input class="gate-input" type="text" placeholder="输入答案" maxlength="12" autocomplete="off">' +
      '<div class="gate-err" id="gate-err"></div>' +
      '<button class="gate-enter" disabled>进 入 ✦</button>' +
      '<button class="gate-skip">下次再说</button>' +
    '</div>';
  document.body.appendChild(overlay);

  var input = overlay.querySelector(".gate-input");
  var enter = overlay.querySelector(".gate-enter");
  var errEl = overlay.querySelector("#gate-err");

  function normalize(s) { return (s || "").trim().toLowerCase().replace(/\s+/g, ""); }

  input.addEventListener("input", function () {
    enter.disabled = !input.value.trim();
    if (errEl.textContent) { errEl.textContent = ""; overlay.querySelector(".gate-card").classList.remove("shake"); }
  });
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !enter.disabled) enter.click();
  });

  function pass() {
    try { localStorage.setItem(KEY, "1"); } catch (e) {}
    overlay.classList.add("hide");
    setTimeout(function () { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 520);
  }

  enter.addEventListener("click", function () {
    if (normalize(input.value) === normalize(ANSWER)) {
      pass();
    } else {
      errEl.textContent = "答案不对哦，再想想～";
      var card = overlay.querySelector(".gate-card");
      card.classList.remove("shake");
      void card.offsetWidth; // 重启动画
      card.classList.add("shake");
    }
  });

  overlay.querySelector(".gate-skip").addEventListener("click", pass);
  setTimeout(function () { try { input.focus(); } catch (e) {} }, 60);
})();
