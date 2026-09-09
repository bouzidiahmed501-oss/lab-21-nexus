CREATE TABLE public.chaine_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chaine_id uuid NOT NULL REFERENCES public.chaines_analyse(id) ON DELETE CASCADE,
  echantillon_id uuid REFERENCES public.echantillons(id) ON DELETE CASCADE,
  analyse_id uuid REFERENCES public.analyses(id) ON DELETE CASCADE,
  statut text NOT NULL DEFAULT 'en_cours',
  commentaire text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.chaine_execution_etapes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id uuid NOT NULL REFERENCES public.chaine_executions(id) ON DELETE CASCADE,
  etape_id uuid REFERENCES public.chaine_etapes(id) ON DELETE SET NULL,
  ordre integer NOT NULL,
  libelle text NOT NULL,
  duree_prevue_minutes integer,
  instructions text,
  statut text NOT NULL DEFAULT 'a_faire',
  started_at timestamptz,
  ended_at timestamptz,
  operateur_id uuid REFERENCES auth.users(id),
  equipement_id uuid REFERENCES public.equipements(id) ON DELETE SET NULL,
  commentaire text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_chaine_executions_chaine ON public.chaine_executions(chaine_id);
CREATE INDEX idx_chaine_executions_echantillon ON public.chaine_executions(echantillon_id);
CREATE INDEX idx_chaine_exec_etapes_execution ON public.chaine_execution_etapes(execution_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chaine_executions TO authenticated;
GRANT ALL ON public.chaine_executions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chaine_execution_etapes TO authenticated;
GRANT ALL ON public.chaine_execution_etapes TO service_role;

ALTER TABLE public.chaine_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chaine_execution_etapes ENABLE ROW LEVEL SECURITY;

CREATE POLICY auth_chaine_executions_all ON public.chaine_executions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY auth_chaine_exec_etapes_all ON public.chaine_execution_etapes FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_chaine_executions_updated_at BEFORE UPDATE ON public.chaine_executions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_chaine_exec_etapes_updated_at BEFORE UPDATE ON public.chaine_execution_etapes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();