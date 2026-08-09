// ===================== 时间轴投稿审核后台 =====================
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const codeInput = $("review-code");
  const enterBtn = $("review-enter");
  const msgEl = $("review-msg");
  const loginBox = $("review-login");
  const body = $("review-body");
  const tabs = $("review-tabs");
  const cfg = window.WALL_CONFIG || {};
  let adminCode = "";
  let activeType = "timeline";

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function headers() {
    const s = cfg.supabase || {};
    return {
      "apikey": s.anonKey,
      "Authorization": "Bearer " + s.anonKey,
      "Content-Type": "application/json"
    };
  }

  async function rpc(name, payload) {
    if (!cfg.supabase || !cfg.supabase.url) throw new Error("云端未配置");
    const r = await fetch(cfg.supabase.url + "/rest/v1/rpc/" + name, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload || {})
    });
    const text = await r.text();
    if (!r.ok) {
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch (e) {}
      throw new Error(data.message || (name + " 失败"));
    }
    return text ? JSON.parse(text) : [];
  }

  function setMsg(text, ok) {
    if (!msgEl) return;
    msgEl.textContent = text || "";
    msgEl.classList.toggle("ok", !!ok);
  }

  function renderList(list) {
    if (!body) return;
    body.innerHTML = "";
    if (!list.length) {
      body.innerHTML = '<p class="review-empty">暂时没有待审核投稿。</p>';
      return;
    }
    list.forEach((item) => {
      const card = document.createElement("article");
      card.className = "review-card status-" + esc(item.status);
      card.dataset.cardId = item.id;
      const metaLine = item.event_date
        ? esc(item.event_date) + " · " + esc(item.year) + (item.tag ? " · " + esc(item.tag) : "")
        : (item.category ? "分类：" + esc(item.category) : "");
      card.innerHTML =
        '<div class="review-card-head"><span class="review-status">' + esc(item.status) + '</span>' +
        '<span class="review-meta">' + esc(item.submitter_name) + " · " + esc(item.created_at || "") + "</span></div>" +
        '<h3>' + esc(item.title) + '</h3>' +
        (metaLine ? '<p class="review-date">' + metaLine + "</p>" : "") +
        (item.image_url ? '<img class="review-img" src="' + esc(item.image_url) + '" alt="" loading="lazy">' : "") +
        '<p class="review-content">' + esc(item.content) + "</p>" +
        (item.link_url ? '<a class="review-link" href="' + esc(item.link_url) + '" target="_blank" rel="noopener">' + (esc(item.link_text) || "查看链接") + "</a>" : "") +
        '<div class="review-actions">' +
          '<button class="review-approve" type="button" data-id="' + esc(item.id) + '">通过</button>' +
          '<button class="review-reject" type="button" data-id="' + esc(item.id) + '">拒绝</button>' +
        "</div>";
      body.appendChild(card);
    });
  }

  async function load() {
    setMsg("正在读取投稿…");
    try {
      const name = activeType === "photo"
        ? "list_photo_submissions_for_review"
        : "list_timeline_submissions_for_review";
      const list = await rpc(name, { p_admin_code: adminCode });
      renderList(list || []);
      setMsg("");
    } catch (e) {
      setMsg(e && e.message ? e.message : "读取失败");
    }
  }

  if (enterBtn) enterBtn.addEventListener("click", async () => {
    const code = codeInput ? codeInput.value.trim() : "";
    if (!code) return setMsg("请输入站长口令");
    if (code !== (cfg.adminCode || "")) return setMsg("口令错误");
    adminCode = code;
    if (loginBox) loginBox.classList.add("hidden");
    if (tabs) tabs.classList.remove("hidden");
    if (body) body.classList.remove("hidden");
    await load();
  });

  if (tabs) tabs.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-type]");
    if (!btn || btn.dataset.type === activeType) return;
    activeType = btn.dataset.type;
    tabs.querySelectorAll("button").forEach(b => b.classList.toggle("on", b === btn));
    load();
  });

  if (body) body.addEventListener("click", async (e) => {
    const id = e.target && e.target.dataset ? e.target.dataset.id : null;
    if (!id) return;
    const approveBtn = e.target.closest(".review-approve");
    const rejectBtn = e.target.closest(".review-reject");
    const card = e.target.closest(".review-card");
    if (approveBtn) {
      approveBtn.disabled = true;
      try {
        const name = activeType === "photo" ? "approve_photo_submission" : "approve_timeline_submission";
        await rpc(name, { p_target_id: id, p_admin_code: adminCode });
        if (card) card.remove();
        if (body && !body.querySelector(".review-card")) renderList([]);
        setMsg(activeType === "photo" ? "已通过，并自动加入小海盐影像墙。" : "已通过，并自动加入记忆时间轴。", true);
      } catch (err) {
        setMsg(err && err.message ? err.message : "通过失败");
        approveBtn.disabled = false;
      }
    }
    if (rejectBtn) {
      const note = window.prompt("拒绝原因（可选）", "");
      if (note === null) return;
      rejectBtn.disabled = true;
      try {
        const name = activeType === "photo" ? "reject_photo_submission" : "reject_timeline_submission";
        await rpc(name, {
          p_target_id: id,
          p_admin_code: adminCode,
          p_note: note || ""
        });
        if (card) card.remove();
        if (body && !body.querySelector(".review-card")) renderList([]);
        setMsg("已拒绝。", true);
      } catch (err) {
        setMsg(err && err.message ? err.message : "拒绝失败");
        rejectBtn.disabled = false;
      }
    }
  });
})();
