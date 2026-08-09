-- StudyBuddy Supabase Schema
-- Run this in Supabase Dashboard > SQL Editor

-- Profiles (linked to auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  email text,
  grade_level text,
  role text,
  career_field text,
  class_code text,
  tier text default 'free' check (tier in ('free','pro','max')),
  created_at timestamptz default now()
);

-- Token usage tracking
create table if not exists token_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  month text not null,
  flash_lite_used integer default 0,
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
-- Profiles
create policy "profiles_select" on profiles for select using ((select auth.uid()) = id);
create policy "profiles_insert" on profiles for insert with check ((select auth.uid()) = id);
create policy "profiles_update" on profiles for update using ((select auth.uid()) = id);
create policy "profiles_delete" on profiles for delete using ((select auth.uid()) = id);

-- Token Usage
create policy "token_usage_all" on token_usage for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Saved Apps
create policy "saved_apps_all" on saved_apps for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Quiz Results
create policy "quiz_results_all" on quiz_results for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Chat History
create policy "chat_history_select" on chat_history for select using ((select auth.uid()) = user_id);
create policy "chat_history_insert" on chat_history for insert with check ((select auth.uid()) = user_id);
create policy "chat_history_update" on chat_history for update using ((select auth.uid()) = user_id);
create policy "chat_history_delete" on chat_history for delete using ((select auth.uid()) = user_id);

-- Learning Content
create policy "Anyone can read content" on learning_content for select using (true);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)), new.email);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

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

-- ============================================
-- CLASSES & ENROLLMENTS (Phase 3)
-- ============================================
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subject TEXT,
    join_code TEXT UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(class_id, student_id)
);

-- ============================================
-- CONTEXT PACKS (Phase 3)
-- ============================================
CREATE TABLE context_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('lesson', 'homework', 'quiz', 'rubric')),
    title TEXT NOT NULL,
    subject TEXT,
    content_raw TEXT,
    content_parsed TEXT,
    rubric TEXT,
    answer_key TEXT,
    due_date TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- FOCUS SESSIONS (Phase 1)
-- ============================================
CREATE TABLE focus_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sound_id TEXT NOT NULL,
    secondary_sound_id TEXT,
    mix_ratio REAL,
    duration_minutes INT NOT NULL,
    subject TEXT,
    rating INT CHECK (rating BETWEEN 1 AND 3),
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- STUDY TOOLS & XP (Phase 2)
-- ============================================
CREATE TABLE study_tool_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tool_id TEXT NOT NULL,
    class_id UUID REFERENCES classes(id),
    context_pack_id UUID REFERENCES context_packs(id),
    input_summary TEXT,
    output_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE spaced_rep_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id),
    context_pack_id UUID REFERENCES context_packs(id),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    difficulty REAL DEFAULT 2.5,
    interval_days INT DEFAULT 1,
    next_review TIMESTAMPTZ DEFAULT now(),
    review_count INT DEFAULT 0,
    wrong_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE xp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id),
    action TEXT NOT NULL,
    xp_amount INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE study_streaks (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_active_date DATE,
    total_xp INT DEFAULT 0
);

-- ============================================
-- RPC FUNCTIONS
-- ============================================
CREATE OR REPLACE FUNCTION increment_token_usage(
  p_user_id UUID,
  p_month TEXT,
  p_column_name TEXT,
  p_tokens INT
) RETURNS void AS $$
BEGIN
  INSERT INTO token_usage (user_id, month, flash_lite_used, flash_used, pro_used, haiku_used)
  VALUES (
    p_user_id, 
    p_month,
    CASE WHEN p_column_name = 'flash_lite_used' THEN p_tokens ELSE 0 END,
    CASE WHEN p_column_name = 'flash_used' THEN p_tokens ELSE 0 END,
    CASE WHEN p_column_name = 'pro_used' THEN p_tokens ELSE 0 END,
    CASE WHEN p_column_name = 'haiku_used' THEN p_tokens ELSE 0 END
  )
  ON CONFLICT (user_id, month)
  DO UPDATE SET
    flash_lite_used = token_usage.flash_lite_used + CASE WHEN p_column_name = 'flash_lite_used' THEN p_tokens ELSE 0 END,
    flash_used = token_usage.flash_used + CASE WHEN p_column_name = 'flash_used' THEN p_tokens ELSE 0 END,
    pro_used = token_usage.pro_used + CASE WHEN p_column_name = 'pro_used' THEN p_tokens ELSE 0 END,
    haiku_used = token_usage.haiku_used + CASE WHEN p_column_name = 'haiku_used' THEN p_tokens ELSE 0 END,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PHASE 3 RLS POLICIES
-- ============================================
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_tool_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaced_rep_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own classes" ON classes FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Users can view classes they are enrolled in" ON classes FOR SELECT USING (id IN (SELECT class_id FROM enrollments WHERE student_id = auth.uid()));

CREATE POLICY "Users can manage their own enrollments" ON enrollments FOR ALL USING (student_id = auth.uid());
CREATE POLICY "Teachers can manage enrollments for their classes" ON enrollments FOR ALL USING (class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid()));

CREATE POLICY "Teachers can manage context packs for their classes" ON context_packs FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Students can view context packs for their classes" ON context_packs FOR SELECT USING (class_id IN (SELECT class_id FROM enrollments WHERE student_id = auth.uid()));

CREATE POLICY "Users can manage their own focus sessions" ON focus_sessions FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own study tool usage" ON study_tool_usage FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own spaced rep cards" ON spaced_rep_cards FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own xp logs" ON xp_logs FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own study streaks" ON study_streaks FOR ALL USING (user_id = auth.uid());
