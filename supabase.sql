create table if not exists public.project_updates (
  id uuid primary key default gen_random_uuid(),
  repo_full_name text not null,
  title text not null check (char_length(title) between 1 and 120),
  body text check (body is null or char_length(body) between 1 and 10000),
  image_url text,
  constraint project_updates_has_content check (body is not null or image_url is not null),
  author_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.allowed_authors (
  user_id uuid primary key references auth.users(id) on delete cascade,
  github_username text not null unique
);

create table if not exists public.work_experience (
  id uuid primary key default gen_random_uuid(),
  company text not null check (char_length(company) between 1 and 160),
  role text not null check (char_length(role) between 1 and 160),
  location text,
  start_date date not null,
  end_date date,
  description text,
  highlights text[] not null default '{}',
  lessons_learned text[] not null default '{}',
  technologies text[] not null default '{}',
  source_repo text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_experience_dates_valid check (end_date is null or end_date >= start_date)
);

alter table public.project_updates alter column body drop not null;
alter table public.project_updates add column if not exists image_url text;
alter table public.work_experience add column if not exists lessons_learned text[] not null default '{}';
alter table public.work_experience add column if not exists source_repo text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'project_updates_has_content'
      and conrelid = 'public.project_updates'::regclass
  ) then
    alter table public.project_updates
      add constraint project_updates_has_content check (body is not null or image_url is not null);
  end if;
end $$;

alter table public.project_updates enable row level security;
alter table public.allowed_authors enable row level security;
alter table public.work_experience enable row level security;

drop policy if exists "Authors can check their own access" on public.allowed_authors;
create policy "Authors can check their own access"
  on public.allowed_authors for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Allowed authors can manage work experience" on public.work_experience;
create policy "Allowed authors can manage work experience"
  on public.work_experience for all
  to authenticated
  using (exists (select 1 from public.allowed_authors where user_id = auth.uid() and github_username = 'BB00GIE'))
  with check (exists (select 1 from public.allowed_authors where user_id = auth.uid() and github_username = 'BB00GIE'));

drop policy if exists "Anyone can read work experience" on public.work_experience;
create policy "Anyone can read work experience"
  on public.work_experience for select
  using (true);

drop policy if exists "Anyone can read project updates" on public.project_updates;
create policy "Anyone can read project updates"
  on public.project_updates for select using (true);

drop policy if exists "Allowed authors can publish project updates" on public.project_updates;
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

drop policy if exists "Allowed authors can edit project updates" on public.project_updates;
create policy "Allowed authors can edit project updates"
  on public.project_updates for update
  to authenticated
  using (exists (select 1 from public.allowed_authors where user_id = auth.uid()))
  with check (exists (select 1 from public.allowed_authors where user_id = auth.uid()));

drop policy if exists "Allowed authors can delete project updates" on public.project_updates;
create policy "Allowed authors can delete project updates"
  on public.project_updates for delete
  to authenticated
  using (exists (select 1 from public.allowed_authors where user_id = auth.uid()));

-- After the allowed GitHub account signs in once, add its Supabase auth UUID:
-- insert into public.allowed_authors (user_id, github_username)
-- values ('AUTH-USER-UUID', 'BB00GIE');

insert into storage.buckets (id, name, public)
values ('project-updates', 'project-updates', true)
on conflict (id) do update set public = true;

drop policy if exists "Anyone can view project update images" on storage.objects;
create policy "Anyone can view project update images"
  on storage.objects for select
  using (bucket_id = 'project-updates');

drop policy if exists "Allowed authors can upload project update images" on storage.objects;
create policy "Allowed authors can upload project update images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'project-updates'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.allowed_authors
      where user_id = auth.uid()
    )
  );

drop policy if exists "Allowed authors can delete project update images" on storage.objects;
create policy "Allowed authors can delete project update images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'project-updates' and exists (
    select 1 from public.allowed_authors where user_id = auth.uid()
  ));
