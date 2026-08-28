// ===================== 站长身份验证（Supabase Auth） =====================
(function () {
  "use strict";
  const STORAGE_KEY = "xl_admin_session_v1";
  let activePrompt = null;

  function config() {
    return (window.WALL_CONFIG && window.WALL_CONFIG.supabase) || {};
  }

  function readSession() {
    try {
      const data = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
      if (!data || !data.access_token || !data.expires_at) return null;
      if (Number(data.expires_at) * 1000 <= Date.now() + 30000) return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  function saveSession(data) {
    const expiresAt = data.expires_at || Math.floor(Date.now() / 1000) + Number(data.expires_in || 3600);
    const session = { access_token: data.access_token, expires_at: expiresAt };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return session;
  }

  function clearSession() {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  function authHeaders(session) {
    const s = config();
    return {
      "apikey": s.anonKey,
      "Authorization": "Bearer " + session.access_token,
      "Content-Type": "application/json"
    };
  }

  async function verify(session) {
    const s = config();
    if (!s.url || !s.anonKey || !session) return false;
    const response = await fetch(s.url + "/rest/v1/rpc/is_site_admin", {
      method: "POST",
      headers: authHeaders(session),
      body: "{}"
    });
    if (!response.ok) return false;
    return (await response.json()) === true;
  }

  async function signIn(email, password) {
    const s = config();
    if (!s.url || !s.anonKey) throw new Error("Supabase 未配置");
    const response = await fetch(s.url + "/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: { "apikey": s.anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.access_token) throw new Error(data.error_description || data.msg || "登录失败");
    const session = saveSession(data);
    if (!(await verify(session))) {
      clearSession();
      throw new Error("此账号没有站长权限");
    }
    return session;
  }

  function requestLogin() {
    if (activePrompt) return activePrompt;
    activePrompt = new Promise((resolve, reject) => {
      const overlay = document.createElement("div");
      overlay.className = "admin-auth-overlay";
      overlay.innerHTML =
        '<form class="admin-auth-card" aria-label="站长登录">' +
          '<p class="admin-auth-kicker">XIANGLIN · ADMIN</p>' +
          '<h2>站长登录</h2>' +
          '<p>使用已加入 site_admins 的 Supabase Auth 账号。</p>' +
          '<input name="email" type="email" autocomplete="username" placeholder="Email" required>' +
          '<input name="password" type="password" autocomplete="current-password" placeholder="Password" required>' +
          '<p class="admin-auth-msg" role="alert"></p>' +
          '<div class="admin-auth-actions"><button type="button" data-cancel>取消</button><button type="submit">登录</button></div>' +
        '</form>';
      document.body.appendChild(overlay);
      const form = overlay.querySelector("form");
      const msg = overlay.querySelector(".admin-auth-msg");
      const submit = form.querySelector('button[type="submit"]');
      const finish = (value, error) => {
        overlay.remove();
        activePrompt = null;
        if (error) reject(error); else resolve(value);
      };
      overlay.querySelector("[data-cancel]").addEventListener("click", () => finish(null, new Error("已取消登录")));
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        submit.disabled = true;
        msg.textContent = "正在验证…";
        try {
          const session = await signIn(form.email.value.trim(), form.password.value);
          finish(session);
        } catch (error) {
          msg.textContent = error && error.message ? error.message : "登录失败";
          submit.disabled = false;
        }
      });
      form.email.focus();
    });
    return activePrompt;
  }

  async function ensure() {
    const cached = readSession();
    if (cached && await verify(cached)) return cached;
    clearSession();
    return requestLogin();
  }

  window.XLAdminAuth = {
    ensure,
    clear: clearSession,
    async headers() { return authHeaders(await ensure()); },
    isSignedIn() { return !!readSession(); }
  };
})();
