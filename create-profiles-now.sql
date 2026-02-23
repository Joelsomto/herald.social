-- Create profiles for the 2 orphaned users
-- Using DEFAULT for id column (should generate UUID automatically)

-- User 1: somtochukwujoel403@gmail.com
INSERT INTO public.users (id, user_id, username, display_name)
VALUES (
  gen_random_uuid(),
  'eab40350-ff44-4849-9137-5b5ca16a031f',
  'somtochukwujoel403',
  'somtochukwujoel403'
);

INSERT INTO public.wallets (user_id, httn_points)
VALUES ('eab40350-ff44-4849-9137-5b5ca16a031f', 100);

INSERT INTO public.user_roles (user_id, role)
VALUES ('eab40350-ff44-4849-9137-5b5ca16a031f', 'participant');

-- User 2: ilivieda1@yahoo.com
INSERT INTO public.users (id, user_id, username, display_name)
VALUES (
  gen_random_uuid(),
  '3574ce2f-9beb-4f18-b475-e13859841e02',
  'ilivieda1',
  'ilivieda1'
);

INSERT INTO public.wallets (user_id, httn_points)
VALUES ('3574ce2f-9beb-4f18-b475-e13859841e02', 100);

INSERT INTO public.user_roles (user_id, role)
VALUES ('3574ce2f-9beb-4f18-b475-e13859841e02', 'participant');

-- Verify profiles were created
SELECT 
  au.id,
  au.email,
  u.username,
  u.display_name,
  w.httn_points,
  CASE 
    WHEN u.user_id IS NULL THEN '❌ NO PROFILE'
    ELSE '✅ Has profile'
  END as status
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.user_id
LEFT JOIN public.wallets w ON au.id = w.user_id
ORDER BY au.created_at DESC;
