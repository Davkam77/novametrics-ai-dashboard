create table if not exists public.platform_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint platform_roles_role_check check (role = 'admin')
);

drop trigger if exists set_platform_roles_updated_at on public.platform_roles;
create trigger set_platform_roles_updated_at
before update on public.platform_roles
for each row execute function public.set_updated_at();

alter table public.platform_roles enable row level security;

revoke all on table public.platform_roles from public;
revoke all on table public.platform_roles from anon;
revoke all on table public.platform_roles from authenticated;
grant select on public.platform_roles to authenticated;

drop policy if exists "platform_roles_select_own" on public.platform_roles;
create policy "platform_roles_select_own"
on public.platform_roles
for select
to authenticated
using (user_id = auth.uid());

revoke update on table public.profiles from authenticated;
grant update (display_name) on public.profiles to authenticated;

revoke update on table public.workspaces from authenticated;

notify pgrst, 'reload schema';
