-- Study Buddy AI: fixes from the October 2026 test report
-- Run this once in Supabase Dashboard > SQL Editor. It is safe to run more than once.

-- ============================================
-- Bug 2: token usage never goes down
-- ============================================
-- increment_token_usage sets updated_at, but the column was never created,
-- so every call failed and no usage was ever recorded.
ALTER TABLE token_usage ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE OR REPLACE FUNCTION increment_token_usage(
  p_user_id UUID,
  p_month TEXT,
  p_column_name TEXT,
  p_tokens INT
) RETURNS void AS $$
BEGIN
  IF p_tokens IS NULL OR p_tokens <= 0 THEN
    RETURN;
  END IF;
  IF p_column_name NOT IN ('flash_lite_used', 'flash_used', 'pro_used', 'haiku_used') THEN
    RAISE EXCEPTION 'Unknown usage column: %', p_column_name;
  END IF;

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
    flash_lite_used = token_usage.flash_lite_used + EXCLUDED.flash_lite_used,
    flash_used = token_usage.flash_used + EXCLUDED.flash_used,
    pro_used = token_usage.pro_used + EXCLUDED.pro_used,
    haiku_used = token_usage.haiku_used + EXCLUDED.haiku_used,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Only the server (service role) may record usage. Before this, any signed-in user
-- could call the function directly with a negative number to reset their usage.
REVOKE EXECUTE ON FUNCTION increment_token_usage(UUID, TEXT, TEXT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_token_usage(UUID, TEXT, TEXT, INT) TO service_role;

-- Users could also write their own usage rows directly. Reading is enough.
DROP POLICY IF EXISTS "token_usage_all" ON token_usage;
DROP POLICY IF EXISTS "token_usage_select" ON token_usage;
CREATE POLICY "token_usage_select" ON token_usage FOR SELECT USING ((select auth.uid()) = user_id);

-- ============================================
-- Bug 1: students can't join a class at sign-up
-- Bug 7: under-13 students need school consent (a teacher's class code)
-- ============================================
-- Sign-up stores the class code in the login metadata. Copy it to profiles and
-- create the enrollment. A K-12 student in grade 7 or below (or with no grade)
-- can only sign up with a valid class code.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role TEXT := new.raw_user_meta_data->>'role';
  v_grade TEXT := new.raw_user_meta_data->>'grade_level';
  v_code TEXT := upper(nullif(trim(new.raw_user_meta_data->>'class_code'), ''));
  v_class_id UUID;
BEGIN
  IF v_code IS NOT NULL AND coalesce(v_role, '') <> 'teacher' THEN
    SELECT id INTO v_class_id FROM public.classes WHERE join_code = v_code;
  END IF;

  IF v_class_id IS NOT NULL THEN
    INSERT INTO public.enrollments (class_id, student_id)
    VALUES (v_class_id, new.id)
    ON CONFLICT (class_id, student_id) DO NOTHING;
  END IF;

  INSERT INTO public.profiles (id, display_name, email, role, grade_level, career_field, class_code)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    v_role,
    v_grade,
    new.raw_user_meta_data->>'career_field',
    CASE WHEN v_class_id IS NOT NULL THEN v_code END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Guards on profiles:
--  * Plan tier and Stripe IDs can only be changed by the server (Stripe webhook / verify),
--    never by the user's own browser session.
--  * A K-12 student in grade 7 or below must be enrolled in a class (school consent).
--    Checked only when role or grade changes, so existing rows keep working.
CREATE OR REPLACE FUNCTION guard_profile_changes()
RETURNS trigger AS $$
DECLARE
  v_grade INT;
BEGIN
  IF coalesce(auth.role(), '') = 'authenticated' THEN
    IF TG_OP = 'INSERT' THEN
      new.tier := 'free';
      new.stripe_customer_id := NULL;
      new.stripe_subscription_id := NULL;
    ELSE
      new.tier := old.tier;
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

-- stripe_* columns are added by the Stripe integration; make sure they exist for the guard.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

DROP TRIGGER IF EXISTS guard_profile_changes ON profiles;
CREATE TRIGGER guard_profile_changes
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION guard_profile_changes();

-- Backfill: students who already signed up with a class code (like the test account
-- that used 14MB2S) get their enrollment and profiles.class_code now.
INSERT INTO enrollments (class_id, student_id)
SELECT c.id, u.id
FROM auth.users u
JOIN profiles p ON p.id = u.id
JOIN classes c ON c.join_code = upper(trim(u.raw_user_meta_data->>'class_code'))
WHERE coalesce(p.role, '') <> 'teacher'
ON CONFLICT (class_id, student_id) DO NOTHING;

UPDATE profiles p
SET class_code = c.join_code
FROM auth.users u
JOIN classes c ON c.join_code = upper(trim(u.raw_user_meta_data->>'class_code'))
WHERE p.id = u.id
  AND p.class_code IS NULL
  AND coalesce(p.role, '') <> 'teacher';

-- ============================================
-- Review: K-12 accounts in grade 7 or below that are not in any class.
-- These were created before the consent check. Run this SELECT to see them.
-- ============================================
-- SELECT p.id, p.email, p.grade_level, p.created_at
-- FROM profiles p
-- WHERE p.role = 'k12'
--   AND (p.grade_level IS NULL OR p.grade_level !~ '^\d+$' OR p.grade_level::INT <= 7)
--   AND NOT EXISTS (SELECT 1 FROM enrollments e WHERE e.student_id = p.id);
