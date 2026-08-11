// ===================== 翔霖专属入站验证（轻量开场仪式，仅首次） =====================
(function () {
  "use strict";
  var KEY = "xl_gate_passed";
  try { if (localStorage.getItem(KEY) === "1") return; } catch (e) {}

  var QUESTIONS = [
    { question: "我们最爱的球队是什么？（5 个字）", answer: "拜仁慕尼黑", maxlength: 12 },
    { question: "贺儿最喜欢怎么称呼小严？（1 个字）", answer: "他", maxlength: 8 },
    { question: "我们的应援色是？（4 个字）", answer: "克莱因蓝", maxlength: 12 }
  ];
  var current = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];

  var overlay = document.createElement("div");
  overlay.className = "gate";
  overlay.innerHTML =
    '<div class="gate-card">' +
      '<div class="gate-kicker">XIANG LIN · VERIFY</div>' +
      '<div class="gate-title">欢迎来到翔霖小站</div>' +
      '<div class="gate-question">' + current.question + '</div>' +
      '<input class="gate-input" type="text" placeholder="输入答案" maxlength="' + current.maxlength + '" autocomplete="off">' +
      '<div class="gate-err" id="gate-err"></div>' +
      '<button class="gate-enter" type="button" disabled>进 入 ✦</button>' +
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
    if (window.XLAudio && window.XLAudio.playFromEntry) {
      window.XLAudio.playFromEntry();
    }
    overlay.classList.add("hide");
    setTimeout(function () { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 520);
  }

  enter.addEventListener("click", function () {
    if (normalize(input.value) === normalize(current.answer)) {
      pass();
    } else {
      errEl.textContent = "答案不对哦，再想想～";
      var card = overlay.querySelector(".gate-card");
      card.classList.remove("shake");
      void card.offsetWidth; // 重启动画
      card.classList.add("shake");
    }
  });

  setTimeout(function () { try { input.focus(); } catch (e) {} }, 60);
})();
