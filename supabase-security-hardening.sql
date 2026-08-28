-- ===================== 翔霖小站 · Supabase 安全加固迁移 =====================
-- 1. 先在 Supabase Dashboard → Authentication → Users 创建站长账号。
-- 2. 执行本文件。
-- 3. 将最后一段 insert 中的邮箱改成站长邮箱并执行。

begin;

create table if not exists public.site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.site_admins enable row level security;
revoke all on table public.site_admins from anon, authenticated;

create or replace function public.is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and exists (select 1 from public.site_admins a where a.user_id = auth.uid());
$$;

revoke all on function public.is_site_admin() from public;
grant execute on function public.is_site_admin() to authenticated;

-- 留言墙：匿名仅可读、写新留言和通过 RPC 点赞；删除仅限站长 JWT。
alter table public.wall_messages enable row level security;
drop policy if exists "public read" on public.wall_messages;
drop policy if exists "public insert" on public.wall_messages;
drop policy if exists "public update" on public.wall_messages;
drop policy if exists "public read wall messages" on public.wall_messages;
drop policy if exists "public insert wall messages" on public.wall_messages;

create policy "public read wall messages" on public.wall_messages
for select to anon, authenticated
using (deleted is not true);

create policy "public insert wall messages" on public.wall_messages
for insert to anon, authenticated
with check (
  deleted is not true and likes = 0 and
  kind in ('message', 'suggestion') and
  char_length(trim(name)) between 1 and 16 and
  char_length(trim(text)) between 1 and 300
);

create or replace function public.like_wall_message(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.wall_messages
  set likes = least(likes + 1, 999999)
  where id = target and deleted is not true;
end
$$;

create or replace function public.soft_delete_wall_message(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_site_admin() then raise exception 'forbidden'; end if;
  update public.wall_messages set deleted = true where id = target;
end
$$;

revoke all on function public.like_wall_message(uuid) from public;
revoke all on function public.soft_delete_wall_message(uuid) from public;
grant execute on function public.like_wall_message(uuid) to anon, authenticated;
grant execute on function public.soft_delete_wall_message(uuid) to authenticated;

-- 不再把照片 owner_key 暴露给匿名查询；归属由本机保存的投稿 ID + owner_key RPC 校验。
revoke select on table public.photo_submissions from anon, authenticated;
grant select (id, title, image_url, pos_x, pos_y, rot, status, created_at)
on table public.photo_submissions to anon, authenticated;

-- 移除所有旧的明文口令管理函数签名。
drop function if exists public.list_timeline_submissions_for_review(text);
drop function if exists public.approve_timeline_submission(uuid, text);
drop function if exists public.reject_timeline_submission(uuid, text, text);
drop function if exists public.delete_timeline_submission(uuid, text);
drop function if exists public.list_photo_submissions_for_review(text);
drop function if exists public.approve_photo_submission(uuid, text);
drop function if exists public.reject_photo_submission(uuid, text, text);
drop function if exists public.delete_photo_submission(uuid, text);

create or replace function public.list_timeline_submissions_for_review()
returns table(
  id uuid, submitter_name text, title text, event_date text, year int,
  content text, tag text, image_url text, link_url text, link_text text,
  status text, created_at timestamptz
)
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_site_admin() then raise exception 'forbidden'; end if;
  return query
    select t.id, t.submitter_name, t.title, t.event_date, t.year,
           t.content, t.tag, t.image_url, t.link_url, t.link_text,
           t.status, t.created_at
    from public.timeline_submissions t
    where t.status <> 'approved'
    order by t.created_at desc;
end
$$;

create or replace function public.approve_timeline_submission(p_target_id uuid)
returns void language plpgsql security definer set search_path = public
as $$ begin
  if not public.is_site_admin() then raise exception 'forbidden'; end if;
  update public.timeline_submissions set status = 'approved', reviewed_at = now() where id = p_target_id;
end $$;

create or replace function public.reject_timeline_submission(p_target_id uuid, p_note text default '')
returns void language plpgsql security definer set search_path = public
as $$ begin
  if not public.is_site_admin() then raise exception 'forbidden'; end if;
  update public.timeline_submissions
  set status = 'rejected', reviewer_note = nullif(trim(p_note), ''), reviewed_at = now()
  where id = p_target_id;
end $$;

create or replace function public.delete_timeline_submission(p_target_id uuid)
returns void language plpgsql security definer set search_path = public
as $$ begin
  if not public.is_site_admin() then raise exception 'forbidden'; end if;
  delete from public.timeline_submissions where id = p_target_id;
end $$;

create or replace function public.list_photo_submissions_for_review()
returns table(
  id uuid, submitter_name text, title text, content text, category text,
  image_url text, status text, created_at timestamptz
)
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_site_admin() then raise exception 'forbidden'; end if;
  return query
    select t.id, t.submitter_name, t.title, t.content,
           t.category, t.image_url, t.status, t.created_at
    from public.photo_submissions t
    where t.status <> 'approved'
    order by t.created_at desc;
end
$$;

create or replace function public.approve_photo_submission(p_target_id uuid)
returns void language plpgsql security definer set search_path = public
as $$ begin
  if not public.is_site_admin() then raise exception 'forbidden'; end if;
  update public.photo_submissions set status = 'approved', reviewed_at = now() where id = p_target_id;
end $$;

create or replace function public.reject_photo_submission(p_target_id uuid, p_note text default '')
returns void language plpgsql security definer set search_path = public
as $$ begin
  if not public.is_site_admin() then raise exception 'forbidden'; end if;
  update public.photo_submissions
  set status = 'rejected', reviewer_note = nullif(trim(p_note), ''), reviewed_at = now()
  where id = p_target_id;
end $$;

create or replace function public.delete_photo_submission(p_target_id uuid)
returns void language plpgsql security definer set search_path = public
as $$ begin
  if not public.is_site_admin() then raise exception 'forbidden'; end if;
  delete from public.photo_submissions where id = p_target_id;
end $$;

revoke all on function public.list_timeline_submissions_for_review() from public;
revoke all on function public.approve_timeline_submission(uuid) from public;
revoke all on function public.reject_timeline_submission(uuid, text) from public;
revoke all on function public.delete_timeline_submission(uuid) from public;
revoke all on function public.list_photo_submissions_for_review() from public;
revoke all on function public.approve_photo_submission(uuid) from public;
revoke all on function public.reject_photo_submission(uuid, text) from public;
revoke all on function public.delete_photo_submission(uuid) from public;

grant execute on function public.list_timeline_submissions_for_review() to authenticated;
grant execute on function public.approve_timeline_submission(uuid) to authenticated;
grant execute on function public.reject_timeline_submission(uuid, text) to authenticated;
grant execute on function public.delete_timeline_submission(uuid) to authenticated;
grant execute on function public.list_photo_submissions_for_review() to authenticated;
grant execute on function public.approve_photo_submission(uuid) to authenticated;
grant execute on function public.reject_photo_submission(uuid, text) to authenticated;
grant execute on function public.delete_photo_submission(uuid) to authenticated;

-- 限制匿名上传的目录和文件类型。
drop policy if exists "public insert timeline uploads" on storage.objects;
create policy "public insert timeline uploads" on storage.objects
for insert to anon, authenticated with check (
  bucket_id = 'timeline-uploads' and
  (storage.foldername(name))[1] = 'submissions' and
  lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'gif')
);

drop policy if exists "public insert photo uploads" on storage.objects;
create policy "public insert photo uploads" on storage.objects
for insert to anon, authenticated with check (
  bucket_id = 'photo-uploads' and
  (storage.foldername(name))[1] = 'photo-submissions' and
  lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'gif')
);

commit;

-- 将 your-admin@example.com 替换为站长的 Supabase Auth 邮箱后执行：
-- insert into public.site_admins (user_id)
-- select id from auth.users where email = 'your-admin@example.com'
-- on conflict (user_id) do nothing;
