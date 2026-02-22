# Supabase setup

## Your database is empty – apply migrations and seed

Use **hosted Supabase** (Dashboard). Steps:

### 1. Install dependencies (includes Supabase CLI)

```bash
npm install
```

### 2. Log in to Supabase CLI (one-time)

```bash
npm run db:login
```

A browser window will open; sign in with your Supabase account.

### 3. Link this repo to your Supabase project

```bash
npm run db:link
```

Use your **project ref** (Dashboard → Project Settings → General). When asked for the database password, use the one from **Settings → Database**.

### 4. Apply migrations (create all tables)

```bash
npm run db:migrate
```

This runs all migrations in `supabase/migrations/` against your hosted DB.

### 5. Seed a test user (optional)

- Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**.
- Open `supabase/seed.sql` in this repo, copy its full contents, paste into the editor, and click **Run**.

You can then log in with **seed@herald.local** / **SeedPass123**.

---

**Note:** `npm run db:reset` is for **local** Supabase (Docker). For a hosted empty DB, use steps 2–4 above.
