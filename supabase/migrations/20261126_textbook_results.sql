-- Grades for finished textbook lessons. The server grades the student's answers (it re-checks
-- every answer against the lesson; the browser's own grading is not trusted) and saves the
-- result here, so the lesson leaves the student's to-do list and the teacher sees the grade.
CREATE TABLE IF NOT EXISTS textbook_results (
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL,
  -- Latest attempt
  score INT NOT NULL CHECK (score BETWEEN 0 AND 100),
  points NUMERIC(6,1) NOT NULL,
  total INT NOT NULL CHECK (total > 0),
  -- Per problem: the answers tried and the points earned, for the teacher's review
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  best_score INT NOT NULL CHECK (best_score BETWEEN 0 AND 100),
  attempts INT NOT NULL DEFAULT 1,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, skill_id)
);

CREATE INDEX IF NOT EXISTS textbook_results_skill_idx ON textbook_results (skill_id);

-- Only the server (service role) reads and writes these
ALTER TABLE textbook_results ENABLE ROW LEVEL SECURITY;
