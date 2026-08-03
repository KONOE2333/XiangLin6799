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

  // —— 站长模式口令（用于留言墙删除权限）——
  // 仅前端校验，适合粉丝站这种非高安全场景；请改成只有你知道的口令。
  // 站长模式开启后，每条留言会出现「删除」按钮，删除为软删除（全员不可见）。
  adminCode: "yjn030218",

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

-- 站长删除：新增 deleted 字段（软删除，删除后全员不可见）
alter table wall_messages add column deleted boolean not null default false;
-- 查询策略改为「未删除才可见」，并重建（先删旧策略）
drop policy if exists "public read" on wall_messages;
create policy "public read" on wall_messages for select using (deleted is not true);
-- 删除走 update 权限：必须确保存在下面这条「public update」策略，否则删除/点赞会报 401
drop policy if exists "public update" on wall_messages;
create policy "public update" on wall_messages for update using (true) with check (true);

-- ============ 站长软删除函数（推荐，删除走 RPC，避免旧 RLS 策略干扰） ============
create or replace function public.soft_delete_wall_message(target uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.wall_messages
  set deleted = true
  where id = target;
$$;

revoke all on function public.soft_delete_wall_message(uuid) from public;
grant execute on function public.soft_delete_wall_message(uuid) to anon, authenticated;

-- ============ 首页状态面板：累计访客计数表 ============
create table site_visits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);
alter table site_visits enable row level security;
create policy "public read visits" on site_visits for select using (true);
create policy "public insert visits" on site_visits for insert with check (true);
*/
