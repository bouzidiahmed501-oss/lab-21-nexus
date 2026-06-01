CREATE TABLE IF NOT EXISTS public.audit_log (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID, user_email TEXT, action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT, details JSONB DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log(entity_type, entity_id);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_log_insert_auth" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "audit_log_select_auth" ON public.audit_log FOR SELECT TO authenticated USING (true);