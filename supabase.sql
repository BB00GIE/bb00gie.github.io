create table public.project_updates (
  id uuid primary key default gen_random_uuid(),
  repo_full_name text not null,
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 10000),
  author_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.allowed_authors (
  user_id uuid primary key references auth.users(id) on delete cascade,
  github_username text not null unique
);

alter table public.project_updates enable row level security;
alter table public.allowed_authors enable row level security;

create policy "Authors can check their own access"
  on public.allowed_authors for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Anyone can read project updates"
  on public.project_updates for select using (true);

create policy "Allowed authors can publish project updates"
  on public.project_updates for insert
  to authenticated
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.allowed_authors
      where user_id = auth.uid()
    )
  );

-- After the allowed GitHub account signs in once, add its Supabase auth UUID:
-- insert into public.allowed_authors (user_id, github_username)
-- values ('AUTH-USER-UUID', 'BB00GIE');