// ===================== 云端后端公开配置 =====================
// publishable/anon key 按 Supabase 设计可出现在浏览器端；真正的管理权限由
// Supabase Auth JWT + public.site_admins 服务端校验，前端不再保存管理口令。
window.WALL_CONFIG = {
  provider: "supabase",

  supabase: {
    url: "https://czmokdtlxwayqyjtsnwp.supabase.co",
    anonKey: "sb_publishable_T0lk0lKqgImYz2BoexeeAQ_gTJeeCP1"
  },

  leancloud: {
    appId: "",
    appKey: "",
    server: ""
  }
};
