-- Study Buddy AI: record which paid plan each user is on, so student Max ($24.99)
-- can't unlock Teacher Max ($39.99) features by switching their role to teacher.
-- Run once in Supabase Dashboard > SQL Editor, after 20261011_bug_fixes.sql. Safe to re-run.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS billing_plan TEXT
  CHECK (billing_plan IN ('pro', 'max', 'max_teacher'));

-- Same guard as before, now also protecting billing_plan: only the server (Stripe webhook,
-- verify, checkout) can change plan fields, never the user's own browser session.
CREATE OR REPLACE FUNCTION guard_profile_changes()
RETURNS trigger AS $$
DECLARE
  v_grade INT;
BEGIN
  IF coalesce(auth.role(), '') = 'authenticated' THEN
    IF TG_OP = 'INSERT' THEN
      new.tier := 'free';
      new.billing_plan := NULL;
      new.stripe_customer_id := NULL;
      new.stripe_subscription_id := NULL;
    ELSE
      new.tier := old.tier;
      new.billing_plan := old.billing_plan;
      new.stripe_customer_id := old.stripe_customer_id;
      new.stripe_subscription_id := old.stripe_subscription_id;
    END IF;
  END IF;

  IF new.role = 'k12' AND (
    TG_OP = 'INSERT'
    OR new.role IS DISTINCT FROM old.role
    OR new.grade_level IS DISTINCT FROM old.grade_level
  ) THEN
    v_grade := CASE WHEN new.grade_level ~ '^\d+$' THEN new.grade_level::INT END;
    IF (v_grade IS NULL OR v_grade <= 7)
       AND NOT EXISTS (SELECT 1 FROM enrollments WHERE student_id = new.id) THEN
      RAISE EXCEPTION 'Students in 7th grade and below must join through a teacher''s class code'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Existing Max subscribers get billing_plan filled in automatically the first time they
-- use an AI Teacher feature or the app re-checks their subscription with Stripe.
