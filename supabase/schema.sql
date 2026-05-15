
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text not null default '',
  role text not null default 'job_seeker' check (role in ('job_seeker', 'job_owner', 'admin')),
  tier text not null default 'beginner' check (tier in ('beginner', 'basic', 'premium', 'advanced')),
  occupation text,
  skills text,
  availability text,
  expected_salary text,
  company_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  role text not null check (role in ('job_seeker', 'job_owner')),
  skills text,
  score int not null default 50,
  status text not null default 'waiting' check (status in ('waiting', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  company_name text not null,
  location text not null,
  job_type text not null,
  duration text,
  salary_type text not null check (salary_type in ('hour', 'day', 'week', 'month')),
  salary_amount int not null,
  requirements text,
  is_premium boolean not null default false,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  seeker_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  status text not null default 'applied' check (status in ('applied', 'shortlisted', 'rejected', 'hired')),
  created_at timestamptz not null default now(),
  unique(job_id, seeker_id)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'job_seeker')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.waitlist enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;

drop policy if exists "Profiles are visible to authenticated users" on public.profiles;
create policy "Profiles are visible to authenticated users"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Anyone can join waitlist" on public.waitlist;
create policy "Anyone can join waitlist"
on public.waitlist for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can read waitlist" on public.waitlist;
create policy "Admins can read waitlist"
on public.waitlist for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update waitlist" on public.waitlist;
create policy "Admins can update waitlist"
on public.waitlist for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Open jobs are public" on public.jobs;
create policy "Open jobs are public"
on public.jobs for select
to anon, authenticated
using (status = 'open' or owner_id = auth.uid() or public.is_admin());

drop policy if exists "Owners can create jobs" on public.jobs;
create policy "Owners can create jobs"
on public.jobs for insert
to authenticated
with check (auth.uid() = owner_id);

drop policy if exists "Owners and admins can update jobs" on public.jobs;
create policy "Owners and admins can update jobs"
on public.jobs for update
to authenticated
using (auth.uid() = owner_id or public.is_admin())
with check (auth.uid() = owner_id or public.is_admin());

drop policy if exists "Users can create own applications" on public.applications;
create policy "Users can create own applications"
on public.applications for insert
to authenticated
with check (auth.uid() = seeker_id);

drop policy if exists "Users can read related applications" on public.applications;
create policy "Users can read related applications"
on public.applications for select
to authenticated
using (
  seeker_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.jobs
    where jobs.id = applications.job_id
    and jobs.owner_id = auth.uid()
  )
);

drop policy if exists "Owners and admins can update applications" on public.applications;
create policy "Owners and admins can update applications"
on public.applications for update
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.jobs
    where jobs.id = applications.job_id
    and jobs.owner_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.jobs
    where jobs.id = applications.job_id
    and jobs.owner_id = auth.uid()
  )
);

insert into public.waitlist (full_name, email, role, skills, score, status)
values
('Arun Kumar', 'arun.demo@example.com', 'job_seeker', 'Design, sales, delivery', 76, 'waiting'),
('Bright Cafe', 'owner.demo@example.com', 'job_owner', 'Needs evening helpers', 68, 'waiting')
on conflict (email) do nothing;
