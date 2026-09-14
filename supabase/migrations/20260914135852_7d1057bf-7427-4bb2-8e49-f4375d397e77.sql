ALTER TABLE public.devis
  ADD CONSTRAINT devis_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES public.clients(id)
  ON DELETE RESTRICT;