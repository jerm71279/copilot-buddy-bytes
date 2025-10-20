-- Create storage bucket for business documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-documents',
  'business-documents',
  false,
  52428800, -- 50MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/markdown'
  ]
);

-- RLS policies for business-documents bucket
CREATE POLICY "Users can upload business documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'business-documents' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] IN (
    SELECT customer_id::text 
    FROM user_profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their org's business documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'business-documents'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] IN (
    SELECT customer_id::text 
    FROM user_profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their org's business documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'business-documents'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] IN (
    SELECT customer_id::text 
    FROM user_profiles 
    WHERE user_id = auth.uid()
  )
);