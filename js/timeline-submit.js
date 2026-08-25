// ===================== 记忆时间轴投稿表单 =====================
(function () {
  "use strict";
  const auth = window.SiteAuth;
  if (!auth) return;

  const $ = (id) => document.getElementById(id);
  const authPanel = $("auth-panel");
  const authLogin = $("auth-login");
  const authRegister = $("auth-register");
  const authMsg = $("auth-msg");
  const submitForm = $("timeline-submit-form");
  const submitMsg = $("submit-msg");
  const submitWho = $("submit-who");
  const imageInput = $("tl-image");
  const imagePreview = $("image-preview");
  const imageInfo = $("image-info");
  const MAX_SIZE = 5 * 1024 * 1024;

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
    if (submitWho && user) submitWho.textContent = "正在以 " + user.display_name + " 的身份投稿";
  }

  function switchAuthTab(mode) {
    const login = $("auth-tab-login");
    const reg = $("auth-tab-register");
    if (!authLogin || !authRegister) return;
    const toLogin = mode === "login";
    authLogin.classList.toggle("hidden", !toLogin);
    authRegister.classList.toggle("hidden", toLogin);
    if (login) login.classList.toggle("on", toLogin);
    if (reg) reg.classList.toggle("on", !toLogin);
    setMsg(authMsg, "");
  }

  const tabLogin = $("auth-tab-login");
  const tabRegister = $("auth-tab-register");
  if (tabLogin) tabLogin.addEventListener("click", () => switchAuthTab("login"));
  if (tabRegister) tabRegister.addEventListener("click", () => switchAuthTab("register"));

  const loginBtn = $("login-btn");
  if (loginBtn) loginBtn.addEventListener("click", async () => {
    const username = $("login-username").value.trim();
    const password = $("login-password").value;
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

  const registerBtn = $("register-btn");
  if (registerBtn) registerBtn.addEventListener("click", async () => {
    const username = $("register-username").value.trim();
    const password = $("register-password").value;
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

  const logoutBtn = $("logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", () => {
    auth.logout();
    submitForm.reset();
    if (imagePreview) imagePreview.classList.add("hidden");
    setMsg(submitMsg, "");
    showAuth();
  });

  function previewImage(file) {
    if (!imagePreview || !file) return;
    const url = URL.createObjectURL(file);
    imagePreview.src = url;
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
      setMsg(submitMsg, "图片不能超过 5MB，请压缩后再上传");
      imageInput.value = "";
      if (imagePreview) imagePreview.classList.add("hidden");
      if (imageInfo) imageInfo.textContent = "";
      return;
    }
    previewImage(file);
    setMsg(submitMsg, "");
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
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      throw new Error(data.message || (name + " 失败"));
    }
    return r.json();
  }

  async function uploadImage(file) {
    const c = cfg();
    const s = c.supabase;
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const token = auth.getToken().slice(0, 8);
    const path = "submissions/" + token + "/" +
      (window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(16).slice(2)) +
      "." + ext;
    const r = await fetch(s.url + "/storage/v1/object/timeline-uploads/" + path, {
      method: "POST",
      headers: {
        "apikey": s.anonKey,
        "Authorization": "Bearer " + s.anonKey,
        "Content-Type": file.type || "application/octet-stream"
      },
      body: file
    });
    if (!r.ok) throw new Error("Image upload 失败");
    return s.url + "/storage/v1/object/public/timeline-uploads/" + path;
  }

  if (submitForm) submitForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = $("tl-title").value.trim();
    const eventDate = $("tl-date").value.trim();
    const year = Number($("tl-year").value);
    const tag = $("tl-tag").value.trim();
    const content = $("tl-content").value.trim();
    const linkUrl = $("tl-link-url").value.trim();
    const linkText = $("tl-link-text").value.trim();
    const file = imageInput && imageInput.files && imageInput.files[0];

    if (!title || !eventDate || !content) {
      setMsg(submitMsg, "标题、时间、内容为必填项");
      return;
    }
    if (!/^\d{4}\.\d{2}(\.\d{2})?$/.test(eventDate)) {
      setMsg(submitMsg, "时间请写成 2026.08.09 这样的格式");
      return;
    }
    if (year < 2000 || year > 2035) {
      setMsg(submitMsg, "年份请填写 2000-2035");
      return;
    }
    if (file && file.size > MAX_SIZE) {
      setMsg(submitMsg, "图片不能超过 5MB，请压缩后再上传");
      return;
    }

    const submitBtn = submitForm.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    setMsg(submitMsg, "正在提交…");
    try {
      let imageUrl = "";
      if (file) imageUrl = await uploadImage(file);
      await callRpc("submit_timeline_entry", {
        p_token: auth.getToken(),
        p_title: title,
        p_event_date: eventDate,
        p_year: year,
        p_content: content,
        p_tag: tag || null,
        p_image_url: imageUrl || null,
        p_link_url: linkUrl || null,
        p_link_text: linkText || null
      });
      submitForm.reset();
      if (imagePreview) imagePreview.classList.add("hidden");
      if (imageInfo) imageInfo.textContent = "";
      setMsg(submitMsg, "投稿已提交，审核通过后会自动出现在时间轴里。", true);
    } catch (err) {
      setMsg(submitMsg, err && err.message ? err.message : "Submit 失败 — try again");
    } finally {
      submitBtn.disabled = false;
    }
  });

  if (auth.getUser()) showForm();
  else showAuth();
})();
