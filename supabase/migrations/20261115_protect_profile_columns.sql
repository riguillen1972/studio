-- Task 3: students can't make themselves teachers, and nobody can change their own plan or class.
-- Run only after Richard says OK. Safe to re-run (it replaces the existing guard function).
--
-- The profiles table already has a trigger, guard_profile_changes, that runs before every insert
-- or update. Until now it quietly put back the old tier, billing plan and Stripe IDs when a
-- signed-in user tried to change them. This version:
--   1. Refuses (with an error) a signed-in user changing their own tier, billing_plan,
--      stripe_customer_id, stripe_subscription_id or class_code.
--   2. Refuses a signed-in user whose role is 'k12' changing their own role.
--   3. Keeps the existing rule that students in grade 7 and below must be in a class.
-- "Signed-in user" means a request from the website with a user's login (auth.role() =
-- 'authenticated'). The server's service role key and Supabase's own sign-up trigger are not
-- signed-in users, so the server can still change these columns (for example after a payment,
-- or when a student joins a class with a code).

CREATE OR REPLACE FUNCTION public.guard_profile_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_grade INT;
BEGIN
  IF coalesce(auth.role(), '') = 'authenticated' THEN
    IF TG_OP = 'INSERT' THEN
      -- A new row made from the browser starts on the free plan and in no class
      new.tier := 'free';
      new.billing_plan := NULL;
      new.stripe_customer_id := NULL;
      new.stripe_subscription_id := NULL;
      new.class_code := NULL;
    ELSE
      IF new.tier IS DISTINCT FROM old.tier
         OR new.billing_plan IS DISTINCT FROM old.billing_plan
         OR new.stripe_customer_id IS DISTINCT FROM old.stripe_customer_id
         OR new.stripe_subscription_id IS DISTINCT FROM old.stripe_subscription_id THEN
        RAISE EXCEPTION 'Your plan can only be changed through checkout'
          USING ERRCODE = 'insufficient_privilege';
      END IF;
      IF new.class_code IS DISTINCT FROM old.class_code THEN
        RAISE EXCEPTION 'Join or leave a class with a class code on your Profile page'
          USING ERRCODE = 'insufficient_privilege';
      END IF;
      IF old.role = 'k12' AND new.role IS DISTINCT FROM old.role THEN
        RAISE EXCEPTION 'Ask your teacher if your role needs to change'
          USING ERRCODE = 'insufficient_privilege';
      END IF;
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
$function$;
