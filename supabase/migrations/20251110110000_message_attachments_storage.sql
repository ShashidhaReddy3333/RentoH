-- =====================================================
-- Message Attachments Storage Setup
-- Created: 2024-11-10
-- =====================================================

-- Create storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- UPDATE MESSAGES TABLE TO SUPPORT ATTACHMENTS
-- =====================================================

-- Add attachment columns to messages table FIRST (before creating policies that reference them)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'messages' AND column_name = 'attachment_url') THEN
    ALTER TABLE public.messages ADD COLUMN attachment_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'messages' AND column_name = 'attachment_name') THEN
    ALTER TABLE public.messages ADD COLUMN attachment_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'messages' AND column_name = 'attachment_size') THEN
    ALTER TABLE public.messages ADD COLUMN attachment_size BIGINT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'messages' AND column_name = 'attachment_type') THEN
    ALTER TABLE public.messages ADD COLUMN attachment_type TEXT;
  END IF;
END $$;

-- Add index for faster attachment queries
CREATE INDEX IF NOT EXISTS idx_messages_attachment_url 
ON public.messages(attachment_url) 
WHERE attachment_url IS NOT NULL;

-- =====================================================
-- STORAGE POLICIES FOR MESSAGE ATTACHMENTS
-- =====================================================

-- Allow authenticated users to upload files to their own folder
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'message-attachments' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read their own files
DROP POLICY IF EXISTS "Users can read own files" ON storage.objects;
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'message-attachments' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read files shared in their message threads
DROP POLICY IF EXISTS "Users can read thread attachments" ON storage.objects;
CREATE POLICY "Users can read thread attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.message_threads t ON m.thread_id = t.id
    WHERE m.attachment_url IS NOT NULL
    AND m.attachment_url LIKE '%' || name || '%'
    AND (t.tenant_id = auth.uid() OR t.landlord_id = auth.uid())
  )
);

-- Allow users to delete their own uploaded files
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'message-attachments' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Message attachments storage bucket created';
  RAISE NOTICE '✅ RLS policies for storage objects created';
  RAISE NOTICE '✅ Messages table updated with attachment columns';
  RAISE NOTICE '📝 NOTE: Make sure to create the storage bucket in Supabase dashboard if it does not exist';
END $$;
