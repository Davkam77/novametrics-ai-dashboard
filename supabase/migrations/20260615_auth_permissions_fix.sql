grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select, update on public.workspaces to authenticated;
grant select on public.workspace_members to authenticated;

notify pgrst, 'reload schema';
