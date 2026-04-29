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

create index if not exists posts_categories_idx on public.posts using gin(category_names);

-- Supprimer le trigger de comptage (incompatible avec les tableaux)
drop trigger if exists update_post_category_count on public.posts;
drop function if exists public.update_category_count();

-- search_vector via trigger (generated column interdit avec array_to_string)
alter table public.posts add column if not exists search_vector tsvector;

create or replace function public.posts_search_vector_update()
returns trigger language plpgsql as $$
begin
  new.search_vector := to_tsvector(
    'french',
    coalesce(new.title, '') || ' ' ||
    coalesce(new.content, '') || ' ' ||
    coalesce(array_to_string(new.category_names, ' '), '') || ' ' ||
    coalesce(new.city, '')
  );
  return new;
end;
$$;

drop trigger if exists posts_search_vector_trigger on public.posts;
create trigger posts_search_vector_trigger
  before insert or update on public.posts
  for each row execute function public.posts_search_vector_update();

-- Backfill les lignes existantes
update public.posts set title = title;

create index if not exists posts_search_idx on public.posts using gin(search_vector);
