-- Math Quest lessons: one short lesson per skill (explanation, worked examples, a quick check),
-- written by AI and checked by a second model before students see it. Shared by every class;
-- a teacher can hide one or have it rewritten.

CREATE TABLE IF NOT EXISTS quest_lessons (
  skill_id TEXT PRIMARY KEY,
  content JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'hidden')),
  model TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Which lessons each student has opened, for the teacher's reports
CREATE TABLE IF NOT EXISTS quest_lesson_views (
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL,
  views INT NOT NULL DEFAULT 1,
  first_viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, skill_id)
);

-- Only the server (service role) reads and writes these
ALTER TABLE quest_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_lesson_views ENABLE ROW LEVEL SECURITY;
