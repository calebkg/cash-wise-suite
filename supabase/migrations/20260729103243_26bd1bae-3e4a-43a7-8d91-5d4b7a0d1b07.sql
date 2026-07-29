
-- Lock down SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.has_workspace_access(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_workspace_edit(UUID, UUID)   FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_workspace_access(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_workspace_edit(UUID, UUID)   TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.handle_new_user()          FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.accept_matching_invites()  FROM PUBLIC, anon, authenticated;
-- trigger execution runs as table owner regardless; keep service_role for admin use
GRANT EXECUTE ON FUNCTION public.handle_new_user()         TO service_role;
GRANT EXECUTE ON FUNCTION public.accept_matching_invites() TO service_role;

-- Set search_path on the trivial touch function
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ============ STORAGE POLICIES for `receipts` bucket ============
-- Users can only read/write objects whose path starts with their user id (e.g. `<uid>/xxx.jpg`)
CREATE POLICY "receipts_select_own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "receipts_insert_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "receipts_update_own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "receipts_delete_own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
