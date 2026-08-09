// ===================== 照片图库投稿 + 小海盐影像墙 =====================
(function () {
  "use strict";
  const auth = window.SiteAuth;
  if (!auth) return;

  const $ = (id) => document.getElementById(id);
  const authPanel = $("gallery-auth-panel");
  const authMsg = $("gallery-auth-msg");
  const submitForm = $("gallery-submit-form");
  const wall = $("gallery-wall");
  const imageInput = $("gallery-image");
  const imagePreview = $("gallery-image-preview");
  const imageInfo = $("gallery-image-info");
  const MAX_SIZE = 5 * 1024 * 1024;
  let approvedPhotos = [];
  let adminMode = false;
  let adminCode = "";

  function setMsg(el, text, ok) {
    if (!el) return;
    el.textContent = text || "";
    el.classList.toggle("ok", !!ok);
  }

  function showAuth() {
    if (!authPanel) return;
    authPanel.classList.remove("hidden");
    if (submitForm) submitForm.classList.add("hidden");
  }

  function showForm() {
    if (!authPanel) return;
    authPanel.classList.add("hidden");
    if (submitForm) submitForm.classList.remove("hidden");
    const user = auth.getUser();
    if ($("gallery-submit-who") && user) {
      $("gallery-submit-who").textContent = "正在以 " + user.display_name + " 的身份投稿";
    }
  }

  function switchAuthTab(mode) {
    const login = $("gallery-auth-tab-login");
    const reg = $("gallery-auth-tab-register");
    const toLogin = mode === "login";
    $("gallery-auth-login").classList.toggle("hidden", !toLogin);
    $("gallery-auth-register").classList.toggle("hidden", toLogin);
    if (login) login.classList.toggle("on", toLogin);
    if (reg) reg.classList.toggle("on", !toLogin);
    setMsg(authMsg, "");
  }

  const tabLogin = $("gallery-auth-tab-login");
  const tabRegister = $("gallery-auth-tab-register");
  if (tabLogin) tabLogin.addEventListener("click", () => switchAuthTab("login"));
  if (tabRegister) tabRegister.addEventListener("click", () => switchAuthTab("register"));

  const loginBtn = $("gallery-login-btn");
  if (loginBtn) loginBtn.addEventListener("click", async () => {
    const username = $("gallery-login-username").value.trim();
    const password = $("gallery-login-password").value;
    if (!username || !password) return setMsg(authMsg, "请输入用户名和密码");
    loginBtn.disabled = true;
    try {
      await auth.login(username, password);
      showForm();
    } catch (e) {
      setMsg(authMsg, e && e.message ? e.message : "登录失败");
    } finally {
      loginBtn.disabled = false;
    }
  });

  const registerBtn = $("gallery-register-btn");
  if (registerBtn) registerBtn.addEventListener("click", async () => {
    const username = $("gallery-register-username").value.trim();
    const password = $("gallery-register-password").value;
    if (!username || !password) return setMsg(authMsg, "请填写用户名和密码");
    registerBtn.disabled = true;
    try {
      await auth.register(username, password);
      showForm();
    } catch (e) {
      setMsg(authMsg, e && e.message ? e.message : "注册失败");
    } finally {
      registerBtn.disabled = false;
    }
  });

  const logoutBtn = $("gallery-logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", () => {
    auth.logout();
    if (submitForm) submitForm.reset();
    if (imagePreview) imagePreview.classList.add("hidden");
    setMsg($("gallery-submit-msg"), "");
    showAuth();
  });

  function previewImage(file) {
    if (!imagePreview || !file) return;
    imagePreview.src = URL.createObjectURL(file);
    imagePreview.classList.remove("hidden");
    if (imageInfo) imageInfo.textContent = Math.round(file.size / 1024) + " KB";
  }

  if (imageInput) imageInput.addEventListener("change", () => {
    const file = imageInput.files && imageInput.files[0];
    if (!file) {
      if (imagePreview) imagePreview.classList.add("hidden");
      if (imageInfo) imageInfo.textContent = "";
      return;
    }
    if (file.size > MAX_SIZE) {
      setMsg($("gallery-submit-msg"), "图片不能超过 5MB，请压缩后再上传");
      imageInput.value = "";
      if (imagePreview) imagePreview.classList.add("hidden");
      if (imageInfo) imageInfo.textContent = "";
      return;
    }
    previewImage(file);
    setMsg($("gallery-submit-msg"), "");
  });

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
    const token = auth.getToken().slice(0, 8);
    const path = "photo-submissions/" + token + "/" +
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

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function renderWall() {
    if (!wall) return;
    wall.innerHTML = "";
    if (!approvedPhotos.length) {
      wall.innerHTML = '<p class="gallery-wall-empty">还没有审核通过的影像，等第一张投稿上墙吧～</p>';
      return;
    }
    approvedPhotos.forEach((item) => {
      const card = document.createElement("article");
      card.className = "gallery-card";
      card.dataset.id = item.id;
      const del = (adminMode && item.id)
        ? '<button class="gallery-delete-btn" type="button" data-id="' + esc(item.id) + '">删除</button>'
        : "";
      card.innerHTML =
        '<div class="gallery-card-img"><img src="' + esc(item.image_url) + '" alt="' + esc(item.title) + '" loading="lazy"></div>' +
        '<div class="gallery-card-body">' +
          '<h3>' + esc(item.title) + '</h3>' +
          '<p>' + esc(item.content) + "</p>" +
          '<div class="gallery-card-meta">' +
            (item.category ? '<span class="gallery-tag">' + esc(item.category) + "</span>" : "") +
            '<span>' + esc(item.submitter_name) + "</span>" +
          "</div>" +
          del +
        "</div>";
      wall.appendChild(card);
    });
  }

  async function loadWall() {
    const c = cfg();
    if (!c.supabase || !c.supabase.url) return;
    try {
      const r = await fetch(c.supabase.url +
        "/rest/v1/photo_submissions?select=id,title,content,category,image_url,submitter_name&status=eq.approved&order=created_at.desc", {
          headers: {
            "apikey": c.supabase.anonKey,
            "Authorization": "Bearer " + c.supabase.anonKey
          }
        });
      if (!r.ok) throw new Error("load " + r.status);
      approvedPhotos = await r.json();
      renderWall();
    } catch (e) {
      console.warn("影像墙加载失败：", e);
    }
  }

  if (submitForm) submitForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = $("gallery-title").value.trim();
    const content = $("gallery-content").value.trim();
    const category = $("gallery-category").value.trim();
    const file = imageInput && imageInput.files && imageInput.files[0];
    if (!title || !content) {
      setMsg($("gallery-submit-msg"), "标题和说明为必填项");
      return;
    }
    if (!file) {
      setMsg($("gallery-submit-msg"), "请选择一张图片");
      return;
    }
    if (file.size > MAX_SIZE) {
      setMsg($("gallery-submit-msg"), "图片不能超过 5MB，请压缩后再上传");
      return;
    }
    const btn = submitForm.querySelector("button[type=submit]");
    btn.disabled = true;
    setMsg($("gallery-submit-msg"), "正在提交…");
    try {
      const imageUrl = await uploadImage(file);
      await callRpc("submit_photo_entry", {
        p_token: auth.getToken(),
        p_title: title,
        p_content: content,
        p_category: category || null,
        p_image_url: imageUrl
      });
      submitForm.reset();
      if (imagePreview) imagePreview.classList.add("hidden");
      if (imageInfo) imageInfo.textContent = "";
      setMsg($("gallery-submit-msg"), "照片已提交，审核通过后会出现在小海盐影像墙。", true);
    } catch (err) {
      setMsg($("gallery-submit-msg"), err && err.message ? err.message : "提交失败，请稍后重试");
    } finally {
      btn.disabled = false;
    }
  });

  const adminToggle = $("gallery-admin-toggle");
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
    if (code.trim() !== ((cfg().adminCode) || "")) {
      window.alert("口令错误");
      return;
    }
    adminMode = true;
    adminCode = code.trim();
    adminToggle.textContent = "退出站长模式";
    renderWall();
  });

  if (wall) wall.addEventListener("click", async (e) => {
    const del = e.target.closest(".gallery-delete-btn");
    if (!del || !adminMode) return;
    if (!window.confirm("确定删除这张影像吗？删除后所有人不可见。")) return;
    try {
      await callRpc("delete_photo_submission", {
        p_target_id: del.dataset.id,
        p_admin_code: adminCode
      });
      approvedPhotos = approvedPhotos.filter(x => x.id !== del.dataset.id);
      renderWall();
    } catch (err) {
      window.alert(err && err.message ? err.message : "删除失败");
    }
  });

  if (auth.getUser()) showForm();
  else showAuth();
  loadWall();

  window.addEventListener("scroll", () => {
    document.body.classList.toggle("scrolled", window.scrollY > window.innerHeight * 0.5);
  }, { passive: true });
})();
