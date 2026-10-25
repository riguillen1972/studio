-- Study Buddy AI: tables for the AI Teacher (avatar builder, live sessions, monthly session counts).
-- These were in supabase-schema.sql but had never been created in the database.
-- Applied to Supabase on 2026-10-25 (recorded there as ai_teacher_tables). Safe to re-run.

CREATE TABLE IF NOT EXISTS avatar_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  backstory TEXT,
  greeting_phrase TEXT,
  sign_off_phrase TEXT,
  warmth INTEGER CHECK (warmth BETWEEN 1 AND 10),
  energy INTEGER CHECK (energy BETWEEN 1 AND 10),
  strictness INTEGER CHECK (strictness BETWEEN 1 AND 10),
  humor INTEGER CHECK (humor BETWEEN 1 AND 10),
  teaching_method TEXT,
  adaptation_style TEXT,
  pacing TEXT,
  question_strategy TEXT,
  catchphrases TEXT[],
  never_do TEXT,
  special_instructions TEXT,
  voice_id TEXT,
  voice_speed FLOAT DEFAULT 1.0,
  avatar_appearance JSONB,
  data_permissions JSONB,
  phrase_cache_ready BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  avatar_config_id UUID REFERENCES avatar_configs(id) ON DELETE CASCADE,
  context_pack_id UUID REFERENCES context_packs(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  session_history JSONB,
  whisper_log JSONB,
  student_engagement JSONB,
  report JSONB,
  cost_breakdown JSONB,
  status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS monthly_session_counts (
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  billing_period DATE,
  session_count INTEGER DEFAULT 0,
  overage_sessions INTEGER DEFAULT 0,
  PRIMARY KEY (teacher_id, billing_period)
);

CREATE INDEX IF NOT EXISTS idx_avatar_configs_teacher ON avatar_configs(teacher_id);
CREATE INDEX IF NOT EXISTS idx_session_records_teacher ON session_records(teacher_id, started_at DESC);

ALTER TABLE avatar_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_session_counts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can manage their own avatar configs" ON avatar_configs;
CREATE POLICY "Teachers can manage their own avatar configs" ON avatar_configs FOR ALL USING (teacher_id = auth.uid());
DROP POLICY IF EXISTS "Teachers can manage their own session records" ON session_records;
CREATE POLICY "Teachers can manage their own session records" ON session_records FOR ALL USING (teacher_id = auth.uid());
DROP POLICY IF EXISTS "Teachers can view their own session counts" ON monthly_session_counts;
CREATE POLICY "Teachers can view their own session counts" ON monthly_session_counts FOR SELECT USING (teacher_id = auth.uid());
