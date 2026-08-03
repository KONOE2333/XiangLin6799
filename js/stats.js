// ===================== 首页状态面板（累计访客 / 留言数 / 建站天数） =====================
// 复用现有 Supabase：需建 site_visits 表（建表 SQL 见 js/wall-config.js 底部）。
// 访客去重：每个浏览器每天只计一次（localStorage 标记），近似「累计访客」。
(function () {
  const LAUNCH = "2026-07-25"; // 建站日期（用于计算建站天数）

  const elVisits = document.getElementById("stat-visits");
  const elMsgs = document.getElementById("stat-msgs");
  const elDays = document.getElementById("stat-days");
  if (elDays) {
    const d = Math.max(0, Math.floor((Date.now() - new Date(LAUNCH + "T00:00:00").getTime()) / 86400000));
    elDays.textContent = d;
  }

  const cfg = window.WALL_CONFIG || {};
  if (cfg.provider !== "supabase" || !cfg.supabase || !cfg.supabase.url) return;
  const { url, anonKey } = cfg.supabase;
  const headers = { "apikey": anonKey, "Authorization": "Bearer " + anonKey };

  function getCount(path) {
    const countHeaders = Object.assign({}, headers, {
      "Range": "0-0",
      "Prefer": "count=exact"
    });
    return fetch(url + path, { headers: countHeaders })
      .then((r) => {
        if (!r.ok) throw new Error("count " + r.status);
        const range = r.headers.get("content-range") || "";
        const total = Number(range.split("/")[1]);
        return Number.isFinite(total) ? total : 0;
      });
  }

  // 留言数（已删的不会计入，因查询策略过滤 deleted）
  getCount("/rest/v1/wall_messages?select=id&deleted=is.false")
    .then((n) => { if (elMsgs) elMsgs.textContent = n; })
    .catch(() => {});

  // 累计访客：今天没计数过就先插一条，再读总数
  const todayKey = "xl_visited_" + new Date().toISOString().slice(0, 10);
  let counted = false;
  try { counted = localStorage.getItem(todayKey) === "1"; } catch (e) {}

  function readVisits() {
    getCount("/rest/v1/site_visits?select=id")
      .then((n) => { if (elVisits) elVisits.textContent = n; })
      .catch(() => {});
  }

  if (!counted) {
    fetch(url + "/rest/v1/site_visits", {
      method: "POST",
      headers: Object.assign({}, headers, { "Content-Type": "application/json", "Prefer": "return=minimal" }),
      body: "{}"
    })
      .then(() => { try { localStorage.setItem(todayKey, "1"); } catch (e) {} readVisits(); })
      .catch(() => readVisits());
  } else {
    readVisits();
  }
})();
