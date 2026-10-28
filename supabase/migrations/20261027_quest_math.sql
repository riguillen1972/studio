-- Study Buddy Quest: adaptive math for grades 6–8 (skill-based practice, diagnostic, post-check).
-- The skill map lives in code (src/lib/quest/skills.ts); these tables hold the question bank and
-- each student's progress. Only the server reads and writes them (no RLS policies). Safe to re-run.

-- Question bank. AI drafts questions; a teacher approves them before students ever see them.
CREATE TABLE IF NOT EXISTS quest_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id TEXT NOT NULL,
  difficulty SMALLINT NOT NULL CHECK (difficulty BETWEEN 1 AND 3),
  kind TEXT NOT NULL CHECK (kind IN ('multiple_choice', 'numeric')),
  stem TEXT NOT NULL,
  -- [{ "text": "3/4", "correct": true }, { "text": "2/6", "misconception": "add-denominators" }, ...]
  choices JSONB,
  answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'rejected')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_quest_items_skill ON quest_items(skill_id, status, difficulty);

-- What the system believes each student knows, per skill
CREATE TABLE IF NOT EXISTS quest_mastery (
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  skill_id TEXT NOT NULL,
  p_known REAL NOT NULL DEFAULT 0.3,   -- probability the student has mastered the skill
  attempts INT NOT NULL DEFAULT 0,
  correct INT NOT NULL DEFAULT 0,
  streak INT NOT NULL DEFAULT 0,
  review_step INT NOT NULL DEFAULT 0,  -- spaced review: 1, 3, 7, 21 days
  last_practiced TIMESTAMPTZ,
  next_review TIMESTAMPTZ,
  mastered_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (student_id, skill_id)
);

-- Diagnostic (Monday) and post-check (Friday)
CREATE TABLE IF NOT EXISTS quest_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('diagnostic', 'post')),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  state JSONB NOT NULL DEFAULT '{}',   -- adaptive progress while in progress
  results JSONB,                        -- per-skill scores when completed
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_quest_assessments_student ON quest_assessments(student_id, kind, started_at DESC);

-- Every answer
CREATE TABLE IF NOT EXISTS quest_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  item_id UUID REFERENCES quest_items(id) ON DELETE SET NULL,
  skill_id TEXT NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('diagnostic', 'practice', 'review', 'post')),
  assessment_id UUID REFERENCES quest_assessments(id) ON DELETE CASCADE,
  correct BOOLEAN NOT NULL,
  response TEXT,
  misconception TEXT,
  seconds INT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_quest_attempts_student ON quest_attempts(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quest_attempts_class ON quest_attempts(class_id, created_at DESC);

-- Skills the teacher wants the class to focus on (e.g. this week's unit)
CREATE TABLE IF NOT EXISTS quest_class_focus (
  class_id UUID PRIMARY KEY REFERENCES classes(id) ON DELETE CASCADE,
  skill_ids TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE quest_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_class_focus ENABLE ROW LEVEL SECURITY;

-- Teacher opens the Friday post-check for the class
ALTER TABLE quest_class_focus ADD COLUMN IF NOT EXISTS post_check_open BOOLEAN NOT NULL DEFAULT false;

-- Pilot feedback: does the teacher agree with each diagnostic, plus short student and teacher surveys
CREATE TABLE IF NOT EXISTS quest_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('teacher_agreement', 'student_survey', 'teacher_survey')),
  rating SMALLINT,
  answer TEXT,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_quest_feedback_class ON quest_feedback(class_id, kind);
ALTER TABLE quest_feedback ENABLE ROW LEVEL SECURITY;
