// 移动端导航折叠：打开后点击链接、遮罩或 ESC 均可收起。
(function () {
  "use strict";
  const btn = document.getElementById("nav-toggle");
  const links = document.getElementById("nav-links");
  if (!btn || !links) return;

  function setOpen(open) {
    links.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  btn.addEventListener("click", () => setOpen(!links.classList.contains("open")));
  links.addEventListener("click", (e) => {
    if (e.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
})();

// ===================== 管理入口隐式触发 =====================
// 站长后台入口默认隐藏，仅以下方式可呼出：
//  1) URL 带 #admin 哈希（如 review.html#admin / wall.html#admin）
//  2) 连点页脚像素爱心 5 次
// 注意：纯前端口令仅防误触，不是真正权限系统（见 AGENT_BRIEF 安全提醒）。
(function () {
  "use strict";
  function revealAdmin() {
    var bar = document.getElementById("admin-bar");
    if (bar) bar.classList.add("revealed");
    var rl = document.getElementById("review-login");
    if (rl) rl.classList.add("revealed");
  }
  if (location.hash === "#admin") revealAdmin();
  var mark = document.querySelector(".footer-mark");
  if (mark) {
    var clicks = 0, timer = null;
    mark.addEventListener("click", function () {
      clicks += 1;
      clearTimeout(timer);
      timer = setTimeout(function () { clicks = 0; }, 1600);
      if (clicks >= 5) { clicks = 0; revealAdmin(); }
    });
  }
})();
