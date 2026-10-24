create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null,
  token text not null unique,
  used boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

alter table public.invitations enable row level security;

-- The service-role API creates invitations and bypasses RLS. There is no
-- browser insert policy: clients must use the authenticated invitation API.
