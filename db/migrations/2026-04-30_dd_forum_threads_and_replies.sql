begin;

alter table if exists public.dd_threads
  add column if not exists updated_at timestamp with time zone not null default timezone('utc', now()),
  add column if not exists status text not null default 'published';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'dd_threads_status_check'
      and conrelid = 'public.dd_threads'::regclass
  ) then
    alter table public.dd_threads
      add constraint dd_threads_status_check check (status in ('published', 'hidden', 'locked'));
  end if;
end $$;

create table if not exists public.dd_thread_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.dd_threads(id) on delete cascade,
  content jsonb not null default jsonb_build_object('zh', '', 'en', ''),
  author_id uuid references auth.users(id) on delete set null,
  author_name text not null default '',
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now()),
  status text not null default 'published',
  constraint dd_thread_replies_status_check check (status in ('published', 'hidden'))
);

create index if not exists dd_threads_created_at_idx on public.dd_threads (created_at desc);
create index if not exists dd_threads_linked_version_idx on public.dd_threads (linked_version_id);
create index if not exists dd_threads_linked_mod_idx on public.dd_threads (linked_mod_id);
create index if not exists dd_thread_replies_thread_created_idx on public.dd_thread_replies (thread_id, created_at asc);

alter table public.dd_thread_replies enable row level security;

create policy "public read dd_thread_replies"
  on public.dd_thread_replies
  for select
  using (status = 'published');

create policy "authenticated insert dd_thread_replies"
  on public.dd_thread_replies
  for insert
  to authenticated
  with check (auth.uid() = author_id and status = 'published');

alter policy "public read dd_threads"
  on public.dd_threads
  using (status = 'published');

alter policy "authenticated write dd_threads"
  on public.dd_threads
  with check (auth.uid() = author_id and status = 'published');

commit;
