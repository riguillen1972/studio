-- Study Buddy AI: teacher visibility (students' AI chats and apps) and assignment submissions with auto-grading.
-- Run once in Supabase Dashboard > SQL Editor. Safe to re-run.

-- AI requests made by students while they're in a teacher's class (question + answer).
-- Written and read only by the server; students and teachers see them through the app's APIs.
CREATE TABLE IF NOT EXISTS ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tool TEXT NOT NULL,
  prompt TEXT,
  response TEXT,
  model TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_user_created ON ai_interactions(user_id, created_at DESC);
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;
-- No policies: only the service role (server) can read or write.

-- Students' answers to homework/quizzes, with AI or teacher grades
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context_pack_id UUID REFERENCES context_packs(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  answers TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded')),
  score INT CHECK (score BETWEEN 0 AND 100),
  ai_feedback JSONB,
  teacher_feedback TEXT,
  graded_by TEXT CHECK (graded_by IN ('ai', 'teacher')),
  submitted_at TIMESTAMPTZ DEFAULT now(),
  graded_at TIMESTAMPTZ,
  UNIQUE (context_pack_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_submissions_class ON assignment_submissions(class_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON assignment_submissions(student_id);
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
-- No policies: only the server reads and writes (it checks enrollment and class ownership).
