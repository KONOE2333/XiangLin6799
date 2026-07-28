// ===================== 留言墙 · 云端后端配置 =====================
// 想让全站粉丝共享留言，在这里填好任一云后端，留言就会存到云端（所有人可见）。
// 留空则自动退回「本地模式」：留言只存在访问者自己的浏览器里（适合本地演示）。
//
// 二选一：把 provider 改成 "supabase" 或 "leancloud"，并填对应的密钥。
//
// —— Supabase（推荐，免费额度大、最省心）——
//   1. 打开 https://supabase.com 新建项目
//   2. SQL Editor 执行建表语句（见本文件底部注释）
//   3. Project Settings → API 复制 Project URL 和 anon public key 填下面
//
// —— LeanCloud（国内访问快）——
//   1. 打开 https://www.leancloud.cn 创建应用
//   2. 在「存储 → 数据」新建 Class：WallMessage（字段 name 字符串 / text 字符串 / likes 数字）
//   3. 设置该 Class 的权限：允许所有人「创建 / 查找 / 更新」（用于公开读写与点赞）
//   4. 应用 → 设置 → 应用凭证，复制 App ID、App Key、REST API 地址填下面
window.WALL_CONFIG = {
  provider: "supabase", // "supabase" 或 "leancloud"

  supabase: {
    url: "https://czmokdtlxwayqyjtsnwp.supabase.co",           // 项目根地址（不带 /rest/v1/）
    anonKey: "sb_publishable_T0lk0lKqgImYz2BoexeeAQ_gTJeeCP1"  // publishable key（新版 anon key，可公开）
  },

  leancloud: {
    appId: "",
    appKey: "",
    server: ""    // 例如 https://yyyy.lncldglobal.com （国际版）或 https://yyyy.lc-cn-n1-shared.com （国内版）
  }
};

/*
===== Supabase 建表 SQL（在 Supabase 的 SQL Editor 里执行）=====
create table wall_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  text text not null,
  likes int not null default 0,
  created_at timestamptz not null default now()
);
-- 开放匿名读写（点赞需要 update 权限）
alter table wall_messages enable row level security;
create policy "public read"   on wall_messages for select using (true);
create policy "public insert" on wall_messages for insert with check (true);
create policy "public update" on wall_messages for update using (true);

-- 云端第一条留言（站长 KONOE，2026/07/28）
insert into wall_messages (name, text, likes, created_at) values (
  'KONOE',
  '2026年才开始喜欢上你们，体会到了太多幸福与痛苦的经历，谢谢你们让我更加懂得感情的复杂，未来也请一起走吧',
  0,
  '2026-07-28 00:00:00+08'
);
*/
