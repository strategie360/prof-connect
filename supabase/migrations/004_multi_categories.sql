-- Supprimer search_vector EN PREMIER (il dépend de category_name)
alter table public.posts drop column if exists search_vector;

-- Migrer category_name (text) → category_names (text[])
alter table public.posts add column if not exists category_names text[] default '{}';

-- Migrer les données existantes
update public.posts
  set category_names = array[category_name]
  where category_name is not null and category_name <> '';

-- Supprimer l'ancienne colonne et l'ancienne FK
alter table public.posts drop column if exists category_id;
alter table public.posts drop column if exists category_name;

-- Recréer le search_vector avec le tableau de catégories
alter table public.posts
  add column search_vector tsvector
  generated always as (
    to_tsvector(
      'french'::regconfig,
      coalesce(title, '') || ' ' ||
      coalesce(content, '') || ' ' ||
      coalesce(array_to_string(category_names, ' '), '') || ' ' ||
      coalesce(city, '')
    )
  ) stored;

create index if not exists posts_search_idx on public.posts using gin(search_vector);
create index if not exists posts_categories_idx on public.posts using gin(category_names);

-- Supprimer le trigger de comptage (incompatible avec les tableaux)
drop trigger if exists update_post_category_count on public.posts;
drop function if exists public.update_category_count();
