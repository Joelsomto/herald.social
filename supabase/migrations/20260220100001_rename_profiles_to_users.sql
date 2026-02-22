-- Rename public.profiles to public.users (app user/profile data; auth stays in auth.users).
-- Drop the convenience view if it exists so the table can take the name "users".
DROP VIEW IF EXISTS public.users;

ALTER TABLE public.profiles RENAME TO users;

-- Trigger and function that run on the table now reference public.users by the new name.
-- Update handle_new_user to insert into public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (user_id, username, display_name)
  VALUES (NEW.id, NEW.email, SPLIT_PART(NEW.email, '@', 1));

  INSERT INTO public.wallets (user_id, httn_points)
  VALUES (NEW.id, 100);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'participant');

  INSERT INTO public.user_tasks (user_id, task_type, title, description, reward, target)
  VALUES
    (NEW.id, 'daily', 'Like 3 Posts', 'Engage with the community by liking posts', 10, 3),
    (NEW.id, 'daily', 'Share 1 Post', 'Amplify great content', 15, 1),
    (NEW.id, 'daily', 'Post Content', 'Create and share your own content', 25, 1),
    (NEW.id, 'weekly', 'Engage 20 Times', 'Be active in the community', 100, 20);

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_settings') THEN
    INSERT INTO public.user_settings (user_id) VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

-- Update notification helpers to read from public.users
CREATE OR REPLACE FUNCTION public.create_comment_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  post_author_id uuid;
  commenter_name text;
  commenter_username text;
  commenter_avatar text;
  commenter_verified boolean;
BEGIN
  SELECT author_id INTO post_author_id FROM public.posts WHERE id = NEW.post_id;
  IF post_author_id = NEW.author_id THEN
    RETURN NEW;
  END IF;

  SELECT display_name, username, avatar_url, is_verified
  INTO commenter_name, commenter_username, commenter_avatar, commenter_verified
  FROM public.users
  WHERE user_id = NEW.author_id;

  INSERT INTO public.notifications (user_id, type, title, message, actor_id, actor_name, actor_avatar, actor_verified, reference_id, reference_type)
  VALUES (post_author_id, 'comment', 'New Comment', COALESCE(commenter_name, 'Someone') || ' commented on your post', NEW.author_id, commenter_name, commenter_avatar, commenter_verified, NEW.post_id, 'post');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_follow_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  follower_name text;
  follower_username text;
  follower_avatar text;
  follower_verified boolean;
BEGIN
  SELECT display_name, username, avatar_url, is_verified
  INTO follower_name, follower_username, follower_avatar, follower_verified
  FROM public.users
  WHERE user_id = NEW.follower_id;

  INSERT INTO public.notifications (user_id, type, title, message, actor_id, actor_name, actor_avatar, actor_verified, reference_id, reference_type)
  VALUES (NEW.following_id, 'follow', 'New Follower', COALESCE(follower_name, 'Someone') || ' followed you', NEW.follower_id, follower_name, follower_avatar, follower_verified, NEW.follower_id, 'user');
  RETURN NEW;
END;
$function$;

-- Rename timestamp trigger for consistency
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Verification trigger (from 20260110220306) is on the table; table is now public.users so trigger stays valid.
-- Policy names can stay; they remain attached to public.users after rename.
