-- Reviews: dd_reviews table and RLS
-- Rerunnable. Scoped to dd_* objects.

create table if not exists dd_reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('version', 'dlc', 'mod')),
  target_id uuid not null,
  stars integer not null check (stars between 1 and 5),
  comment text check (char_length(comment) <= 500),
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now()),
  unique (reviewer_id, target_type, target_id)
);

alter table dd_reviews enable row level security;

drop policy if exists "public read dd_reviews" on dd_reviews;
create policy "public read dd_reviews" on dd_reviews for select using (true);

drop policy if exists "authenticated insert dd_reviews" on dd_reviews;
create policy "authenticated insert dd_reviews" on dd_reviews
  for insert to authenticated with check (auth.uid() = reviewer_id);

drop policy if exists "owner update dd_reviews" on dd_reviews;
create policy "owner update dd_reviews" on dd_reviews
  for update to authenticated using (auth.uid() = reviewer_id);
