
-- Profile comments / endorsements
CREATE TABLE public.profile_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  author_id UUID NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_profile_comments_profile ON public.profile_comments(profile_id, created_at DESC);
ALTER TABLE public.profile_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view comments"
  ON public.profile_comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can post comments on others' profiles"
  ON public.profile_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND auth.uid() <> profile_id);

CREATE POLICY "Authors can edit their comments"
  ON public.profile_comments FOR UPDATE TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their comments"
  ON public.profile_comments FOR DELETE TO authenticated
  USING (auth.uid() = author_id);

CREATE TRIGGER profile_comments_updated_at
  BEFORE UPDATE ON public.profile_comments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Profile views (analytics)
CREATE TABLE public.profile_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  viewer_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_profile_views_profile ON public.profile_views(profile_id, created_at DESC);
CREATE INDEX idx_profile_views_viewer ON public.profile_views(viewer_id);
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their visitors"
  ON public.profile_views FOR SELECT TO authenticated
  USING (auth.uid() = profile_id);

CREATE POLICY "Viewers can see their own visits"
  ON public.profile_views FOR SELECT TO authenticated
  USING (auth.uid() = viewer_id);

CREATE POLICY "Users can record their own profile visits"
  ON public.profile_views FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = viewer_id AND auth.uid() <> profile_id);

-- Realtime for new comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_comments;
