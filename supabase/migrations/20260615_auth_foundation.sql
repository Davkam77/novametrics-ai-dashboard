create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null,
  plan text not null default 'free',
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, user_id)
);

create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists workspaces_owner_id_idx on public.workspaces (owner_id);
create index if not exists workspace_members_user_id_idx on public.workspace_members (user_id);
create index if not exists workspace_members_workspace_id_idx on public.workspace_members (workspace_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_workspaces_updated_at on public.workspaces;
create trigger set_workspaces_updated_at
before update on public.workspaces
for each row execute function public.set_updated_at();

create or replace function public.is_workspace_member(check_workspace_id uuid, check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = check_workspace_id
      and user_id = check_user_id
      and status = 'active'
  );
$$;

create or replace function public.is_workspace_owner(check_workspace_id uuid, check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspaces
    where id = check_workspace_id
      and owner_id = check_user_id
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_display_name text;
  v_workspace_name text;
  v_workspace_id uuid;
begin
  v_display_name := nullif(
    trim(
      coalesce(
        new.raw_user_meta_data ->> 'display_name',
        new.raw_user_meta_data ->> 'full_name',
        new.raw_user_meta_data ->> 'name',
        split_part(coalesce(new.email, ''), '@', 1)
      )
    ),
    ''
  );

  if v_display_name is null then
    v_display_name := 'Workspace User';
  end if;

  v_workspace_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'workspace_name'), ''),
    format('%s Workspace', v_display_name)
  );

  insert into public.profiles (id, email, display_name, avatar_url, created_at, updated_at)
  values (
    new.id,
    new.email,
    v_display_name,
    new.raw_user_meta_data ->> 'avatar_url',
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = excluded.display_name,
        avatar_url = excluded.avatar_url,
        updated_at = excluded.updated_at;

  insert into public.workspaces (owner_id, name, plan, status, created_at, updated_at)
  values (
    new.id,
    v_workspace_name,
    'free',
    'active',
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (owner_id) do update
    set name = excluded.name,
        updated_at = excluded.updated_at
  returning id into v_workspace_id;

  if v_workspace_id is null then
    select id into v_workspace_id
    from public.workspaces
    where owner_id = new.id
    limit 1;
  end if;

  insert into public.workspace_members (workspace_id, user_id, role, status, created_at)
  values (
    v_workspace_id,
    new.id,
    'owner',
    'active',
    timezone('utc', now())
  )
  on conflict (workspace_id, user_id) do update
    set role = excluded.role,
        status = excluded.status;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select, update on public.workspaces to authenticated;
grant select on public.workspace_members to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "workspaces_select_member" on public.workspaces;
create policy "workspaces_select_member"
on public.workspaces
for select
to authenticated
using (public.is_workspace_member(id));

drop policy if exists "workspaces_update_owner" on public.workspaces;
create policy "workspaces_update_owner"
on public.workspaces
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "workspace_members_select_self_or_owner" on public.workspace_members;
create policy "workspace_members_select_self_or_owner"
on public.workspace_members
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_workspace_owner(workspace_id)
);
