-- Fix function search_path
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Restrict public listing on avatars bucket: keep public read by direct URL via storage
-- but remove the broad SELECT policy and replace with one that requires knowing the path.
-- Public buckets serve files via /object/public/<path> regardless of policies, so we can
-- safely drop the SELECT policy entirely; URLs still resolve.
DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;