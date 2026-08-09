// ===================== 轻量账号：注册 / 登录 / 会话 =====================
(function () {
  "use strict";
  const TOKEN_KEY = "xl_session_token";
  const USER_KEY = "xl_session_user";
  let currentUser = null;

  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) currentUser = JSON.parse(raw);
  } catch (e) {}

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

  async function rpc(name, body) {
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

  async function register(username, displayName, password) {
    const rows = await rpc("register_user", {
      p_username: username,
      p_display_name: displayName,
      p_password: password
    });
    const data = rows && rows[0];
    if (!data) throw new Error("注册失败，请稍后重试");
    setSession(data);
    return data;
  }

  async function login(username, password) {
    const rows = await rpc("login_user", {
      p_username: username,
      p_password: password
    });
    const data = rows && rows[0];
    if (!data) throw new Error("登录失败，请稍后重试");
    setSession(data);
    return data;
  }

  function setSession(data) {
    currentUser = { username: data.username, display_name: data.display_name };
    try {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
    } catch (e) {}
  }

  function getToken() {
    try { return localStorage.getItem(TOKEN_KEY) || ""; } catch (e) { return ""; }
  }

  function getUser() {
    return currentUser;
  }

  function logout() {
    currentUser = null;
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {}
  }

  window.SiteAuth = {
    register,
    login,
    getToken,
    getUser,
    logout,
    headers
  };
})();
