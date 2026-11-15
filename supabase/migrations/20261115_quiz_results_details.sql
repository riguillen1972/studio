-- Task 8: save more about each Quiz Generator quiz, so Progress and the teacher can see it.
-- Run only after Richard says OK. Safe to re-run.

-- The grade level the student picked for the quiz ("Middle School", ...).
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS grade_level TEXT;

-- Each question with the student's answer and the right answer, as a list:
-- [{ "question": "...", "answer": "...", "correct_answer": "...", "correct": true }, ...]
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS answers JSONB;

-- Teachers see a student's quizzes through the server, which checks they own the class.
-- The existing rule (each student can only read and write their own quiz results) doesn't change.
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_created ON quiz_results(user_id, created_at DESC);
