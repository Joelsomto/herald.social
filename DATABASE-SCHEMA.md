# Database Schema Guide

## Important: User Tables and Views

### Auth Users

Supabase Auth stores users in:
- **`auth.users`** - This is in the `auth` schema (not public)
- **`user`** (singular) - May be available as a view in Supabase dashboard exposing `auth.users`
- **Access via**: `supabase.auth.getUser()` or `supabase.auth.getSession()`

**Note**: If `SELECT * FROM user` works in your Supabase SQL editor, it's likely a view that exposes `auth.users`. In your application code, use the `users` table for app user data (display name, username, etc.).

### Public User Data Tables

Use these tables instead:

#### 1. `users` Table (app user/profile data)
**This is your main user data table!**

```sql
-- ✅ CORRECT: Query app users
SELECT * FROM users LIMIT 100;

-- ✅ Get specific user by username
SELECT * FROM users WHERE username = 'john_doe';

-- ✅ Get user with wallet info
SELECT 
  p.*,
  w.httn_points,
  w.httn_tokens
FROM users p
LEFT JOIN wallets w ON p.user_id = w.user_id;
```

**Columns:**
- `user_id` (UUID) - References `auth.users(id)`
- `username` (TEXT) - Unique username
- `display_name` (TEXT) - Display name
- `avatar_url` (TEXT) - Profile picture URL
- `bio` (TEXT) - User bio
- `tier` (TEXT) - User tier (herald, creator, participant, partner)
- `reputation` (INTEGER) - User reputation score
- `is_verified` (BOOLEAN) - Verification status
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### 2. `wallets` Table
User wallet and points data:

```sql
-- ✅ Get user wallet
SELECT * FROM wallets WHERE user_id = 'user-uuid-here';

-- ✅ Get top earners
SELECT 
  w.*,
  p.username,
  p.display_name
FROM wallets w
JOIN users p ON w.user_id = p.user_id
ORDER BY w.httn_points DESC
LIMIT 10;
```

**Columns:**
- `user_id` (UUID) - References `auth.users(id)`
- `httn_points` (INTEGER) - HTTN points balance
- `httn_tokens` (NUMERIC) - HTTN tokens balance
- `espees` (NUMERIC) - Espees balance
- `pending_rewards` (INTEGER) - Pending rewards

#### 3. `user_roles` Table
User role assignments:

```sql
-- ✅ Get user roles
SELECT * FROM user_roles WHERE user_id = 'user-uuid-here';

-- ✅ Get all admins
SELECT 
  ur.*,
  p.username,
  p.display_name
FROM user_roles ur
JOIN users p ON ur.user_id = p.user_id
WHERE ur.role = 'admin';
```

**Columns:**
- `user_id` (UUID) - References `auth.users(id)`
- `role` (app_role) - Role: admin, moderator, creator, participant

#### 4. `user_settings` Table
User preferences:

```sql
-- ✅ Get user settings
SELECT * FROM user_settings WHERE user_id = 'user-uuid-here';
```

#### 5. `user_tasks` Table
User tasks and missions:

```sql
-- ✅ Get user tasks
SELECT * FROM user_tasks WHERE user_id = 'user-uuid-here';

-- ✅ Get incomplete tasks
SELECT * FROM user_tasks 
WHERE user_id = 'user-uuid-here' 
AND completed = false;
```

## Common Queries

### Get User with All Related Data

```sql
SELECT 
  p.*,
  w.httn_points,
  w.httn_tokens,
  w.espees,
  ur.role,
  us.*
FROM users p
LEFT JOIN wallets w ON p.user_id = w.user_id
LEFT JOIN user_roles ur ON p.user_id = ur.user_id
LEFT JOIN user_settings us ON p.user_id = us.user_id
WHERE p.username = 'john_doe';
```

### Get All Users (via users table)

```sql
-- ✅ CORRECT: Use users table in application code
SELECT * FROM users ORDER BY created_at DESC LIMIT 100;

-- ⚠️  NOTE: If `SELECT * FROM user` works in Supabase SQL editor,
--    it's likely a view exposing auth.users; use the users table in your app for display name, username, etc.
SELECT * FROM user LIMIT 100;  -- May work in Supabase dashboard
SELECT * FROM users LIMIT 100; -- This will likely fail (plural)
```

### Get User Posts

```sql
SELECT 
  p.*,
  pr.username,
  pr.display_name,
  pr.avatar_url
FROM posts p
JOIN users pr ON p.author_id = pr.user_id
WHERE pr.username = 'john_doe'
ORDER BY p.created_at DESC;
```

## Auth Users Access

To access auth user data programmatically:

```typescript
// ✅ CORRECT: Use Supabase Auth API
const { data: { user } } = await supabase.auth.getUser();
const { data: { session } } = await supabase.auth.getSession();

// ✅ CORRECT: Query users table
const { data: profile } = await supabase
  .from('users')
  .select('*')
  .eq('user_id', user.id)
  .single();
```

## Summary

| What You Need | Use This Table |
|--------------|----------------|
| User profile data | `users` ✅ |
| User wallet/points | `wallets` |
| User roles | `user_roles` |
| User settings | `user_settings` |
| User tasks | `user_tasks` |
| Auth user info | `supabase.auth.getUser()` |
| **In Supabase SQL Editor** | `user` (singular view, if available) |
| **In Application Code** | `users` (recommended) |
| **DO NOT USE** | `users` (plural - doesn't exist!) |

## Migration Reference

When a user signs up:
1. Supabase creates record in `auth.users` (automatic)
2. Trigger `handle_new_user()` creates:
   - Record in `users`
   - Record in `wallets` (with 100 HTTN welcome bonus)
   - Record in `user_roles` (participant role)
   - Record in `user_settings`
   - 4 records in `user_tasks` (initial tasks)

See: `supabase/migrations/20260109135646_*.sql`
