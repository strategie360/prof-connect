-- Index sur les colonnes fréquemment filtrées / triées
create index if not exists posts_created_at_idx  on public.posts(created_at desc);
create index if not exists posts_author_idx       on public.posts(author_id);
create index if not exists posts_post_type_idx    on public.posts(post_type);
create index if not exists messages_thread_idx    on public.messages(sender_id, receiver_id, created_at desc);

-- PostGIS pour le filtre de distance côté serveur
create extension if not exists postgis;

alter table public.posts
  add column if not exists location geography(Point, 4326);

-- Peupler depuis lat/lng existants
update public.posts
  set location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
  where lat is not null and lng is not null;

-- Index spatial
create index if not exists posts_location_idx
  on public.posts using gist(location);

-- Trigger : maintient location en sync avec lat/lng
create or replace function public.posts_location_sync()
returns trigger language plpgsql as $$
begin
  if new.lat is not null and new.lng is not null then
    new.location := ST_SetSRID(ST_MakePoint(new.lng, new.lat), 4326)::geography;
  else
    new.location := null;
  end if;
  return new;
end;
$$;

drop trigger if exists posts_location_trigger on public.posts;
create trigger posts_location_trigger
  before insert or update of lat, lng on public.posts
  for each row execute function public.posts_location_sync();

-- Fonction RPC : renvoie les IDs triés par distance (appelée depuis le feed)
create or replace function public.posts_within_radius(
  p_lat     float8,
  p_lng     float8,
  p_radius_km float8,
  p_limit   int default 200
)
returns table (id uuid, distance_km float8)
language sql stable security definer as $$
  select
    p.id,
    round(
      (ST_Distance(
        p.location,
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
      ) / 1000)::numeric, 1
    )::float8 as distance_km
  from public.posts p
  where
    p.location is not null
    and ST_DWithin(
      p.location,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      p_radius_km * 1000
    )
  order by distance_km asc
  limit p_limit;
$$;
