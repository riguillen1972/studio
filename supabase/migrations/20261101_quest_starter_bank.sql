-- Math Quest starter bank: questions that pass two independent AI checks go live right away
-- (source = 'starter'); teachers can hide any question, and student reports pull a question
-- back into review.

ALTER TABLE quest_items ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'teacher'
  CHECK (source IN ('teacher', 'starter'));
ALTER TABLE quest_items ADD COLUMN IF NOT EXISTS report_count INT NOT NULL DEFAULT 0;

-- One report per student per question
CREATE TABLE IF NOT EXISTS quest_item_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES quest_items(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('wrong_answer', 'confusing', 'typo', 'other')),
  comment TEXT CHECK (char_length(comment) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (item_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_quest_item_reports_item ON quest_item_reports(item_id);

-- Only the server (service role) reads and writes reports
ALTER TABLE quest_item_reports ENABLE ROW LEVEL SECURITY;

-- Weekly class goal: practice questions the whole class aims to answer each week (null = no goal)
ALTER TABLE quest_class_focus ADD COLUMN IF NOT EXISTS weekly_goal INT CHECK (weekly_goal IS NULL OR weekly_goal BETWEEN 10 AND 100000);
