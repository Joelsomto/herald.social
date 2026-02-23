-- Check and fix foreign key constraints on users table
-- ============================================================================

-- STEP 1: Check all constraints on users table
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass;

-- STEP 2: Drop the problematic self-referential constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- STEP 3: Verify the constraint is gone
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass;

SELECT '✅ Constraint dropped - now retry creating profiles' as result;
