-- Weighted search_vector: title = 'A' (priority), rest = 'B'
create or replace function public.posts_search_vector_update()
returns trigger language plpgsql as $$
begin
  new.search_vector :=
    setweight(to_tsvector('french', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('french',
      coalesce(new.content, '') || ' ' ||
      coalesce(array_to_string(new.category_names, ' '), '') || ' ' ||
      coalesce(new.city, '')
    ), 'B');
  return new;
end;
$$;

-- Backfill existing rows
update public.posts set title = title;
