// ===================== 留言墙 · 云端后端适配层 =====================
// 统一接口：load() / add(msg) / like(id, likes)
// 返回/接收的消息统一为 { id, name, text, time, likes }
// 由 js/wall-config.js 决定使用哪个云后端。配置为空则 isConfigured()=false，前端回退本地。
(function () {
  const cfg = window.WALL_CONFIG || {};

  function isConfigured() {
    if (!cfg.provider) return false;
    if (cfg.provider === "leancloud") {
      const l = cfg.leancloud || {};
      return !!(l.appId && l.appKey && l.server);
    }
    if (cfg.provider === "supabase") {
      const s = cfg.supabase || {};
      return !!(s.url && s.anonKey);
    }
    return false;
  }

  function fmtTime(s) {
    const d = new Date(s);
    if (isNaN(d.getTime())) return String(s);
    const p = (n) => String(n).padStart(2, "0");
    return d.getFullYear() + "/" + p(d.getMonth() + 1) + "/" + p(d.getDate()) +
           " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  // -------- Supabase（REST） --------
  const supabase = {
    headers() {
      const k = cfg.supabase.anonKey;
      return { "apikey": k, "Authorization": "Bearer " + k };
    },
    async load() {
      const r = await fetch(cfg.supabase.url + "/rest/v1/wall_messages?select=*&order=created_at.desc", {
        headers: this.headers()
      });
      if (!r.ok) throw new Error("load " + r.status);
      const rows = await r.json();
      return rows.map((x) => ({
        id: x.id, name: x.name, text: x.text,
        time: fmtTime(x.created_at), likes: x.likes || 0
      }));
    },
    async add(m) {
      const r = await fetch(cfg.supabase.url + "/rest/v1/wall_messages", {
        method: "POST",
        headers: Object.assign(this.headers(), {
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        }),
        body: JSON.stringify({ name: m.name, text: m.text, likes: 0 })
      });
      if (!r.ok) throw new Error("add " + r.status);
      const rows = await r.json();
      const x = rows[0];
      return { id: x.id, name: x.name, text: x.text, time: fmtTime(x.created_at), likes: x.likes || 0 };
    },
    async like(id, likes) {
      const r = await fetch(cfg.supabase.url + "/rest/v1/wall_messages?id=eq." + encodeURIComponent(id), {
        method: "PATCH",
        headers: Object.assign(this.headers(), {
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        }),
        body: JSON.stringify({ likes })
      });
      if (!r.ok) throw new Error("like " + r.status);
    },
    async remove(id) {
      const r = await fetch(cfg.supabase.url + "/rest/v1/wall_messages?id=eq." + encodeURIComponent(id), {
        method: "PATCH",
        headers: Object.assign(this.headers(), {
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        }),
        body: JSON.stringify({ deleted: true })
      });
      if (!r.ok) throw new Error("remove " + r.status);
    }
  };

  // -------- LeanCloud（REST） --------
  const leancloud = {
    base() { return cfg.leancloud.server.replace(/\/+$/, ""); },
    headers() {
      return {
        "X-LC-Id": cfg.leancloud.appId,
        "X-LC-Key": cfg.leancloud.appKey,
        "Content-Type": "application/json"
      };
    },
    async load() {
      const r = await fetch(this.base() + "/1.1/classes/WallMessage?order=-createdAt", { headers: this.headers() });
      if (!r.ok) throw new Error("load " + r.status);
      const d = await r.json();
      return (d.results || []).map((x) => ({
        id: x.objectId, name: x.name, text: x.text,
        time: fmtTime(x.createdAt), likes: x.likes || 0
      }));
    },
    async add(m) {
      const r = await fetch(this.base() + "/1.1/classes/WallMessage", {
        method: "POST", headers: this.headers(),
        body: JSON.stringify({ name: m.name, text: m.text, likes: 0 })
      });
      if (!r.ok) throw new Error("add " + r.status);
      const x = await r.json();
      return { id: x.objectId, name: m.name, text: m.text, time: fmtTime(x.createdAt), likes: 0 };
    },
    async like(id, likes) {
      const r = await fetch(this.base() + "/1.1/classes/WallMessage/" + id, {
        method: "PUT", headers: this.headers(),
        body: JSON.stringify({ likes })
      });
      if (!r.ok) throw new Error("like " + r.status);
    },
    async remove(id) {
      const r = await fetch(this.base() + "/1.1/classes/WallMessage/" + id, {
        method: "PUT", headers: this.headers(),
        body: JSON.stringify({ deleted: true })
      });
      if (!r.ok) throw new Error("remove " + r.status);
    }
  };

  function active() {
    return cfg.provider === "leancloud" ? leancloud : supabase;
  }

  window.WallBackend = {
    isConfigured,
    async load() { return active().load(); },
    async add(m) { return active().add(m); },
    async like(id, likes) { return active().like(id, likes); },
    async remove(id) { return active().remove(id); }
  };
})();
