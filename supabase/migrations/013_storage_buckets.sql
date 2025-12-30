-- Create storage bucket for baby photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('baby-photos', 'baby-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for baby-photos bucket

-- Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload baby photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'baby-photos');

-- Allow users to view all baby photos (public bucket)
CREATE POLICY "Anyone can view baby photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'baby-photos');

-- Allow users to delete their own uploaded photos
CREATE POLICY "Users can delete their own baby photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'baby-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add photo_url column to various tables

-- Add to feeding_logs
ALTER TABLE public.feeding_logs
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add to sleep_logs
ALTER TABLE public.sleep_logs
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add to diaper_changes
ALTER TABLE public.diaper_changes
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add to growth_measurements
ALTER TABLE public.growth_measurements
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add to pumping_logs
ALTER TABLE public.pumping_logs
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add to daily_notes
ALTER TABLE public.daily_notes
ADD COLUMN IF NOT EXISTS photo_url TEXT;
