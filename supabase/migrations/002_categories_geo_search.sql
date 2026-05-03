-- Table des catégories (dynamique)
create table public.categories (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  post_count int default 0,
  created_at timestamptz default now()
);

alter table public.categories enable row level security;

create policy "categories_select" on public.categories
  for select using (auth.role() = 'authenticated');

create policy "categories_insert" on public.categories
  for insert with check (auth.role() = 'authenticated');

-- Colonnes geo + catégorie sur les posts
alter table public.posts
  add column category_id uuid references public.categories(id) on delete set null,
  add column category_name text,
  add column address text,
  add column lat double precision,
  add column lng double precision;

-- Colonne de recherche full-text (générée automatiquement)
alter table public.posts
  add column search_vector tsvector
  generated always as (
    to_tsvector(
      'french',
      coalesce(title, '') || ' ' ||
      coalesce(content, '') || ' ' ||
      coalesce(category_name, '') || ' ' ||
      coalesce(city, '')
    )
  ) stored;

create index posts_search_idx on public.posts using gin(search_vector);
create index posts_category_idx on public.posts(category_name);
create index posts_geo_idx on public.posts(lat, lng) where lat is not null;

-- Trigger compteur de posts par catégorie
create or replace function public.update_category_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' and new.category_id is not null then
    update public.categories set post_count = post_count + 1 where id = new.category_id;
  elsif TG_OP = 'DELETE' and old.category_id is not null then
    update public.categories set post_count = post_count - 1 where id = old.category_id;
  elsif TG_OP = 'UPDATE' then
    if old.category_id is not null and (new.category_id is null or old.category_id != new.category_id) then
      update public.categories set post_count = post_count - 1 where id = old.category_id;
    end if;
    if new.category_id is not null and (old.category_id is null or old.category_id != new.category_id) then
      update public.categories set post_count = post_count + 1 where id = new.category_id;
    end if;
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger update_post_category_count
  after insert or update or delete on public.posts
  for each row execute procedure public.update_category_count();
