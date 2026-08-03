// ===================== 便签留言墙 =====================
(function () {
  "use strict";
  const KEY = "xl_wall_messages_v2";
  const wall = document.getElementById("wall-body");
  const form = document.getElementById("msg-form");
  const adminBar = document.getElementById("admin-bar");
  const codeInput = document.getElementById("admin-code");
  const adminEnter = document.getElementById("admin-enter");
  const adminHint = document.getElementById("admin-hint");
  const PALETTE = [
    ["#fff3f7", "#f8d5e3"],
    ["#f1efff", "#ddd7fa"],
    ["#eef6ff", "#d3e6fb"],
    ["#fffbea", "#f7ecc0"],
    ["#effaf3", "#d2eedd"]
  ];
  const BANDED = ["傻逼", "妈的", "滚蛋", "去死", "脑残", "垃圾团", "塌房"];

  // 云端后端（配置见 js/wall-config.js）
  const cloud = (window.WallBackend && window.WallBackend.isConfigured()) ? window.WallBackend : null;

  const seed = [
    { id: "seed1", name: "KONOE", text: "2026年才开始喜欢上你们，体会到了太多幸福与痛苦的经历，谢谢你们让我更加懂得感情的复杂，未来也请一起走吧", time: "2026/07/28", likes: 0 }
  ];

  let adminMode = (function () { try { return localStorage.getItem("xl_admin") === "1"; } catch { return false; } })();

  function uid() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return "m" + Date.now() + Math.random().toString(16).slice(2);
  }

  let messages = [];

  function loadLocal() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : seed;
    } catch { return seed; }
  }
  function saveLocal() {
    try { localStorage.setItem(KEY, JSON.stringify(messages)); } catch {}
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

  function render() {
    wall.innerHTML = "";
    if (!messages.length) {
      wall.innerHTML = '<p class="wall-empty">还没有留言，来贴第一张便签吧～</p>';
      return;
    }
    messages.slice().forEach((m, idx) => {
      const realIndex = messages.length - 1 - idx;
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
        (adminMode ? '<button class="note-del" type="button" data-id="' + m.id + '" title="删除这条留言">删除</button>' : "");
      wall.appendChild(note);
    });
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  wall.addEventListener("click", async (e) => {
    // —— 站长删除 ——
    const del = e.target.closest(".note-del");
    if (del) {
      const id = del.dataset.id;
      if (!confirm("确定删除这条留言吗？删除后所有人不可见。")) return;
      if (cloud) {
        try {
          await cloud.remove(id);
          messages = messages.filter((x) => x.id !== id);
          render();
        } catch (err) { console.warn("删除失败：", err); alert("删除失败：" + (err && err.message ? err.message : err) + "\n（若提示 401/403，多半是 Supabase 缺「public update」策略——请到 SQL Editor 重跑 wall-config.js 底部那段 SQL；若提示 400/404，多半是 deleted 列未就绪）"); }
      } else {
        messages = messages.filter((x) => x.id !== id);
        saveLocal();
        render();
      }
      return;
    }
    // —— 点赞 ——
    const btn = e.target.closest(".note-like");
    if (!btn) return;
    const id = btn.dataset.id;
    const m = messages.find((x) => x.id === id);
    if (!m) return;
    m.likes += 1;
    if (cloud) {
      try { await cloud.like(id, m.likes); }
      catch (err) { console.warn("点赞同步失败：", err); }
    } else {
      saveLocal();
    }
    render();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("msg-name").value.trim();
    const text = document.getElementById("msg-text").value.trim();
    if (!name || !text) return;
    if (BANDED.some(w => name.includes(w) || text.includes(w))) {
      alert("留言包含不友善词汇，请修改后再贴上便签哦～");
      return;
    }
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const time = now.getFullYear() + "/" + pad(now.getMonth() + 1) + "/" + pad(now.getDate()) +
                 " " + pad(now.getHours()) + ":" + pad(now.getMinutes());
    const base = { name, text, time, likes: 0 };

    if (cloud) {
      try {
        const saved = await cloud.add(base);     // 存云端，拿到云端生成的 id
        messages.unshift(saved);
        render();
        form.reset();
        return;
      } catch (err) {
        console.warn("云端提交失败，保存到本地：", err);
        base.id = uid();
        messages.unshift(base);   // 新留言置顶，与云端行为一致
        saveLocal();
        render();
        form.reset();
        return;
      }
    }

    base.id = uid();
    messages.unshift(base);       // 新留言置顶，与云端行为一致
    saveLocal();
    form.reset();
    render();
  });

  // —— 站长模式口令 ——
  if (adminBar) {
    const cfg = window.WALL_CONFIG || {};
    function applyAdmin() {
      if (adminMode) {
        if (adminHint) adminHint.textContent = "站长模式已开启";
        if (adminEnter) adminEnter.textContent = "退出站长模式";
        adminBar.classList.add("on");
      } else {
        if (adminHint) adminHint.textContent = "";
        if (adminEnter) adminEnter.textContent = "进入站长模式";
        adminBar.classList.remove("on");
        if (codeInput) codeInput.value = "";
      }
      render();
    }
    applyAdmin();

    adminEnter.addEventListener("click", () => {
      if (adminMode) {
        adminMode = false;
        try { localStorage.removeItem("xl_admin"); } catch {}
        applyAdmin();
        return;
      }
      if (codeInput && codeInput.value.trim() === (cfg.adminCode || "")) {
        adminMode = true;
        try { localStorage.setItem("xl_admin", "1"); } catch {}
        applyAdmin();
      } else if (adminHint) {
        adminHint.textContent = "口令错误";
      }
    });
    if (codeInput) codeInput.addEventListener("keydown", (e) => { if (e.key === "Enter") adminEnter.click(); });
  }

  init();
})();
