
-- Allow users to delete their own swipes (for "recheck skipped" feature)
CREATE POLICY "Users can delete their own swipes"
ON public.swipes
FOR DELETE
TO authenticated
USING (auth.uid() = swiper_id);

-- Auto-create reciprocal swipe + match when liking a demo profile
CREATE OR REPLACE FUNCTION public.auto_match_demo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_demo BOOLEAN;
  u1 UUID;
  u2 UUID;
BEGIN
  IF NEW.liked = false THEN
    RETURN NEW;
  END IF;

  -- Check if target is a demo profile (no corresponding auth user)
  SELECT NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = NEW.target_id
  ) INTO is_demo;

  IF NOT is_demo THEN
    RETURN NEW;
  END IF;

  -- Insert reciprocal swipe from demo profile (bypass RLS via SECURITY DEFINER)
  INSERT INTO public.swipes (swiper_id, target_id, liked)
  VALUES (NEW.target_id, NEW.swiper_id, true)
  ON CONFLICT DO NOTHING;

  -- Create the match directly
  IF NEW.swiper_id < NEW.target_id THEN
    u1 := NEW.swiper_id;
    u2 := NEW.target_id;
  ELSE
    u1 := NEW.target_id;
    u2 := NEW.swiper_id;
  END IF;

  INSERT INTO public.matches (user1_id, user2_id)
  VALUES (u1, u2)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Drop existing triggers if any, then attach both
DROP TRIGGER IF EXISTS swipes_match_trigger ON public.swipes;
DROP TRIGGER IF EXISTS swipes_auto_demo_trigger ON public.swipes;

CREATE TRIGGER swipes_match_trigger
AFTER INSERT ON public.swipes
FOR EACH ROW
EXECUTE FUNCTION public.handle_swipe_match();

CREATE TRIGGER swipes_auto_demo_trigger
AFTER INSERT ON public.swipes
FOR EACH ROW
EXECUTE FUNCTION public.auto_match_demo();

-- Add unique constraint on swipes to prevent dupes
CREATE UNIQUE INDEX IF NOT EXISTS swipes_unique_pair ON public.swipes(swiper_id, target_id);
