
ALTER TABLE public.swipes DROP CONSTRAINT IF EXISTS swipes_target_id_fkey;
ALTER TABLE public.swipes DROP CONSTRAINT IF EXISTS swipes_swiper_id_fkey;
ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_user1_id_fkey;
ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_user2_id_fkey;
