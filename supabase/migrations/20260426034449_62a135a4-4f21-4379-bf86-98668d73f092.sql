-- Attachment columns
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_type TEXT;

-- Allow deleting own messages
CREATE POLICY "Users can delete their own messages"
ON public.messages
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

-- Storage bucket for chat uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-uploads', 'chat-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone authenticated can view (since urls are unguessable + public bucket convenience)
CREATE POLICY "Authenticated can view chat uploads"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-uploads');

-- Users upload into their own folder
CREATE POLICY "Users upload chat files to own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own chat files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'chat-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);