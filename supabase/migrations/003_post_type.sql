alter table public.posts
  add column post_type text not null default 'demande'
  check (post_type in ('demande', 'offre'));
