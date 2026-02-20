# Migration Commands

## Quick Reference

### Using Supabase CLI (Recommended)

```bash
# 1. Link to your project (first time only)
supabase link --project-ref xxhnzlunpwmnxuhbwclg

# 2. Push all migrations to remote database
supabase db push

# 3. Check migration status
supabase migration list
```

### Using npm scripts (if Supabase CLI is installed)

```bash
# Push migrations
npm run db:migrate

# Check migration status  
npm run db:status

# Reset database (⚠️ deletes all data!)
npm run db:reset
```

### Using Supabase Dashboard (No CLI needed)

1. Go to: https://supabase.com/dashboard/project/xxhnzlunpwmnxuhbwclg
2. Click **SQL Editor** in the sidebar
3. Click **New Query**
4. Copy and paste the contents of: `supabase/migrations/20260220000000_create_missing_tables.sql`
5. Click **Run** (or press Ctrl+Enter)

## Migration File Location

The migration file to create missing tables is located at:
```
supabase/migrations/20260220000000_create_missing_tables.sql
```

## What Gets Created

This migration creates these tables if they don't exist:
- `wallets` - User wallet and points
- `user_roles` - User role assignments
- `user_settings` - User preferences
- `user_tasks` - User tasks/missions
- `post_interactions` - Post interactions
- `ad_campaigns` - Advertising campaigns

## Verify Migration Success

After running migrations:

1. Check tables exist:
   ```bash
   # In Supabase Dashboard → Table Editor
   # Or run:
   npm run test:run
   ```

2. All tests should pass:
   ```bash
   npm run test:run
   ```

## Troubleshooting

### "command not found: supabase"
Install Supabase CLI:
```bash
npm install -g supabase
# or
brew install supabase/tap/supabase
```

### "Project not linked"
Link your project:
```bash
supabase link --project-ref xxhnzlunpwmnxuhbwclg
```

### "Migration already applied"
That's OK! The migration uses `CREATE TABLE IF NOT EXISTS` so it's safe to run multiple times.
