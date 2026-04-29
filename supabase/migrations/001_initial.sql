-- Profiles (étend auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  academy text,
  subject text,
  city text,
  bio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Annonces
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  content text not null,
  city text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Messages
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete set null,
  content text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.messages enable row level security;

-- Profiles policies
create policy "profiles_select" on public.profiles
  for select using (auth.role() = 'authenticated');

create policy "profiles_insert" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update" on public.profiles
  for update using (auth.uid() = id);

-- Posts policies
create policy "posts_select" on public.posts
  for select using (auth.role() = 'authenticated');

create policy "posts_insert" on public.posts
  for insert with check (auth.uid() = author_id);

create policy "posts_update" on public.posts
  for update using (auth.uid() = author_id);

create policy "posts_delete" on public.posts
  for delete using (auth.uid() = author_id);

-- Messages policies
create policy "messages_select" on public.messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "messages_insert" on public.messages
  for insert with check (auth.uid() = sender_id);

create policy "messages_update" on public.messages
  for update using (auth.uid() = receiver_id);

-- Créer le profil automatiquement à l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger set_posts_updated_at
  before update on public.posts
  for each row execute procedure public.set_updated_at();
