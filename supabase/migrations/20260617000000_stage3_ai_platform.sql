create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by_user_id uuid references auth.users(id) on delete set null,
  name text not null,
  key_prefix text not null,
  key_last_four char(4) not null,
  key_digest text not null unique,
  hash_version smallint not null default 1,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  last_used_at timestamptz,
  revoked_at timestamptz,
  revoked_by_user_id uuid references auth.users(id) on delete set null,
  constraint api_keys_name_trimmed_check check (btrim(name) = name and char_length(name) between 1 and 80),
  constraint api_keys_key_prefix_check check (key_prefix like 'nvm_live_%'),
  constraint api_keys_key_last_four_check check (char_length(key_last_four) = 4),
  constraint api_keys_digest_check check (key_digest ~ '^[0-9a-f]{64}$'),
  constraint api_keys_hash_version_check check (hash_version > 0),
  constraint api_keys_status_check check (status in ('active', 'revoked')),
  constraint api_keys_status_revoked_at_check check (
    (status = 'active' and revoked_at is null)
    or (status = 'revoked' and revoked_at is not null)
  )
);

create index if not exists api_keys_workspace_status_created_at_idx
  on public.api_keys (workspace_id, status, created_at desc);

create index if not exists api_keys_workspace_last_used_at_idx
  on public.api_keys (workspace_id, last_used_at desc);

alter table public.api_keys enable row level security;

revoke all on table public.api_keys from public;
revoke all on table public.api_keys from anon;
revoke all on table public.api_keys from authenticated;
grant select, insert, update, delete on public.api_keys to service_role;

create table if not exists public.api_requests (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  api_key_id uuid references public.api_keys(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  provider text not null default 'groq',
  model text not null,
  status text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  total_tokens integer not null default 0,
  latency_ms integer,
  provider_request_id text,
  error_code text,
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  processing_expires_at timestamptz not null,
  constraint api_requests_provider_check check (provider = 'groq'),
  constraint api_requests_status_check check (
    status in (
      'processing',
      'success',
      'rate_limited',
      'quota_exceeded',
      'invalid_request',
      'invalid_key',
      'revoked_key',
      'provider_error',
      'timeout',
      'internal_error'
    )
  ),
  constraint api_requests_tokens_check check (
    input_tokens >= 0 and output_tokens >= 0 and total_tokens >= 0
  ),
  constraint api_requests_total_tokens_check check (total_tokens = input_tokens + output_tokens),
  constraint api_requests_latency_check check (latency_ms is null or latency_ms >= 0),
  constraint api_requests_error_code_check check (error_code is null or char_length(error_code) <= 80),
  constraint api_requests_error_message_check check (error_message is null or char_length(error_message) <= 500),
  constraint api_requests_provider_request_id_check check (
    provider_request_id is null or char_length(provider_request_id) <= 120
  ),
  constraint api_requests_processing_state_check check (
    (status = 'processing' and completed_at is null)
    or (status <> 'processing' and completed_at is not null)
  )
);

create index if not exists api_requests_workspace_created_at_idx
  on public.api_requests (workspace_id, created_at desc);

create index if not exists api_requests_api_key_created_at_idx
  on public.api_requests (api_key_id, created_at desc);

create index if not exists api_requests_status_created_at_idx
  on public.api_requests (status, created_at desc);

create index if not exists api_requests_workspace_status_processing_expires_idx
  on public.api_requests (workspace_id, status, processing_expires_at);

alter table public.api_requests enable row level security;

revoke all on table public.api_requests from public;
revoke all on table public.api_requests from anon;
revoke all on table public.api_requests from authenticated;
grant select, insert, update, delete on public.api_requests to service_role;

create table if not exists public.usage_limits (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  plan text not null default 'free',
  requests_per_minute integer not null,
  requests_per_day integer not null,
  concurrent_requests integer not null,
  monthly_token_limit bigint not null,
  enabled_models text[] not null,
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  updated_at timestamptz not null default timezone('utc', now()),
  constraint usage_limits_requests_per_minute_check check (requests_per_minute > 0),
  constraint usage_limits_requests_per_day_check check (requests_per_day > 0),
  constraint usage_limits_concurrent_requests_check check (concurrent_requests > 0),
  constraint usage_limits_monthly_token_limit_check check (monthly_token_limit > 0),
  constraint usage_limits_enabled_models_check check (cardinality(enabled_models) > 0),
  constraint usage_limits_period_check check (current_period_end > current_period_start)
);

create index if not exists usage_limits_plan_idx
  on public.usage_limits (plan);

alter table public.usage_limits enable row level security;

revoke all on table public.usage_limits from public;
revoke all on table public.usage_limits from anon;
revoke all on table public.usage_limits from authenticated;
grant select, insert, update, delete on public.usage_limits to service_role;

drop trigger if exists set_usage_limits_updated_at on public.usage_limits;
create trigger set_usage_limits_updated_at
before update on public.usage_limits
for each row execute function public.set_updated_at();

create or replace function public.handle_new_workspace_usage_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usage_limits (
    workspace_id,
    plan,
    requests_per_minute,
    requests_per_day,
    concurrent_requests,
    monthly_token_limit,
    enabled_models,
    current_period_start,
    current_period_end,
    updated_at
  )
  values (
    new.id,
    coalesce(nullif(btrim(new.plan), ''), 'free'),
    30,
    200,
    2,
    1000000,
    array['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'],
    date_trunc('month', timezone('utc', now())),
    date_trunc('month', timezone('utc', now())) + interval '1 month',
    timezone('utc', now())
  )
  on conflict (workspace_id) do update
    set plan = excluded.plan,
        requests_per_minute = excluded.requests_per_minute,
        requests_per_day = excluded.requests_per_day,
        concurrent_requests = excluded.concurrent_requests,
        monthly_token_limit = excluded.monthly_token_limit,
        enabled_models = excluded.enabled_models,
        current_period_start = excluded.current_period_start,
        current_period_end = excluded.current_period_end,
        updated_at = excluded.updated_at;

  return new;
end;
$$;

drop trigger if exists on_workspace_created_usage_limits on public.workspaces;
create trigger on_workspace_created_usage_limits
after insert on public.workspaces
for each row execute function public.handle_new_workspace_usage_limits();

insert into public.usage_limits (
  workspace_id,
  plan,
  requests_per_minute,
  requests_per_day,
  concurrent_requests,
  monthly_token_limit,
  enabled_models,
  current_period_start,
  current_period_end,
  updated_at
)
select
  w.id,
  coalesce(nullif(btrim(w.plan), ''), 'free'),
  30,
  200,
  2,
  1000000,
  array['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'],
  date_trunc('month', timezone('utc', now())),
  date_trunc('month', timezone('utc', now())) + interval '1 month',
  timezone('utc', now())
from public.workspaces w
where w.status = 'active'
on conflict (workspace_id) do update
  set plan = excluded.plan,
      requests_per_minute = excluded.requests_per_minute,
      requests_per_day = excluded.requests_per_day,
      concurrent_requests = excluded.concurrent_requests,
      monthly_token_limit = excluded.monthly_token_limit,
      enabled_models = excluded.enabled_models,
      current_period_start = excluded.current_period_start,
      current_period_end = excluded.current_period_end,
      updated_at = excluded.updated_at;

create or replace function public.novametrics_admit_request(
  p_api_key_digest text,
  p_model text,
  p_estimated_total_tokens integer,
  p_processing_expires_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := timezone('utc', now());
  v_key record;
  v_workspace_id uuid;
  v_api_key_id uuid;
  v_user_id uuid;
  v_status text;
  v_http_status integer;
  v_error_code text;
  v_error_message text;
  v_request_id uuid;
  v_api_request_id uuid;
  v_requests_per_minute integer;
  v_requests_per_day integer;
  v_concurrent_requests integer;
  v_monthly_token_limit bigint;
  v_enabled_models text[];
  v_current_period_start timestamptz;
  v_current_period_end timestamptz;
  v_requests_this_minute integer;
  v_requests_today integer;
  v_active_processing integer;
  v_tokens_this_month bigint;
begin
  select
    k.id,
    k.workspace_id,
    k.created_by_user_id,
    k.status as key_status,
    w.status as workspace_status,
    ul.requests_per_minute,
    ul.requests_per_day,
    ul.concurrent_requests,
    ul.monthly_token_limit,
    ul.enabled_models,
    ul.current_period_start,
    ul.current_period_end
  into v_key
  from public.api_keys k
  join public.workspaces w on w.id = k.workspace_id
  join public.usage_limits ul on ul.workspace_id = k.workspace_id
  where k.key_digest = p_api_key_digest
  limit 1;

  if not found then
    return jsonb_build_object(
      'accepted', false,
      'request_id', null,
      'api_request_id', null,
      'workspace_id', null,
      'api_key_id', null,
      'user_id', null,
      'status', 'invalid_key',
      'http_status', 401,
      'error_code', 'invalid_key',
      'message', 'Invalid NovaMetrics API key.'
    );
  end if;

  v_workspace_id := v_key.workspace_id;
  v_api_key_id := v_key.id;
  v_user_id := v_key.created_by_user_id;
  v_requests_per_minute := v_key.requests_per_minute;
  v_requests_per_day := v_key.requests_per_day;
  v_concurrent_requests := v_key.concurrent_requests;
  v_monthly_token_limit := v_key.monthly_token_limit;
  v_enabled_models := v_key.enabled_models;
  v_current_period_start := v_key.current_period_start;
  v_current_period_end := v_key.current_period_end;

  if v_key.key_status <> 'active' then
    insert into public.api_requests (
      workspace_id,
      api_key_id,
      user_id,
      provider,
      model,
      status,
      input_tokens,
      output_tokens,
      total_tokens,
      latency_ms,
      provider_request_id,
      error_code,
      error_message,
      created_at,
      completed_at,
      processing_expires_at
    )
    values (
      v_workspace_id,
      v_api_key_id,
      v_user_id,
      'groq',
      coalesce(nullif(btrim(p_model), ''), 'unknown'),
      'revoked_key',
      0,
      0,
      0,
      null,
      null,
      'key_revoked',
      'This API key is no longer active.',
      v_now,
      v_now,
      p_processing_expires_at
    )
    returning request_id, id into v_request_id, v_api_request_id;

    return jsonb_build_object(
      'accepted', false,
      'request_id', v_request_id,
      'api_request_id', v_api_request_id,
      'workspace_id', v_workspace_id,
      'api_key_id', v_api_key_id,
      'user_id', v_user_id,
      'status', 'revoked_key',
      'http_status', 403,
      'error_code', 'revoked_key',
      'message', 'This API key is no longer active.'
    );
  end if;

  if v_key.workspace_status <> 'active' then
    insert into public.api_requests (
      workspace_id,
      api_key_id,
      user_id,
      provider,
      model,
      status,
      input_tokens,
      output_tokens,
      total_tokens,
      latency_ms,
      provider_request_id,
      error_code,
      error_message,
      created_at,
      completed_at,
      processing_expires_at
    )
    values (
      v_workspace_id,
      v_api_key_id,
      v_user_id,
      'groq',
      coalesce(nullif(btrim(p_model), ''), 'unknown'),
      'revoked_key',
      0,
      0,
      0,
      null,
      null,
      'workspace_disabled',
      'The workspace is currently disabled.',
      v_now,
      v_now,
      p_processing_expires_at
    )
    returning request_id, id into v_request_id, v_api_request_id;

    return jsonb_build_object(
      'accepted', false,
      'request_id', v_request_id,
      'api_request_id', v_api_request_id,
      'workspace_id', v_workspace_id,
      'api_key_id', v_api_key_id,
      'user_id', v_user_id,
      'status', 'revoked_key',
      'http_status', 403,
      'error_code', 'workspace_disabled',
      'message', 'The workspace is currently disabled.'
    );
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_workspace_id::text, 0));

  if p_model is null or btrim(p_model) = '' then
    v_status := 'invalid_request';
    v_http_status := 404;
    v_error_code := 'unsupported_model';
    v_error_message := 'Requested model is not enabled for this workspace.';
  elsif not (p_model = any (v_enabled_models)) then
    v_status := 'invalid_request';
    v_http_status := 404;
    v_error_code := 'unsupported_model';
    v_error_message := 'Requested model is not enabled for this workspace.';
  else
    select count(*)
    into v_requests_this_minute
    from public.api_requests
    where workspace_id = v_workspace_id
      and created_at >= v_now - interval '1 minute';

    select count(*)
    into v_requests_today
    from public.api_requests
    where workspace_id = v_workspace_id
      and created_at >= date_trunc('day', v_now);

    select count(*)
    into v_active_processing
    from public.api_requests
    where workspace_id = v_workspace_id
      and status = 'processing'
      and processing_expires_at > v_now;

    select coalesce(sum(total_tokens), 0)
    into v_tokens_this_month
    from public.api_requests
    where workspace_id = v_workspace_id
      and status = 'success'
      and created_at >= v_current_period_start
      and created_at < v_current_period_end;

    if v_requests_this_minute >= v_requests_per_minute then
      v_status := 'rate_limited';
      v_http_status := 429;
      v_error_code := 'rate_limit_rpm';
      v_error_message := 'Request rate limit exceeded.';
    elsif v_requests_today >= v_requests_per_day then
      v_status := 'quota_exceeded';
      v_http_status := 429;
      v_error_code := 'daily_request_limit';
      v_error_message := 'Daily request limit exceeded.';
    elsif v_active_processing >= v_concurrent_requests then
      v_status := 'rate_limited';
      v_http_status := 429;
      v_error_code := 'concurrency_limit';
      v_error_message := 'Too many requests are already processing.';
    elsif v_tokens_this_month + greatest(p_estimated_total_tokens, 0) > v_monthly_token_limit then
      v_status := 'quota_exceeded';
      v_http_status := 429;
      v_error_code := 'monthly_token_limit';
      v_error_message := 'Monthly token limit exceeded.';
    end if;
  end if;

  if v_status is not null then
    insert into public.api_requests (
      workspace_id,
      api_key_id,
      user_id,
      provider,
      model,
      status,
      input_tokens,
      output_tokens,
      total_tokens,
      latency_ms,
      provider_request_id,
      error_code,
      error_message,
      created_at,
      completed_at,
      processing_expires_at
    )
    values (
      v_workspace_id,
      v_api_key_id,
      v_user_id,
      'groq',
      coalesce(nullif(btrim(p_model), ''), v_enabled_models[1]),
      v_status,
      0,
      0,
      0,
      null,
      null,
      v_error_code,
      v_error_message,
      v_now,
      v_now,
      p_processing_expires_at
    )
    returning request_id, id into v_request_id, v_api_request_id;

    return jsonb_build_object(
      'accepted', false,
      'request_id', v_request_id,
      'api_request_id', v_api_request_id,
      'workspace_id', v_workspace_id,
      'api_key_id', v_api_key_id,
      'user_id', v_user_id,
      'status', v_status,
      'http_status', v_http_status,
      'error_code', v_error_code,
      'message', v_error_message
    );
  end if;

  insert into public.api_requests (
    workspace_id,
    api_key_id,
    user_id,
    provider,
    model,
    status,
    input_tokens,
    output_tokens,
    total_tokens,
    latency_ms,
    provider_request_id,
    error_code,
    error_message,
    created_at,
    completed_at,
    processing_expires_at
  )
  values (
    v_workspace_id,
    v_api_key_id,
    v_user_id,
    'groq',
    p_model,
    'processing',
    0,
    0,
    0,
    null,
    null,
    null,
    null,
    v_now,
    null,
    p_processing_expires_at
  )
  returning request_id, id into v_request_id, v_api_request_id;

  return jsonb_build_object(
    'accepted', true,
    'request_id', v_request_id,
    'api_request_id', v_api_request_id,
    'workspace_id', v_workspace_id,
    'api_key_id', v_api_key_id,
    'user_id', v_user_id,
    'status', 'processing',
    'processing_expires_at', p_processing_expires_at
  );
end;
$$;

create or replace function public.novametrics_complete_request(
  p_request_id uuid,
  p_status text,
  p_input_tokens integer,
  p_output_tokens integer,
  p_total_tokens integer,
  p_latency_ms integer,
  p_provider_request_id text,
  p_error_code text,
  p_error_message text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := timezone('utc', now());
  v_updated record;
begin
  update public.api_requests
  set
    status = p_status,
    input_tokens = greatest(coalesce(p_input_tokens, 0), 0),
    output_tokens = greatest(coalesce(p_output_tokens, 0), 0),
    total_tokens = greatest(coalesce(p_total_tokens, 0), 0),
    latency_ms = case when p_latency_ms is null then null else greatest(p_latency_ms, 0) end,
    provider_request_id = nullif(btrim(coalesce(p_provider_request_id, '')), ''),
    error_code = nullif(left(btrim(coalesce(p_error_code, '')), 80), ''),
    error_message = nullif(left(btrim(coalesce(p_error_message, '')), 500), ''),
    completed_at = v_now
  where request_id = p_request_id
    and status = 'processing'
  returning id, api_key_id, workspace_id, request_id, status
  into v_updated;

  if found and v_updated.api_key_id is not null then
    update public.api_keys
    set last_used_at = v_now
    where id = v_updated.api_key_id;
  end if;

  return jsonb_build_object(
    'updated', found,
    'request_id', coalesce(v_updated.request_id, p_request_id),
    'status', coalesce(v_updated.status, p_status)
  );
end;
$$;

revoke all on function public.handle_new_workspace_usage_limits() from public;
revoke all on function public.novametrics_admit_request(text, text, integer, timestamptz) from public;
revoke all on function public.novametrics_complete_request(uuid, text, integer, integer, integer, integer, text, text, text) from public;

grant execute on function public.handle_new_workspace_usage_limits() to service_role;
grant execute on function public.novametrics_admit_request(text, text, integer, timestamptz) to service_role;
grant execute on function public.novametrics_complete_request(uuid, text, integer, integer, integer, integer, text, text, text) to service_role;

notify pgrst, 'reload schema';
