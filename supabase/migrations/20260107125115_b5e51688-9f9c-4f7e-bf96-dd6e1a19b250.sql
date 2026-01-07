-- Create storage bucket for beyblade photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('beyblade-photos', 'beyblade-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to beyblade photos
CREATE POLICY "Public can view beyblade photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'beyblade-photos');

-- Allow authenticated users to upload beyblade photos
CREATE POLICY "Authenticated users can upload beyblade photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'beyblade-photos' AND auth.role() = 'authenticated');

-- Allow service role to upload (for edge functions)
CREATE POLICY "Service role can manage beyblade photos"
ON storage.objects FOR ALL
USING (bucket_id = 'beyblade-photos')
WITH CHECK (bucket_id = 'beyblade-photos');