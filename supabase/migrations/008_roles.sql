-- Ajout du rôle utilisateur
alter table public.profiles
  add column role text not null default 'user'
  check (role in ('admin', 'moderateur', 'user'));
