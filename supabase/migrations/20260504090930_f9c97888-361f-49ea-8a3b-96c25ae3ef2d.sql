-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Add RLS policy for notifications write (currently only read policies exist)
CREATE POLICY "users_write_own_notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Add elfatoora and payment tracking to factures
ALTER TABLE public.factures
ADD COLUMN IF NOT EXISTS elfatoora_uuid text,
ADD COLUMN IF NOT EXISTS elfatoora_status text DEFAULT 'non_soumis',
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'impaye',
ADD COLUMN IF NOT EXISTS date_echeance date,
ADD COLUMN IF NOT EXISTS reminder_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reminder_at timestamp with time zone;