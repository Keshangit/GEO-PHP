-- Per-domain €9 billing model

alter table public.profiles
  add column if not exists last_free_audit_at timestamptz;

create table if not exists public.unlocked_domains (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  domain text not null,
  audit_id uuid references public.audits (id) on delete set null,
  stripe_session_id text,
  unlocked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, domain)
);

create index if not exists unlocked_domains_user_id_idx
  on public.unlocked_domains (user_id);

alter table public.unlocked_domains enable row level security;

create policy "Users read own unlocked domains"
  on public.unlocked_domains for select
  using (auth.uid() = user_id);

alter table public.audits
  add column if not exists stripe_session_id text,
  add column if not exists paid_at timestamptz,
  add column if not exists pdf_path text;

create trigger unlocked_domains_updated_at
  before update on public.unlocked_domains
  for each row execute function public.set_updated_at();
