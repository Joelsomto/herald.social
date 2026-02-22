-- Convenience view so "SELECT * FROM users" works (auth.users is in schema "auth").
-- Exposes safe columns only (no password). For full auth data use: SELECT * FROM auth.users;
CREATE OR REPLACE VIEW public.users AS
SELECT
  id,
  email,
  created_at,
  updated_at,
  email_confirmed_at,
  last_sign_in_at,
  raw_user_meta_data
FROM auth.users;

-- Allow authenticated users and service role to query the view
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.users TO service_role;

COMMENT ON VIEW public.users IS 'Convenience view over auth.users (safe columns). Use auth.users for full auth data.';
