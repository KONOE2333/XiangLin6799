// ===================== 便签留言墙：留言 / 建议双分区 =====================
(function () {
  "use strict";
  const KEY = "xl_wall_messages_v2";
  const messageWall = document.getElementById("message-wall");
  const suggestionWall = document.getElementById("suggestion-wall");
  const messagePager = document.getElementById("message-pager");
  const suggestionPager = document.getElementById("suggestion-pager");
  const messageForm = document.getElementById("msg-form");
  const suggestionForm = document.getElementById("suggestion-form");
  const adminBar = document.getElementById("admin-bar");
  const adminEnter = document.getElementById("admin-enter");
  const adminHint = document.getElementById("admin-hint");
  const tabMessage = document.getElementById("tab-message");
  const tabSuggestion = document.getElementById("tab-suggestion");
  const messagePanel = document.getElementById("message-panel");
  const suggestionPanel = document.getElementById("suggestion-panel");
  const PER_PAGE = 50;
  let messagePage = 1;
  let suggestionPage = 1;
  let messages = [];

  const PALETTE = [
    ["#fff3f7", "#f8d5e3"],
    ["#f1efff", "#ddd7fa"],
    ["#eef6ff", "#d3e6fb"],
    ["#fffbea", "#f7ecc0"],
    ["#effaf3", "#d2eedd"]
  ];
  const BANDED = ["傻逼", "妈的", "滚蛋", "去死", "脑残", "垃圾团", "塌房"];
  const cloud = (window.WallBackend && window.WallBackend.isConfigured()) ? window.WallBackend : null;
  let adminMode = false;

  const seed = [
    { id: "seed1", name: "KONOE", text: "2026年才开始喜欢上你们，体会到了太多幸福与痛苦的经历，谢谢你们让我更加懂得感情的复杂，未来也请一起走吧", time: "2026/07/28", likes: 0, kind: "message" }
  ];

  function uid() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return "m" + Date.now() + Math.random().toString(16).slice(2);
  }

  function loadLocal() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : seed;
    } catch { return seed; }
  }

  function saveLocal() {
    try { localStorage.setItem(KEY, JSON.stringify(messages)); } catch {}
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  async function init() {
    if (cloud) {
      try {
        const list = await cloud.load();
        if (Array.isArray(list)) { messages = list; render(); return; }
      } catch (e) {
        console.warn("云端加载失败，回退本地：", e);
      }
    }
    messages = loadLocal();
    render();
  }

  function byKind(kind) {
    return messages.filter(m => (m.kind || "message") === kind);
  }

  function render() {
    renderWall("message", messageWall, messagePager, messagePage, set => messagePage = set);
    renderWall("suggestion", suggestionWall, suggestionPager, suggestionPage, set => suggestionPage = set);
  }

  function renderWall(kind, wall, pager, page, setPage) {
    if (!wall) return;
    wall.innerHTML = "";
    const list = byKind(kind);
    if (!list.length) {
      wall.innerHTML = '<p class="wall-empty">' + (kind === "message" ? "还没有留言，来贴第一张便签吧～" : "还没有建议，来写下第一条吧～") + "</p>";
      if (pager) pager.innerHTML = "";
      return;
    }
    const totalPages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    if (page > totalPages) setPage(totalPages);
    const current = Math.min(page, totalPages);
    const start = (current - 1) * PER_PAGE;
    const pageItems = list.slice(start, start + PER_PAGE);
    pageItems.forEach((m, idx) => {
      const realIndex = list.length - 1 - (start + idx);
      const [bg, edge] = PALETTE[realIndex % PALETTE.length];
      const rot = ((realIndex * 37) % 5) - 2;
      const note = document.createElement("div");
      note.className = "note" + (adminMode ? " admin" : "");
      note.style.background = bg;
      note.style.border = "1px solid " + edge;
      note.style.transform = "rotate(" + rot + "deg)";
      note.innerHTML =
        "<p>" + escapeHtml(m.text) + "</p>" +
        '<div class="note-meta"><span>' + escapeHtml(m.name) + " · " + m.time + "</span>" +
        '<button class="note-like" type="button" data-id="' + m.id + '">♥ ' + m.likes + "</button></div>" +
        (adminMode ? '<button class="note-del" type="button" data-id="' + m.id + '" title="删除">删除</button>' : "");
      wall.appendChild(note);
    });
    renderPager(pager, totalPages, current, kind);
  }

  function renderPager(pager, totalPages, current, kind) {
    if (!pager) return;
    if (totalPages <= 1) { pager.innerHTML = ""; return; }
    let html = '<button type="button" data-kind="' + kind + '" data-page="prev"' + (current === 1 ? " disabled" : "") + ">‹ 上一页</button>";
    for (let i = 1; i <= totalPages; i++) {
      html += '<button type="button" data-kind="' + kind + '" data-page="' + i + '"' + (i === current ? ' class="on"' : "") + ">" + i + "</button>";
    }
    html += '<button type="button" data-kind="' + kind + '" data-page="next"' + (current === totalPages ? " disabled" : "") + ">下一页 ›</button>";
    pager.innerHTML = html;
  }

  function handlePager(e, kind) {
    const btn = e.target.closest("button[data-page]");
    if (!btn || btn.disabled || btn.dataset.kind !== kind) return;
    const list = byKind(kind);
    const totalPages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    if (kind === "message") {
      if (btn.dataset.page === "prev") messagePage = Math.max(1, messagePage - 1);
      else if (btn.dataset.page === "next") messagePage = Math.min(totalPages, messagePage + 1);
      else messagePage = Number(btn.dataset.page);
    } else {
      if (btn.dataset.page === "prev") suggestionPage = Math.max(1, suggestionPage - 1);
      else if (btn.dataset.page === "next") suggestionPage = Math.min(totalPages, suggestionPage + 1);
      else suggestionPage = Number(btn.dataset.page);
    }
    render();
  }

  if (messagePager) messagePager.addEventListener("click", e => handlePager(e, "message"));
  if (suggestionPager) suggestionPager.addEventListener("click", e => handlePager(e, "suggestion"));

  function handleWallClick(e, kind) {
    const del = e.target.closest(".note-del");
    if (del) {
      const id = del.dataset.id;
      if (!confirm("确定删除这条吗？删除后所有人不可见。")) return;
      if (cloud) {
        cloud.remove(id)
          .then(() => { messages = messages.filter(x => x.id !== id); render(); })
          .catch(err => { console.warn("删除失败：", err); alert("删除失败：" + (err && err.message ? err.message : err)); });
      } else {
        messages = messages.filter(x => x.id !== id);
        saveLocal();
        render();
      }
      return;
    }
    const btn = e.target.closest(".note-like");
    if (!btn) return;
    const id = btn.dataset.id;
    const m = messages.find(x => x.id === id);
    if (!m) return;
    m.likes += 1;
    if (cloud) {
      cloud.like(id, m.likes).catch(err => console.warn("点赞同步失败：", err));
    } else {
      saveLocal();
    }
    render();
  }

  if (messageWall) messageWall.addEventListener("click", e => handleWallClick(e, "message"));
  if (suggestionWall) suggestionWall.addEventListener("click", e => handleWallClick(e, "suggestion"));

  function submitNote(form, kind) {
    if (!form) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = form.querySelector("input[type=text]").value.trim();
      const text = form.querySelector("textarea").value.trim();
      if (!name || !text) return;
      if (BANDED.some(w => name.includes(w) || text.includes(w))) {
        alert("内容包含不友善词汇，请修改后再贴上～");
        return;
      }
      const now = new Date();
      const pad = n => String(n).padStart(2, "0");
      const time = now.getFullYear() + "/" + pad(now.getMonth() + 1) + "/" + pad(now.getDate()) + " " + pad(now.getHours()) + ":" + pad(now.getMinutes());
      const base = { name, text, time, likes: 0, kind };
      if (cloud) {
        try {
          const saved = await cloud.add(base);
          messages.unshift(saved);
          if (kind === "message") messagePage = 1; else suggestionPage = 1;
          render();
          form.reset();
          return;
        } catch (err) {
          console.warn("云端提交失败，保存到本地：", err);
          base.id = uid();
          messages.unshift(base);
          if (kind === "message") messagePage = 1; else suggestionPage = 1;
          saveLocal();
          render();
          form.reset();
          return;
        }
      }
      base.id = uid();
      messages.unshift(base);
      if (kind === "message") messagePage = 1; else suggestionPage = 1;
      saveLocal();
      render();
      form.reset();
    });
  }

  submitNote(messageForm, "message");
  submitNote(suggestionForm, "suggestion");

  if (tabMessage && tabSuggestion && messagePanel && suggestionPanel) {
    tabMessage.addEventListener("click", () => {
      tabMessage.classList.add("on");
      tabSuggestion.classList.remove("on");
      messagePanel.classList.remove("hidden");
      suggestionPanel.classList.add("hidden");
    });
    tabSuggestion.addEventListener("click", () => {
      tabSuggestion.classList.add("on");
      tabMessage.classList.remove("on");
      suggestionPanel.classList.remove("hidden");
      messagePanel.classList.add("hidden");
    });
  }

  if (adminBar) {
    function applyAdmin() {
      if (adminMode) {
        if (adminHint) adminHint.textContent = "站长模式已开启";
        if (adminEnter) adminEnter.textContent = "退出站长模式";
        adminBar.classList.add("on");
      } else {
        if (adminHint) adminHint.textContent = "";
        if (adminEnter) adminEnter.textContent = "进入站长模式";
        adminBar.classList.remove("on");
      }
      render();
    }
    applyAdmin();
    adminEnter.addEventListener("click", async () => {
      if (adminMode) {
        adminMode = false;
        if (window.XLAdminAuth) window.XLAdminAuth.clear();
        applyAdmin();
        return;
      }
      try {
        if (!window.XLAdminAuth) throw new Error("站长登录模块未加载");
        await window.XLAdminAuth.ensure();
        adminMode = true;
        applyAdmin();
      } catch (error) {
        if (adminHint) adminHint.textContent = error && error.message ? error.message : "登录失败";
      }
    });
  }

  init();
})();
