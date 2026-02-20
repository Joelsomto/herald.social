# Run Migration - Quick Guide

## ✅ Easiest Method: Supabase Dashboard

Since Supabase CLI is not installed, use the Dashboard method:

### Steps:

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/xxhnzlunpwmnxuhbwclg
   - Or: https://supabase.com/dashboard → Select your project

2. **Open SQL Editor**
   - Click **SQL Editor** in the left sidebar
   - Click **New Query** button

3. **Copy Migration SQL**
   - Open file: `supabase/migrations/20260220000000_create_missing_tables.sql`
   - Copy ALL the contents (Ctrl+A, Ctrl+C)

4. **Paste and Run**
   - Paste into the SQL Editor
   - Click **Run** button (or press Ctrl+Enter)
   - Wait for "Success" message

5. **Verify**
   - Go to **Table Editor** in sidebar
   - Check that these tables exist:
     - ✅ wallets
     - ✅ user_roles
     - ✅ user_settings
     - ✅ user_tasks
     - ✅ post_interactions
     - ✅ ad_campaigns

6. **Test**
   ```bash
   npm run test:run
   ```

---

## Alternative: Install Supabase CLI

If you prefer using CLI:

### Windows (PowerShell):
```powershell
# Install via Scoop (if you have it)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# OR Install via npm
npm install -g supabase

# OR Download from GitHub
# https://github.com/supabase/cli/releases
```

### After Installation:
```bash
# Link project
supabase link --project-ref xxhnzlunpwmnxuhbwclg

# Push migrations
supabase db push
```

---

## What This Migration Does

Creates these tables if they don't exist:
- `wallets` - User wallet and HTTN points
- `user_roles` - User role assignments
- `user_settings` - User preferences  
- `user_tasks` - User tasks/missions
- `post_interactions` - Post likes/shares/comments
- `ad_campaigns` - Advertising campaigns

**Safe to run multiple times** - uses `CREATE TABLE IF NOT EXISTS`
