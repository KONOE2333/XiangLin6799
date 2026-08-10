// ===================== 小海盐星空软木板（匿名共享、可拖拽） =====================
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const board = $("gallery-board");
  const closeBtn = $("gallery-board-close");
  const wall = $("gallery-wall");
  const form = $("gallery-upload-form");
  const imageInput = $("gallery-image");
  const titleInput = $("gallery-title");
  const msgEl = $("gallery-upload-msg");
  const adminToggle = $("gallery-admin-toggle");
  const GUEST_KEY = "xl_photo_guest_id";
  const MAX_SIZE = 5 * 1024 * 1024;
  let photos = [];
  let loaded = false;
  let adminMode = false;
  let adminCode = "";
  let dragPhoto = null;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  function getGuestId() {
    try {
      let id = localStorage.getItem(GUEST_KEY);
      if (!id) {
        id = "g_" + Date.now().toString(36) + "_" + Math.random().toString(16).slice(2, 10);
        localStorage.setItem(GUEST_KEY, id);
      }
      return id;
    } catch (e) {
      return "g_" + Date.now().toString(36);
    }
  }

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function cfg() {
    return window.WALL_CONFIG || {};
  }

  function headers() {
    const s = cfg().supabase || {};
    return {
      "apikey": s.anonKey,
      "Authorization": "Bearer " + s.anonKey,
      "Content-Type": "application/json"
    };
  }

  function setMsg(text, ok) {
    if (!msgEl) return;
    msgEl.textContent = text || "";
    msgEl.classList.toggle("ok", !!ok);
  }

  async function callRpc(name, body) {
    const c = cfg();
    if (!c.supabase || !c.supabase.url) throw new Error("云端未配置");
    const r = await fetch(c.supabase.url + "/rest/v1/rpc/" + name, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body || {})
    });
    const text = await r.text();
    if (!r.ok) {
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch (e) {}
      throw new Error(data.message || (name + " 失败"));
    }
    return text ? JSON.parse(text) : [];
  }

  async function uploadImage(file) {
    const c = cfg();
    const s = c.supabase;
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = "photo-submissions/" + getGuestId().slice(0, 10) + "/" +
      (window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(16).slice(2)) +
      "." + ext;
    const r = await fetch(s.url + "/storage/v1/object/photo-uploads/" + path, {
      method: "POST",
      headers: {
        "apikey": s.anonKey,
        "Authorization": "Bearer " + s.anonKey,
        "Content-Type": file.type || "application/octet-stream"
      },
      body: file
    });
    if (!r.ok) throw new Error("图片上传失败");
    return s.url + "/storage/v1/object/public/photo-uploads/" + path;
  }

  function renderWall() {
    if (!wall) return;
    wall.innerHTML = "";
    if (!photos.length) {
      wall.innerHTML = '<p class="board-empty">还没有照片上墙，先贴第一张吧～</p>';
      return;
    }
    const guestId = getGuestId();
    photos.forEach((item) => {
      const photo = document.createElement("div");
      photo.className = "sticky-photo";
      photo.dataset.id = item.id;
      photo.style.left = (item.pos_x == null ? 50 : Number(item.pos_x)) + "%";
      photo.style.top = (item.pos_y == null ? 35 : Number(item.pos_y)) + "%";
      photo.style.setProperty("--rot", (item.rot || 0) + "deg");
      const own = item.owner_key && item.owner_key === guestId;
      const del = own
        ? '<button class="sticky-del" type="button" data-id="' + esc(item.id) + '" data-own="1">✕</button>'
        : (adminMode ? '<button class="sticky-del" type="button" data-id="' + esc(item.id) + '">✕</button>' : "");
      photo.innerHTML =
        del +
        '<img src="' + esc(item.image_url) + '" alt="' + esc(item.title || "") + '" loading="lazy" draggable="false">' +
        (item.title ? '<div class="sticky-title">' + esc(item.title) + "</div>" : "");
      wall.appendChild(photo);
    });
  }

  async function loadWall() {
    const c = cfg();
    if (!c.supabase || !c.supabase.url) return;
    try {
      const r = await fetch(c.supabase.url +
        "/rest/v1/photo_submissions?select=id,title,image_url,owner_key,pos_x,pos_y,rot&status=eq.approved&order=created_at.desc", {
          headers: {
            "apikey": c.supabase.anonKey,
            "Authorization": "Bearer " + c.supabase.anonKey
          }
        });
      if (!r.ok) throw new Error("load " + r.status);
      photos = await r.json();
      loaded = true;
      renderWall();
    } catch (e) {
      console.warn("软木板加载失败：", e);
    }
  }

  function open() {
    if (!board) return;
    board.classList.add("show");
    board.setAttribute("aria-hidden", "false");
    document.body.classList.add("board-open");
    if (!loaded) loadWall();
  }

  function close() {
    if (!board) return;
    board.classList.remove("show");
    board.setAttribute("aria-hidden", "true");
    document.body.classList.remove("board-open");
  }

  window.GalleryBoard = { open, close };

  if (closeBtn) closeBtn.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  if (form) form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const file = imageInput && imageInput.files && imageInput.files[0];
    const title = titleInput ? titleInput.value.trim() : "";
    if (!file) return setMsg("请选择一张本地图片");
    if (file.size > MAX_SIZE) return setMsg("图片不能超过 5MB");
    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    setMsg("正在钉上软木板…");
    try {
      const imageUrl = await uploadImage(file);
      await callRpc("submit_photo_entry", {
        p_owner_key: getGuestId(),
        p_title: title || "小海盐的照片",
        p_content: "",
        p_category: null,
        p_image_url: imageUrl
      });
      if (form) form.reset();
      await loadWall();
      setMsg("已经钉上软木板，拖动可以调整位置。", true);
    } catch (err) {
      setMsg(err && err.message ? err.message : "上传失败，请稍后重试");
    } finally {
      btn.disabled = false;
    }
  });

  if (wall) wall.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".sticky-del")) return;
    const photo = e.target.closest(".sticky-photo");
    if (!photo) return;
    const rect = photo.getBoundingClientRect();
    dragPhoto = photo;
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    photo.classList.add("dragging");
    photo.setPointerCapture(e.pointerId);
  });

  document.addEventListener("pointermove", (e) => {
    if (!dragPhoto || !wall) return;
    const boardRect = wall.getBoundingClientRect();
    const x = (e.clientX - boardRect.left - dragOffsetX) / boardRect.width * 100;
    const y = (e.clientY - boardRect.top - dragOffsetY) / boardRect.height * 100;
    dragPhoto.style.left = Math.max(2, Math.min(98, x)) + "%";
    dragPhoto.style.top = Math.max(2, Math.min(98, y)) + "%";
  });

  document.addEventListener("pointerup", async (e) => {
    if (!dragPhoto) return;
    const photo = dragPhoto;
    dragPhoto = null;
    photo.classList.remove("dragging");
    try {
      await callRpc("move_photo_submission", {
        p_target_id: photo.dataset.id,
        p_x: Number(parseFloat(photo.style.left)),
        p_y: Number(parseFloat(photo.style.top)),
        p_rot: Number(photo.style.getPropertyValue("--rot").replace("deg", "") || 0)
      });
    } catch (err) {
      console.warn("位置保存失败：", err);
    }
  });

  if (wall) wall.addEventListener("click", async (e) => {
    const del = e.target.closest(".sticky-del");
    if (!del) return;
    const id = del.dataset.id;
    const own = del.dataset.own === "1";
    if (!window.confirm("确定删除这张照片吗？")) return;
    try {
      if (own) {
        await callRpc("delete_own_photo_submission", { p_target_id: id, p_owner_key: getGuestId() });
      } else if (adminMode) {
        await callRpc("delete_photo_submission", { p_target_id: id, p_admin_code: adminCode });
      } else {
        return;
      }
      photos = photos.filter(x => x.id !== id);
      renderWall();
    } catch (err) {
      window.alert(err && err.message ? err.message : "删除失败");
    }
  });

  if (adminToggle) adminToggle.addEventListener("click", () => {
    if (adminMode) {
      adminMode = false;
      adminCode = "";
      adminToggle.textContent = "站长模式";
      renderWall();
      return;
    }
    const code = window.prompt("请输入站长口令", "");
    if (code === null) return;
    if (code.trim() !== (cfg().adminCode || "")) {
      window.alert("口令错误");
      return;
    }
    adminMode = true;
    adminCode = code.trim();
    adminToggle.textContent = "退出站长模式";
    renderWall();
  });
})();
