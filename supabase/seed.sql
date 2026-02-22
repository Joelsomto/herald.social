-- Seed a test user so you can log in and verify onboarding data flows.
--
-- Local:  supabase db reset   (runs migrations then this seed)
-- Hosted: Supabase Dashboard > SQL Editor > paste this file > Run
--
-- Log in: seed@herald.local / SeedPass123
-- Data written: auth.users, auth.identities (login); public.users, public.user_interests (app data).
--
-- Where is the "users" table? It's auth.users (schema "auth", table "users"). In Supabase Dashboard:
-- Table Editor → open the schema dropdown (default "public") → choose "auth" → open table "users".
-- Or in SQL Editor: SELECT * FROM auth.users;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_user_id uuid := 'a0000000-0000-0000-0000-000000000001';
  v_encrypted_pw text;
  v_auth_exists boolean;
BEGIN
  -- Fail fast with a clear message if auth.users is missing (e.g. wrong schema or not a Supabase project)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) INTO v_auth_exists;
  IF NOT v_auth_exists THEN
    RAISE EXCEPTION 'auth.users table not found. This seed requires a Supabase project (auth schema). In Dashboard, check schema "auth", table "users".';
  END IF;

  v_encrypted_pw := crypt('SeedPass123', gen_salt('bf'));

  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'seed@herald.local',
    v_encrypted_pw,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_user_id,
    v_user_id::text,
    format('{"sub": "%s", "email": "seed@herald.local"}', v_user_id)::jsonb,
    'email',
    now(),
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Trigger will have created user row, wallet, etc. Update user with onboarding-style data
  UPDATE public.users
  SET account_type = 'normal',
      display_name = 'Seed User',
      username = 'seeduser'
  WHERE user_id = v_user_id;

  -- Onboarding completion and interests (same shape as app writes)
  INSERT INTO public.user_interests (user_id, interests, onboarding_completed)
  VALUES (v_user_id, ARRAY['faith', 'crypto', 'tech'], true)
  ON CONFLICT (user_id) DO UPDATE SET
    interests = EXCLUDED.interests,
    onboarding_completed = EXCLUDED.onboarding_completed,
    updated_at = now();

  RAISE NOTICE 'Seed user created: seed@herald.local / SeedPass123 (user_id: %)', v_user_id;
END $$;
