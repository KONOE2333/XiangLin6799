// ===================== 更新日志渲染 =====================
// 数据源：js/changelog-data.js -> window.CHANGELOG（按时间倒序）
// 复用点：
//   1) 首页状态面板 #stat-update —— 展示最近一次更新日期（MM-DD）
//   2) About 页 #changelog 列表 —— 原展示于首页，现迁移至 About
(function () {
  // 1) 首页状态栏：最近一次更新日期
  var updateEl = document.getElementById("stat-update");
  if (updateEl && window.CHANGELOG && window.CHANGELOG.length) {
    var d = String(window.CHANGELOG[0].date || "");
    updateEl.textContent = d ? d.slice(5) : "··";
  }

  // 2) 列表（现展示于 About 页；首页已不再渲染该列表）
  var ul = document.getElementById("changelog");
  if (!ul || typeof CHANGELOG === "undefined" || !CHANGELOG.length) return;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  CHANGELOG.forEach(function (it) {
    var li = document.createElement("li");
    li.className = "log-item";
    li.innerHTML =
      '<span class="log-date">' + it.date + '</span>' +
      '<span class="log-text">' + esc(it.text) + "</span>";
    ul.appendChild(li);
  });
})();
