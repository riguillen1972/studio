-- StudyBuddy Supabase Schema
-- Run this in Supabase Dashboard > SQL Editor

-- Profiles (linked to auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  email text,
  grade_level text,
  tier text default 'free' check (tier in ('free','pro','max')),
  created_at timestamptz default now()
);

-- Token usage tracking
create table if not exists token_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  month text not null,
  flash_used integer default 0,
  pro_used integer default 0,
  haiku_used integer default 0,
  unique(user_id, month)
);

-- Saved mini-apps
create table if not exists saved_apps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  conversation jsonb,
  model text,
  allow_llm boolean default false,
  created_at timestamptz default now()
);

-- Quiz results
create table if not exists quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  topic text,
  subject text,
  score integer,
  total integer,
  created_at timestamptz default now()
);

-- Chat history (AI Tutor)
create table if not exists chat_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  title text,
  messages jsonb,
  model text,
  updated_at timestamptz default now()
);

-- Learning content
create table if not exists learning_content (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  image_hint text,
  type text
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table token_usage enable row level security;
alter table saved_apps enable row level security;
alter table quiz_results enable row level security;
alter table chat_history enable row level security;
alter table learning_content enable row level security;

-- RLS Policies
create policy "Users manage own profile" on profiles for all using (auth.uid() = id);
create policy "Users manage own tokens" on token_usage for all using (auth.uid() = user_id);
create policy "Users manage own apps" on saved_apps for all using (auth.uid() = user_id);
create policy "Users manage own quizzes" on quiz_results for all using (auth.uid() = user_id);
create policy "Users manage own chats" on chat_history for all using (auth.uid() = user_id);
create policy "Anyone can read content" on learning_content for select using (true);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, display_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)), new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Seed some learning content
insert into learning_content (title, description, image_url, image_hint, type) values
  ('Introduction to Algebra', 'Learn the basics of algebraic expressions and equations.', 'https://placehold.co/600x400.png', 'math algebra', 'Math'),
  ('The Water Cycle', 'Understand evaporation, condensation, and precipitation.', 'https://placehold.co/600x400.png', 'water cycle', 'Science'),
  ('Parts of Speech', 'Master nouns, verbs, adjectives, and more.', 'https://placehold.co/600x400.png', 'grammar writing', 'Language Arts'),
  ('World War II Overview', 'Key events and turning points of the Second World War.', 'https://placehold.co/600x400.png', 'history war', 'History'),
  ('Photosynthesis', 'How plants convert sunlight into energy.', 'https://placehold.co/600x400.png', 'plant biology', 'Science'),
  ('Fractions and Decimals', 'Converting between fractions and decimals made easy.', 'https://placehold.co/600x400.png', 'math fractions', 'Math');
