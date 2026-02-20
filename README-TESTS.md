# Database and Auth Tests

## Overview

This project includes comprehensive tests for:
1. **Database Connection** - Verifies Supabase connectivity
2. **Auth Operations** - Tests signup, signin, signout
3. **Auth Trigger** - Verifies tables created automatically on signup:
   - `profiles` - User profile information
   - `wallets` - User wallet with 100 HTTN welcome bonus
   - `user_roles` - User role assignment (participant)
   - `user_settings` - User preferences
   - `user_tasks` - Initial daily/weekly tasks

## Auth Flow

When a user signs up via `supabase.auth.signUp()`:

1. **Supabase Auth** creates a user in `auth.users` table (built-in Supabase table)
2. **Database Trigger** `on_auth_user_created` fires automatically
3. **Trigger Function** `handle_new_user()` creates records in:
   - `profiles` - Basic profile with username and display_name
   - `wallets` - Wallet initialized with 100 HTTN points
   - `user_roles` - Assigned 'participant' role
   - `user_settings` - Default settings
   - `user_tasks` - 4 initial tasks:
     - "Like 3 Posts" (daily, 10 points)
     - "Share 1 Post" (daily, 15 points)
     - "Post Content" (daily, 25 points)
     - "Engage 20 Times" (weekly, 100 points)

## Running Tests

```bash
# Install dependencies (if not already installed)
npm install

# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui
```

## Test Files

- `src/__tests__/auth.test.ts` - Auth operations and trigger verification
- `src/__tests__/db-integration.test.tsx` - Database connection and query tests

## Environment Variables

Tests use environment variables from `.env`:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Test Coverage

The tests verify:
- ✅ Database connection
- ✅ Table accessibility
- ✅ Auth signup/signin/signout
- ✅ Profile creation after signup
- ✅ Wallet creation with welcome bonus
- ✅ Role assignment
- ✅ Settings creation
- ✅ Task creation
- ✅ Query operations
- ✅ Error handling
