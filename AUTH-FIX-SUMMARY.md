# Auth Issue Fix Summary

## Problem Identified

Your authentication was showing "Signed in successfully" but users didn't exist in the database because:

1. **Conflicting Migration**: Migration `20260220100000_public_users_view.sql` created a VIEW called `public.users` that pointed to `auth.users` instead of your actual users table
2. **This caused**:
   - 422 errors on signup (trigger couldn't insert into a VIEW)
   - 400 errors when querying user data (VIEW didn't have columns like `display_name`, `username`, etc.)
   - Users authenticated but profiles not created

## Changes Made

### 1. Deleted Conflicting Migration ✅
- Removed `supabase/migrations/20260220100000_public_users_view.sql`
- This migration was creating a VIEW that shadowed your actual users TABLE

### 2. Improved Error Handling in [useAuth.tsx](src/hooks/useAuth.tsx) ✅
- Added profile verification after sign-in to check if user exists in `public.users`
- Shows specific error messages when profile creation fails
- Added 422 error handling with helpful message
- Added 1-second delay after signup to allow trigger to complete
- Console logs errors for debugging

### 3. Created Fix Migration ✅
- Created `supabase/migrations/20260223000000_fix_users_table_view_conflict.sql`
- This migration:
  - Drops any VIEW called `public.users` that might still exist
  - Ensures the TABLE `public.users` exists
  - Re-attaches the `handle_new_user` trigger
  - Verifies database state is correct

## Next Steps - IMPORTANT

### Step 1: Apply the Fix Migration
You need to apply the new migration to your Supabase database:

```powershell
# If using Supabase CLI locally:
supabase db reset

# OR push just the new migration:
supabase db push
```

### Step 2: Verify Database State
Run these queries in your Supabase SQL Editor to verify:

```sql
-- Should return 'table', NOT 'view'
SELECT table_type FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'users';

-- Should show columns: user_id, username, display_name, avatar_url, etc.
SELECT column_name FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- Check trigger exists
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

### Step 3: Clean Up Orphaned Auth Users
If users were created in `auth.users` but not in `public.users`, you can:

**Option A: Delete orphaned auth users** (if they're test accounts):
```sql
-- CAREFUL: This deletes auth users
DELETE FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM public.users);
```

**Option B: Manually create profiles** (if you want to keep them):
```sql
-- Run the trigger function manually for existing auth users
INSERT INTO public.users (user_id, username, display_name)
SELECT 
  id, 
  email,
  SPLIT_PART(email, '@', 1)
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.users);

-- Create wallets for them
INSERT INTO public.wallets (user_id, httn_points)
SELECT id, 100 FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.wallets);

-- Assign roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'participant'::app_role FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles);
```

### Step 4: Test Sign Up
Try signing up with a new email and verify:
1. No 422 error
2. No 400 errors when fetching user data
3. Profile appears in database
4. Success message shows correct username

## Why This Happened

The migration strategy changed from:
1. Old: VIEW `public.users` → `auth.users`
2. New: TABLE `public.users` (renamed from `profiles`)

But migration `20260220100000` created the VIEW, which should have been dropped by `20260220100001`. The VIEW creation migration should never have existed in the first place.

## Monitoring

The improved auth code now:
- ✅ Logs detailed errors to console
- ✅ Checks if profile exists after sign-in
- ✅ Shows specific error messages for database issues
- ✅ Verifies profile creation after signup

If you see errors, check the browser console for detailed information.
