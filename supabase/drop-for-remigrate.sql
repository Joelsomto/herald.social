-- Run this in Supabase Dashboard > SQL Editor if db push failed with "type app_role already exists".
-- Then run: npm run db:migrate

DROP TYPE IF EXISTS public.app_role CASCADE;
