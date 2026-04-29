-- Recalcul des compteurs depuis le tableau category_names
update public.categories c
set post_count = (
  select count(*) from public.posts p where c.name = any(p.category_names)
);

-- Trigger qui maintient post_count sur insert / update / delete
create or replace function public.update_category_counts()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'DELETE' then
    update public.categories set post_count = greatest(0, post_count - 1)
      where name = any(OLD.category_names);
    return OLD;
  end if;

  if TG_OP = 'UPDATE' then
    update public.categories set post_count = greatest(0, post_count - 1)
      where name = any(OLD.category_names);
    update public.categories set post_count = post_count + 1
      where name = any(NEW.category_names);
    return NEW;
  end if;

  -- INSERT
  update public.categories set post_count = post_count + 1
    where name = any(NEW.category_names);
  return NEW;
end;
$$;

drop trigger if exists posts_category_count_trigger on public.posts;
create trigger posts_category_count_trigger
  after insert or update of category_names or delete on public.posts
  for each row execute function public.update_category_counts();
