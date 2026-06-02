-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('pitch-videos', 'pitch-videos', TRUE),
  ('thumbnails', 'thumbnails', TRUE),
  ('profile-photos', 'profile-photos', TRUE),
  ('logos', 'logos', TRUE),
  ('covers', 'covers', TRUE),
  ('pitch-decks', 'pitch-decks', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "pitch_videos_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'pitch-videos');
CREATE POLICY "pitch_videos_startup_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pitch-videos' AND auth.uid()::TEXT = (storage.foldername(name))[1]);
CREATE POLICY "pitch_videos_startup_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'pitch-videos' AND auth.uid()::TEXT = (storage.foldername(name))[1]);

CREATE POLICY "thumbnails_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'thumbnails');
CREATE POLICY "thumbnails_auth_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'thumbnails' AND auth.uid() IS NOT NULL);

CREATE POLICY "profile_photos_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'profile-photos');
CREATE POLICY "profile_photos_own_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::TEXT = (storage.foldername(name))[1]);

CREATE POLICY "logos_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
CREATE POLICY "logos_own_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'logos' AND auth.uid()::TEXT = (storage.foldername(name))[1]);

CREATE POLICY "covers_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'covers');
CREATE POLICY "covers_own_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'covers' AND auth.uid()::TEXT = (storage.foldername(name))[1]);

CREATE POLICY "pitch_decks_own_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'pitch-decks' AND auth.uid()::TEXT = (storage.foldername(name))[1]);
CREATE POLICY "pitch_decks_own_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pitch-decks' AND auth.uid()::TEXT = (storage.foldername(name))[1]);
