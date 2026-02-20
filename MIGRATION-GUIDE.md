# Database Migration Guide

## Running Migrations

The tests revealed that some tables are missing from your database. To fix this, you need to run the migrations.

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/20260220000000_create_missing_tables.sql`
4. Paste and run it in the SQL Editor

### Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Link to your project (if not already linked)
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### Option 3: Manual SQL Execution

1. Connect to your Supabase database
2. Run each migration file in order:
   - `supabase/migrations/20260109135646_cf5e3af1-e1c4-42cc-89d3-270679a5ba66.sql`
   - `supabase/migrations/20260110220306_cf34d387-36f1-41b8-928f-2d94122a16d7.sql`
   - `supabase/migrations/20260112083120_5df35e32-ee44-4f9d-8f04-2d8512cbbcba.sql`
   - `supabase/migrations/20260117093155_7d9acbd1-8d2c-4aab-8bd9-f6de09c4db0a.sql`
   - `supabase/migrations/20260118185934_f4fdb152-ceef-46df-a8f3-4a545bd1d171.sql`
   - `supabase/migrations/20260119110057_5863b065-ee58-4d94-9b0a-3e897da23364.sql`
   - `supabase/migrations/20260220000000_create_missing_tables.sql` (creates missing tables)

## Tables That Need to Be Created

The migration will create these tables if they don't exist:

- ✅ `wallets` - User wallet and points
- ✅ `user_roles` - User role assignments  
- ✅ `user_settings` - User preferences
- ✅ `user_tasks` - User tasks/missions
- ✅ `post_interactions` - Post likes/shares/comments
- ✅ `ad_campaigns` - Advertising campaigns

## After Running Migrations

1. Run tests again: `npm run test:run`
2. Verify tables exist by checking the Supabase dashboard
3. Test the application to ensure everything works

## Troubleshooting

### Error: "relation already exists"
- This means the table already exists - the migration uses `CREATE TABLE IF NOT EXISTS` so it's safe to run

### Error: "permission denied"
- Make sure you're using the correct database credentials
- Check that RLS policies allow your operations

### Error: "foreign key constraint"
- Make sure `auth.users` table exists (it's created automatically by Supabase Auth)
- Ensure parent tables are created before child tables
