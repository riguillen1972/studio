-- Math Quest check-ins: the teacher reopens the diagnostic (for example in winter and spring) so
-- each student's placement can be compared with their first one. Null = no check-in open.

ALTER TABLE quest_class_focus ADD COLUMN IF NOT EXISTS checkin_opened_at TIMESTAMPTZ;
