grant usage on schema public to authenticated;

grant select, update
on table public.profiles
to authenticated;

grant select, update
on table public.workspaces
to authenticated;

grant select
on table public.workspace_members
to authenticated;

notify pgrst, 'reload schema';
