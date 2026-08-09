-- ===================== 记忆时间轴投稿 · 轻量账号 · 审核 =====================
-- 在 Supabase SQL Editor 中整段执行一次即可。

create extension if not exists pgcrypto;

create table if not exists site_users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  display_name text not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists user_sessions (
  token text primary key,
  user_id uuid not null references site_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
);

create table if not exists timeline_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references site_users(id) on delete set null,
  submitter_name text not null,
  title text not null,
  event_date text not null,
  year int not null,
  content text not null,
  tag text,
  image_url text,
  link_url text,
  link_text text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewer_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table site_users enable row level security;
alter table user_sessions enable row level security;
alter table timeline_submissions enable row level security;

drop policy if exists "public read approved timeline" on timeline_submissions;
create policy "public read approved timeline" on timeline_submissions
for select using (status = 'approved');

-- 轻量账号：注册 / 登录 / 会话
create or replace function public.register_user(p_username text, p_display_name text, p_password text)
returns table(token text, username text, display_name text)
language plpgsql security definer set search_path = public
as $$
declare v_id uuid;
        v_token text;
        v_username text;
        v_display text;
begin
  if length(trim(p_username)) < 2 or length(trim(p_username)) > 20 then
    raise exception '用户名需为 2-20 个字符';
  end if;
  if length(trim(p_display_name)) < 1 or length(trim(p_display_name)) > 20 then
    raise exception '昵称需为 1-20 个字符';
  end if;
  if length(p_password) < 6 then
    raise exception '密码至少 6 位';
  end if;

  v_username := lower(trim(p_username));
  v_display := trim(p_display_name);

  begin
    insert into public.site_users(username, display_name, password_hash)
    values (v_username, v_display, extensions.crypt(p_password, extensions.gen_salt('bf')))
    returning id into v_id;
  exception
    when unique_violation then
      raise exception '用户名已被使用';
  end;

  insert into public.user_sessions(token, user_id)
  values (encode(extensions.gen_random_bytes(32), 'hex'), v_id)
  returning token into v_token;

  return query select v_token, v_username, v_display;
end
$$;

create or replace function public.login_user(p_username text, p_password text)
returns table(token text, username text, display_name text)
language plpgsql security definer set search_path = public
as $$
declare v_id uuid;
        v_token text;
        v_username text;
        v_display text;
        v_hash text;
begin
  select id, username, display_name, password_hash
    into v_id, v_username, v_display, v_hash
  from public.site_users
  where username = lower(trim(p_username));

  if v_id is null or v_hash is null or v_hash <> extensions.crypt(p_password, v_hash) then
    raise exception '用户名或密码错误';
  end if;

  insert into public.user_sessions(token, user_id)
  values (encode(extensions.gen_random_bytes(32), 'hex'), v_id)
  returning token into v_token;

  return query select v_token, v_username, v_display;
end
$$;

create or replace function public.get_session_user(p_token text)
returns table(username text, display_name text)
language plpgsql security definer set search_path = public
as $$
declare v_username text;
        v_display text;
begin
  select u.username, u.display_name
    into v_username, v_display
  from public.user_sessions s
  join public.site_users u on u.id = s.user_id
  where s.token = p_token and s.expires_at > now();

  if not found then
    raise exception '登录已失效，请重新登录';
  end if;

  return query select v_username, v_display;
end
$$;

-- 投稿：必须登录，自动记录投稿人
create or replace function public.submit_timeline_entry(
  p_token text,
  p_title text,
  p_event_date text,
  p_year int,
  p_content text,
  p_tag text default null,
  p_image_url text default null,
  p_link_url text default null,
  p_link_text text default null
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare v_user_id uuid;
        v_display text;
        v_id uuid;
begin
  select s.user_id into v_user_id
  from public.user_sessions s
  where s.token = p_token and s.expires_at > now();

  if not found then
    raise exception '请先登录';
  end if;

  select display_name into v_display
  from public.site_users where id = v_user_id;

  if length(trim(p_title)) < 1 or length(trim(p_title)) > 80 then
    raise exception '标题需为 1-80 个字符';
  end if;
  if length(trim(p_event_date)) < 1 or length(trim(p_event_date)) > 30 then
    raise exception '请填写时间';
  end if;
  if p_year < 2000 or p_year > 2035 then
    raise exception '年份需要填写合理范围';
  end if;
  if length(trim(p_content)) < 1 or length(trim(p_content)) > 1000 then
    raise exception '内容需为 1-1000 个字符';
  end if;

  insert into public.timeline_submissions(
    user_id, submitter_name, title, event_date, year, content,
    tag, image_url, link_url, link_text
  )
  values (
    v_user_id,
    v_display,
    trim(p_title),
    trim(p_event_date),
    p_year,
    trim(p_content),
    nullif(trim(coalesce(p_tag, '')), ''),
    nullif(trim(coalesce(p_image_url, '')), ''),
    nullif(trim(coalesce(p_link_url, '')), ''),
    nullif(trim(coalesce(p_link_text, '')), '')
  )
  returning id into v_id;

  return v_id;
end
$$;

-- 站长审核：口令校验后读取待审 / 已拒绝投稿
create or replace function public.list_timeline_submissions_for_review(p_admin_code text)
returns table(
  id uuid,
  submitter_name text,
  title text,
  event_date text,
  year int,
  content text,
  tag text,
  image_url text,
  link_url text,
  link_text text,
  status text,
  created_at timestamptz
)
language plpgsql security definer set search_path = public
as $$
begin
  if p_admin_code <> 'yjn030218' then
    raise exception '口令错误';
  end if;

  return query
    select t.id, t.submitter_name, t.title, t.event_date, t.year,
           t.content, t.tag, t.image_url, t.link_url, t.link_text,
           t.status, t.created_at
    from public.timeline_submissions t
    where t.status <> 'approved'
    order by t.created_at desc;
end
$$;

create or replace function public.approve_timeline_submission(p_target_id uuid, p_admin_code text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if p_admin_code <> 'yjn030218' then
    raise exception '口令错误';
  end if;

  update public.timeline_submissions
  set status = 'approved', reviewed_at = now()
  where id = p_target_id;
end
$$;

create or replace function public.reject_timeline_submission(
  p_target_id uuid,
  p_admin_code text,
  p_note text default ''
) returns void
language plpgsql security definer set search_path = public
as $$
begin
  if p_admin_code <> 'yjn030218' then
    raise exception '口令错误';
  end if;

  update public.timeline_submissions
  set status = 'rejected', reviewer_note = nullif(trim(p_note), ''), reviewed_at = now()
  where id = p_target_id;
end
$$;

revoke all on function public.register_user(text, text, text) from public;
revoke all on function public.login_user(text, text) from public;
revoke all on function public.get_session_user(text) from public;
revoke all on function public.submit_timeline_entry(text, text, text, int, text, text, text, text, text) from public;
revoke all on function public.list_timeline_submissions_for_review(text) from public;
revoke all on function public.approve_timeline_submission(uuid, text) from public;
revoke all on function public.reject_timeline_submission(uuid, text, text) from public;

grant execute on function public.register_user(text, text, text) to anon, authenticated;
grant execute on function public.login_user(text, text) to anon, authenticated;
grant execute on function public.get_session_user(text) to anon, authenticated;
grant execute on function public.submit_timeline_entry(text, text, text, int, text, text, text, text, text) to anon, authenticated;
grant execute on function public.list_timeline_submissions_for_review(text) to anon, authenticated;
grant execute on function public.approve_timeline_submission(uuid, text) to anon, authenticated;
grant execute on function public.reject_timeline_submission(uuid, text, text) to anon, authenticated;

-- 图片上传：公开读取 + 匿名写入 submissions/ 目录
insert into storage.buckets (id, name, public)
values ('timeline-uploads', 'timeline-uploads', true)
on conflict (id) do update set public = true;

drop policy if exists "public read timeline uploads" on storage.objects;
create policy "public read timeline uploads" on storage.objects
for select using (bucket_id = 'timeline-uploads');

drop policy if exists "public insert timeline uploads" on storage.objects;
create policy "public insert timeline uploads" on storage.objects
for insert with check (
  bucket_id = 'timeline-uploads' and
  (storage.foldername(name))[1] = 'submissions'
);
