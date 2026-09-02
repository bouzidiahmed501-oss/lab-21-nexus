export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      actions_capa: {
        Row: {
          audit_id: string | null
          commentaire_efficacite: string | null
          cout_estime: number | null
          cout_reel: number | null
          created_at: string
          created_by: string | null
          date_planifiee: string | null
          date_realisee: string | null
          date_verification: string | null
          description: string
          efficace: boolean | null
          id: string
          nc_id: string | null
          numero: string
          preuves: string | null
          reclamation_id: string | null
          responsable_id: string | null
          statut: Database["public"]["Enums"]["capa_statut"]
          titre: string
          type: Database["public"]["Enums"]["capa_type"]
          updated_at: string
        }
        Insert: {
          audit_id?: string | null
          commentaire_efficacite?: string | null
          cout_estime?: number | null
          cout_reel?: number | null
          created_at?: string
          created_by?: string | null
          date_planifiee?: string | null
          date_realisee?: string | null
          date_verification?: string | null
          description: string
          efficace?: boolean | null
          id?: string
          nc_id?: string | null
          numero: string
          preuves?: string | null
          reclamation_id?: string | null
          responsable_id?: string | null
          statut?: Database["public"]["Enums"]["capa_statut"]
          titre: string
          type?: Database["public"]["Enums"]["capa_type"]
          updated_at?: string
        }
        Update: {
          audit_id?: string | null
          commentaire_efficacite?: string | null
          cout_estime?: number | null
          cout_reel?: number | null
          created_at?: string
          created_by?: string | null
          date_planifiee?: string | null
          date_realisee?: string | null
          date_verification?: string | null
          description?: string
          efficace?: boolean | null
          id?: string
          nc_id?: string | null
          numero?: string
          preuves?: string | null
          reclamation_id?: string | null
          responsable_id?: string | null
          statut?: Database["public"]["Enums"]["capa_statut"]
          titre?: string
          type?: Database["public"]["Enums"]["capa_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "actions_capa_nc_id_fkey"
            columns: ["nc_id"]
            isOneToOne: false
            referencedRelation: "non_conformites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_capa_reclamation_id_fkey"
            columns: ["reclamation_id"]
            isOneToOne: false
            referencedRelation: "reclamations"
            referencedColumns: ["id"]
          },
        ]
      }
      alertes_sonde: {
        Row: {
          acquittee_at: string | null
          acquittee_by: string | null
          commentaire: string | null
          created_at: string
          id: string
          message: string | null
          mesure: number | null
          releve_id: string | null
          severite: string
          sonde_id: string
          type: Database["public"]["Enums"]["alerte_sonde_type"]
        }
        Insert: {
          acquittee_at?: string | null
          acquittee_by?: string | null
          commentaire?: string | null
          created_at?: string
          id?: string
          message?: string | null
          mesure?: number | null
          releve_id?: string | null
          severite?: string
          sonde_id: string
          type: Database["public"]["Enums"]["alerte_sonde_type"]
        }
        Update: {
          acquittee_at?: string | null
          acquittee_by?: string | null
          commentaire?: string | null
          created_at?: string
          id?: string
          message?: string | null
          mesure?: number | null
          releve_id?: string | null
          severite?: string
          sonde_id?: string
          type?: Database["public"]["Enums"]["alerte_sonde_type"]
        }
        Relationships: [
          {
            foreignKeyName: "alertes_sonde_releve_id_fkey"
            columns: ["releve_id"]
            isOneToOne: false
            referencedRelation: "releves_sonde"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertes_sonde_sonde_id_fkey"
            columns: ["sonde_id"]
            isOneToOne: false
            referencedRelation: "sondes"
            referencedColumns: ["id"]
          },
        ]
      }
      analyse_resultats: {
        Row: {
          analyse_id: string
          conformite: boolean | null
          created_at: string
          equipement_id: string | null
          id: string
          incertitude: number | null
          lot_reactif: string | null
          methode_id: string | null
          motif_reprise: string | null
          observations: string | null
          operateur_id: string | null
          parametre_id: string
          reactif_id: string | null
          repetition: number
          unite_id: string | null
          updated_at: string
          valeur: string | null
          valeur_numerique: number | null
        }
        Insert: {
          analyse_id: string
          conformite?: boolean | null
          created_at?: string
          equipement_id?: string | null
          id?: string
          incertitude?: number | null
          lot_reactif?: string | null
          methode_id?: string | null
          motif_reprise?: string | null
          observations?: string | null
          operateur_id?: string | null
          parametre_id: string
          reactif_id?: string | null
          repetition?: number
          unite_id?: string | null
          updated_at?: string
          valeur?: string | null
          valeur_numerique?: number | null
        }
        Update: {
          analyse_id?: string
          conformite?: boolean | null
          created_at?: string
          equipement_id?: string | null
          id?: string
          incertitude?: number | null
          lot_reactif?: string | null
          methode_id?: string | null
          motif_reprise?: string | null
          observations?: string | null
          operateur_id?: string | null
          parametre_id?: string
          reactif_id?: string | null
          repetition?: number
          unite_id?: string | null
          updated_at?: string
          valeur?: string | null
          valeur_numerique?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analyse_resultats_analyse_id_fkey"
            columns: ["analyse_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analyse_resultats_equipement_id_fkey"
            columns: ["equipement_id"]
            isOneToOne: false
            referencedRelation: "equipements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analyse_resultats_methode_id_fkey"
            columns: ["methode_id"]
            isOneToOne: false
            referencedRelation: "methodes_analyse"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analyse_resultats_parametre_id_fkey"
            columns: ["parametre_id"]
            isOneToOne: false
            referencedRelation: "parametres_analyse"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analyse_resultats_reactif_id_fkey"
            columns: ["reactif_id"]
            isOneToOne: false
            referencedRelation: "reactifs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analyse_resultats_unite_id_fkey"
            columns: ["unite_id"]
            isOneToOne: false
            referencedRelation: "unites"
            referencedColumns: ["id"]
          },
        ]
      }
      analyses: {
        Row: {
          bc_id: string | null
          client_id: string
          created_at: string
          created_by: string | null
          date_debut: string | null
          date_fin: string | null
          fr_id: string | null
          id: string
          notes: string | null
          numero: string
          prelevement_id: string
          statut: Database["public"]["Enums"]["analyse_statut"]
          technicien_id: string | null
          updated_at: string
        }
        Insert: {
          bc_id?: string | null
          client_id: string
          created_at?: string
          created_by?: string | null
          date_debut?: string | null
          date_fin?: string | null
          fr_id?: string | null
          id?: string
          notes?: string | null
          numero: string
          prelevement_id: string
          statut?: Database["public"]["Enums"]["analyse_statut"]
          technicien_id?: string | null
          updated_at?: string
        }
        Update: {
          bc_id?: string | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          date_debut?: string | null
          date_fin?: string | null
          fr_id?: string | null
          id?: string
          notes?: string | null
          numero?: string
          prelevement_id?: string
          statut?: Database["public"]["Enums"]["analyse_statut"]
          technicien_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analyses_bc_id_fkey"
            columns: ["bc_id"]
            isOneToOne: false
            referencedRelation: "bons_commande"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analyses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analyses_fr_id_fkey"
            columns: ["fr_id"]
            isOneToOne: false
            referencedRelation: "feuilles_route"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analyses_prelevement_id_fkey"
            columns: ["prelevement_id"]
            isOneToOne: false
            referencedRelation: "prelevements"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          category: string
          created_at: string
          id: string
          settings: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          settings?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          settings?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      audit_constats: {
        Row: {
          audit_id: string
          created_at: string
          description: string
          exigence: string | null
          id: string
          nc_id: string | null
          numero_constat: string | null
          ordre: number
          preuves: string | null
          type: Database["public"]["Enums"]["constat_type"]
        }
        Insert: {
          audit_id: string
          created_at?: string
          description: string
          exigence?: string | null
          id?: string
          nc_id?: string | null
          numero_constat?: string | null
          ordre?: number
          preuves?: string | null
          type?: Database["public"]["Enums"]["constat_type"]
        }
        Update: {
          audit_id?: string
          created_at?: string
          description?: string
          exigence?: string | null
          id?: string
          nc_id?: string | null
          numero_constat?: string | null
          ordre?: number
          preuves?: string | null
          type?: Database["public"]["Enums"]["constat_type"]
        }
        Relationships: [
          {
            foreignKeyName: "audit_constats_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_constats_nc_id_fkey"
            columns: ["nc_id"]
            isOneToOne: false
            referencedRelation: "non_conformites"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audits: {
        Row: {
          audites: string | null
          auditeur_principal: string | null
          auditeurs: string | null
          conclusion: string | null
          created_at: string
          created_by: string | null
          date_debut: string | null
          date_fin: string | null
          id: string
          numero: string
          organisme: string | null
          perimetre: string | null
          rapport_url: string | null
          referentiel: string | null
          responsable_id: string | null
          statut: Database["public"]["Enums"]["audit_statut"]
          titre: string
          type: Database["public"]["Enums"]["audit_type"]
          updated_at: string
        }
        Insert: {
          audites?: string | null
          auditeur_principal?: string | null
          auditeurs?: string | null
          conclusion?: string | null
          created_at?: string
          created_by?: string | null
          date_debut?: string | null
          date_fin?: string | null
          id?: string
          numero: string
          organisme?: string | null
          perimetre?: string | null
          rapport_url?: string | null
          referentiel?: string | null
          responsable_id?: string | null
          statut?: Database["public"]["Enums"]["audit_statut"]
          titre: string
          type?: Database["public"]["Enums"]["audit_type"]
          updated_at?: string
        }
        Update: {
          audites?: string | null
          auditeur_principal?: string | null
          auditeurs?: string | null
          conclusion?: string | null
          created_at?: string
          created_by?: string | null
          date_debut?: string | null
          date_fin?: string | null
          id?: string
          numero?: string
          organisme?: string | null
          perimetre?: string | null
          rapport_url?: string | null
          referentiel?: string | null
          responsable_id?: string | null
          statut?: Database["public"]["Enums"]["audit_statut"]
          titre?: string
          type?: Database["public"]["Enums"]["audit_type"]
          updated_at?: string
        }
        Relationships: []
      }
      avoirs: {
        Row: {
          adresse: string | null
          client_id: string
          code_tva: string | null
          created_at: string
          created_by: string | null
          date_avoir: string
          fax: string | null
          id: string
          mode_reglement: string | null
          net_a_payer: number | null
          net_a_payer_texte: string | null
          numero: string
          retenue_source: number | null
          telephone: string | null
          timbre: number | null
          total_ht: number | null
          total_ttc: number | null
          total_tva: number | null
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          client_id: string
          code_tva?: string | null
          created_at?: string
          created_by?: string | null
          date_avoir?: string
          fax?: string | null
          id?: string
          mode_reglement?: string | null
          net_a_payer?: number | null
          net_a_payer_texte?: string | null
          numero: string
          retenue_source?: number | null
          telephone?: string | null
          timbre?: number | null
          total_ht?: number | null
          total_ttc?: number | null
          total_tva?: number | null
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          client_id?: string
          code_tva?: string | null
          created_at?: string
          created_by?: string | null
          date_avoir?: string
          fax?: string | null
          id?: string
          mode_reglement?: string | null
          net_a_payer?: number | null
          net_a_payer_texte?: string | null
          numero?: string
          retenue_source?: number | null
          telephone?: string | null
          timbre?: number | null
          total_ht?: number | null
          total_ttc?: number | null
          total_tva?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "avoirs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      bc_lignes: {
        Row: {
          bc_id: string
          created_at: string
          designation: string
          id: string
          ordre: number
          parametre_id: string | null
          prix_unitaire: number
          produit_id: string | null
          quantite: number
          remise_pct: number
          total_ht: number
          tva_pct: number
        }
        Insert: {
          bc_id: string
          created_at?: string
          designation: string
          id?: string
          ordre?: number
          parametre_id?: string | null
          prix_unitaire?: number
          produit_id?: string | null
          quantite?: number
          remise_pct?: number
          total_ht?: number
          tva_pct?: number
        }
        Update: {
          bc_id?: string
          created_at?: string
          designation?: string
          id?: string
          ordre?: number
          parametre_id?: string | null
          prix_unitaire?: number
          produit_id?: string | null
          quantite?: number
          remise_pct?: number
          total_ht?: number
          tva_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "bc_lignes_bc_id_fkey"
            columns: ["bc_id"]
            isOneToOne: false
            referencedRelation: "bons_commande"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bc_lignes_parametre_id_fkey"
            columns: ["parametre_id"]
            isOneToOne: false
            referencedRelation: "parametres_analyse"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bc_lignes_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
        ]
      }
      bons_commande: {
        Row: {
          client_id: string
          code_externe: string | null
          conditions: string | null
          created_at: string
          created_by: string | null
          date_bc: string
          date_souhaitee: string | null
          devis_id: string | null
          id: string
          notes: string | null
          numero: string
          objet: string | null
          reference_client: string | null
          referentiel_id: string | null
          region_critere_id: string | null
          remise_pct: number
          responsable_rencontre: string | null
          statut: Database["public"]["Enums"]["bc_statut"]
          temperature_reception: string | null
          total_ht: number
          total_ttc: number
          total_tva: number
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          client_id: string
          code_externe?: string | null
          conditions?: string | null
          created_at?: string
          created_by?: string | null
          date_bc?: string
          date_souhaitee?: string | null
          devis_id?: string | null
          id?: string
          notes?: string | null
          numero: string
          objet?: string | null
          reference_client?: string | null
          referentiel_id?: string | null
          region_critere_id?: string | null
          remise_pct?: number
          responsable_rencontre?: string | null
          statut?: Database["public"]["Enums"]["bc_statut"]
          temperature_reception?: string | null
          total_ht?: number
          total_ttc?: number
          total_tva?: number
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          client_id?: string
          code_externe?: string | null
          conditions?: string | null
          created_at?: string
          created_by?: string | null
          date_bc?: string
          date_souhaitee?: string | null
          devis_id?: string | null
          id?: string
          notes?: string | null
          numero?: string
          objet?: string | null
          reference_client?: string | null
          referentiel_id?: string | null
          region_critere_id?: string | null
          remise_pct?: number
          responsable_rencontre?: string | null
          statut?: Database["public"]["Enums"]["bc_statut"]
          temperature_reception?: string | null
          total_ht?: number
          total_ttc?: number
          total_tva?: number
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bons_commande_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bons_commande_referentiel_id_fkey"
            columns: ["referentiel_id"]
            isOneToOne: false
            referencedRelation: "referentiels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bons_commande_region_critere_id_fkey"
            columns: ["region_critere_id"]
            isOneToOne: false
            referencedRelation: "region_criteres"
            referencedColumns: ["id"]
          },
        ]
      }
      bulletins_paie: {
        Row: {
          annee: number
          brut: number
          cnss_patronal: number
          cnss_salarial: number
          created_at: string
          created_by: string | null
          employe_id: string
          heures_supp_montant: number
          id: string
          irpp: number
          jours_conges: number | null
          jours_travailles: number | null
          mois: number
          net_a_payer: number
          observations: string | null
          pdf_path: string | null
          primes: number
          retenues: number
          salaire_base: number
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          annee: number
          brut?: number
          cnss_patronal?: number
          cnss_salarial?: number
          created_at?: string
          created_by?: string | null
          employe_id: string
          heures_supp_montant?: number
          id?: string
          irpp?: number
          jours_conges?: number | null
          jours_travailles?: number | null
          mois: number
          net_a_payer?: number
          observations?: string | null
          pdf_path?: string | null
          primes?: number
          retenues?: number
          salaire_base?: number
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          annee?: number
          brut?: number
          cnss_patronal?: number
          cnss_salarial?: number
          created_at?: string
          created_by?: string | null
          employe_id?: string
          heures_supp_montant?: number
          id?: string
          irpp?: number
          jours_conges?: number | null
          jours_travailles?: number | null
          mois?: number
          net_a_payer?: number
          observations?: string | null
          pdf_path?: string | null
          primes?: number
          retenues?: number
          salaire_base?: number
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bulletins_paie_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
        ]
      }
      catalogue_analyses: {
        Row: {
          accredite: boolean | null
          avec_temperature: boolean | null
          code: string
          code_norme: string | null
          code_norme_reference: string | null
          created_at: string
          date_accreditation: string | null
          date_version: string | null
          id: string
          incertitude: string | null
          indice: number
          is_active: boolean | null
          libelle: string | null
          num_dossier_accreditation: string | null
          ordre: number
          organisme_accrediteur: string | null
          prix: number
          referentiel_id: string | null
          titre_norme: string | null
          type_analyse_id: string | null
          updated_at: string
          version_norme: string | null
        }
        Insert: {
          accredite?: boolean | null
          avec_temperature?: boolean | null
          code: string
          code_norme?: string | null
          code_norme_reference?: string | null
          created_at?: string
          date_accreditation?: string | null
          date_version?: string | null
          id?: string
          incertitude?: string | null
          indice?: number
          is_active?: boolean | null
          libelle?: string | null
          num_dossier_accreditation?: string | null
          ordre?: number
          organisme_accrediteur?: string | null
          prix?: number
          referentiel_id?: string | null
          titre_norme?: string | null
          type_analyse_id?: string | null
          updated_at?: string
          version_norme?: string | null
        }
        Update: {
          accredite?: boolean | null
          avec_temperature?: boolean | null
          code?: string
          code_norme?: string | null
          code_norme_reference?: string | null
          created_at?: string
          date_accreditation?: string | null
          date_version?: string | null
          id?: string
          incertitude?: string | null
          indice?: number
          is_active?: boolean | null
          libelle?: string | null
          num_dossier_accreditation?: string | null
          ordre?: number
          organisme_accrediteur?: string | null
          prix?: number
          referentiel_id?: string | null
          titre_norme?: string | null
          type_analyse_id?: string | null
          updated_at?: string
          version_norme?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalogue_analyses_referentiel_id_fkey"
            columns: ["referentiel_id"]
            isOneToOne: false
            referencedRelation: "referentiels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalogue_analyses_type_analyse_id_fkey"
            columns: ["type_analyse_id"]
            isOneToOne: false
            referencedRelation: "type_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      chaine_etapes: {
        Row: {
          chaine_id: string
          created_at: string
          duree_minutes: number | null
          equipement_id: string | null
          id: string
          instructions: string | null
          libelle: string
          ordre: number
          technicien_role: string | null
        }
        Insert: {
          chaine_id: string
          created_at?: string
          duree_minutes?: number | null
          equipement_id?: string | null
          id?: string
          instructions?: string | null
          libelle: string
          ordre?: number
          technicien_role?: string | null
        }
        Update: {
          chaine_id?: string
          created_at?: string
          duree_minutes?: number | null
          equipement_id?: string | null
          id?: string
          instructions?: string | null
          libelle?: string
          ordre?: number
          technicien_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chaine_etapes_chaine_id_fkey"
            columns: ["chaine_id"]
            isOneToOne: false
            referencedRelation: "chaines_analyse"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chaine_etapes_equipement_id_fkey"
            columns: ["equipement_id"]
            isOneToOne: false
            referencedRelation: "equipements"
            referencedColumns: ["id"]
          },
        ]
      }
      chaines_analyse: {
        Row: {
          catalogue_analyse_id: string | null
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          libelle: string
          updated_at: string
        }
        Insert: {
          catalogue_analyse_id?: string | null
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          libelle: string
          updated_at?: string
        }
        Update: {
          catalogue_analyse_id?: string | null
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          libelle?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chaines_analyse_catalogue_analyse_id_fkey"
            columns: ["catalogue_analyse_id"]
            isOneToOne: false
            referencedRelation: "catalogue_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          adresse: string | null
          code: string | null
          code_postal: string | null
          contact_email: string | null
          contact_principal: string | null
          contact_telephone: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          is_active: boolean
          matricule_fiscal: string | null
          notes: string | null
          pays: string | null
          raison_sociale: string
          registre_commerce: string | null
          telephone: string | null
          type_client: string | null
          updated_at: string
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          code?: string | null
          code_postal?: string | null
          contact_email?: string | null
          contact_principal?: string | null
          contact_telephone?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          matricule_fiscal?: string | null
          notes?: string | null
          pays?: string | null
          raison_sociale: string
          registre_commerce?: string | null
          telephone?: string | null
          type_client?: string | null
          updated_at?: string
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          code?: string | null
          code_postal?: string | null
          contact_email?: string | null
          contact_principal?: string | null
          contact_telephone?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          matricule_fiscal?: string | null
          notes?: string | null
          pays?: string | null
          raison_sociale?: string
          registre_commerce?: string | null
          telephone?: string | null
          type_client?: string | null
          updated_at?: string
          ville?: string | null
        }
        Relationships: []
      }
      conges: {
        Row: {
          commentaire_validation: string | null
          created_at: string
          created_by: string | null
          date_debut: string
          date_fin: string
          date_validation: string | null
          employe_id: string
          id: string
          motif: string | null
          nb_jours: number
          statut: Database["public"]["Enums"]["conge_statut"]
          type: Database["public"]["Enums"]["conge_type"]
          updated_at: string
          validateur_id: string | null
        }
        Insert: {
          commentaire_validation?: string | null
          created_at?: string
          created_by?: string | null
          date_debut: string
          date_fin: string
          date_validation?: string | null
          employe_id: string
          id?: string
          motif?: string | null
          nb_jours?: number
          statut?: Database["public"]["Enums"]["conge_statut"]
          type?: Database["public"]["Enums"]["conge_type"]
          updated_at?: string
          validateur_id?: string | null
        }
        Update: {
          commentaire_validation?: string | null
          created_at?: string
          created_by?: string | null
          date_debut?: string
          date_fin?: string
          date_validation?: string | null
          employe_id?: string
          id?: string
          motif?: string | null
          nb_jours?: number
          statut?: Database["public"]["Enums"]["conge_statut"]
          type?: Database["public"]["Enums"]["conge_type"]
          updated_at?: string
          validateur_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conges_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
        ]
      }
      cq_cartes_controle: {
        Row: {
          code: string
          created_at: string | null
          ecart_type: number | null
          id: string
          is_actif: boolean | null
          limite_inf_action: number | null
          limite_inf_avert: number | null
          limite_sup_action: number | null
          limite_sup_avert: number | null
          methode_id: string | null
          nom: string
          notes: string | null
          parametre_id: string | null
          tenant_id: string | null
          type_carte: string | null
          updated_at: string | null
          valeur_cible: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          ecart_type?: number | null
          id?: string
          is_actif?: boolean | null
          limite_inf_action?: number | null
          limite_inf_avert?: number | null
          limite_sup_action?: number | null
          limite_sup_avert?: number | null
          methode_id?: string | null
          nom: string
          notes?: string | null
          parametre_id?: string | null
          tenant_id?: string | null
          type_carte?: string | null
          updated_at?: string | null
          valeur_cible?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          ecart_type?: number | null
          id?: string
          is_actif?: boolean | null
          limite_inf_action?: number | null
          limite_inf_avert?: number | null
          limite_sup_action?: number | null
          limite_sup_avert?: number | null
          methode_id?: string | null
          nom?: string
          notes?: string | null
          parametre_id?: string | null
          tenant_id?: string | null
          type_carte?: string | null
          updated_at?: string | null
          valeur_cible?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cq_cartes_controle_methode_id_fkey"
            columns: ["methode_id"]
            isOneToOne: false
            referencedRelation: "methodes_analyse"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cq_cartes_controle_parametre_id_fkey"
            columns: ["parametre_id"]
            isOneToOne: false
            referencedRelation: "parametres_analyse"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cq_cartes_controle_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cq_mesures: {
        Row: {
          carte_id: string
          commentaire: string | null
          created_at: string | null
          date_mesure: string
          equipement_id: string | null
          hors_limite: boolean | null
          id: string
          reactif_lot: string | null
          regle_violee: string | null
          technicien_id: string | null
          type_echantillon_cq: string | null
          valeur: number
        }
        Insert: {
          carte_id: string
          commentaire?: string | null
          created_at?: string | null
          date_mesure?: string
          equipement_id?: string | null
          hors_limite?: boolean | null
          id?: string
          reactif_lot?: string | null
          regle_violee?: string | null
          technicien_id?: string | null
          type_echantillon_cq?: string | null
          valeur: number
        }
        Update: {
          carte_id?: string
          commentaire?: string | null
          created_at?: string | null
          date_mesure?: string
          equipement_id?: string | null
          hors_limite?: boolean | null
          id?: string
          reactif_lot?: string | null
          regle_violee?: string | null
          technicien_id?: string | null
          type_echantillon_cq?: string | null
          valeur?: number
        }
        Relationships: [
          {
            foreignKeyName: "cq_mesures_carte_id_fkey"
            columns: ["carte_id"]
            isOneToOne: false
            referencedRelation: "cq_cartes_controle"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cq_mesures_equipement_id_fkey"
            columns: ["equipement_id"]
            isOneToOne: false
            referencedRelation: "equipements"
            referencedColumns: ["id"]
          },
        ]
      }
      criteres: {
        Row: {
          code: string
          commentaire: string | null
          created_at: string
          famille_id: string | null
          id: string
          libelle: string | null
          nature_critere_id: string | null
          note: string | null
          origine: string | null
          quantite_testee: string | null
          region_critere_id: string | null
          type_analyse_id: string | null
          updated_at: string
          valeur_max: number | null
          valeur_min: number | null
          valeurs: string | null
        }
        Insert: {
          code: string
          commentaire?: string | null
          created_at?: string
          famille_id?: string | null
          id?: string
          libelle?: string | null
          nature_critere_id?: string | null
          note?: string | null
          origine?: string | null
          quantite_testee?: string | null
          region_critere_id?: string | null
          type_analyse_id?: string | null
          updated_at?: string
          valeur_max?: number | null
          valeur_min?: number | null
          valeurs?: string | null
        }
        Update: {
          code?: string
          commentaire?: string | null
          created_at?: string
          famille_id?: string | null
          id?: string
          libelle?: string | null
          nature_critere_id?: string | null
          note?: string | null
          origine?: string | null
          quantite_testee?: string | null
          region_critere_id?: string | null
          type_analyse_id?: string | null
          updated_at?: string
          valeur_max?: number | null
          valeur_min?: number | null
          valeurs?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "criteres_famille_id_fkey"
            columns: ["famille_id"]
            isOneToOne: false
            referencedRelation: "familles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criteres_nature_critere_id_fkey"
            columns: ["nature_critere_id"]
            isOneToOne: false
            referencedRelation: "nature_criteres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criteres_region_critere_id_fkey"
            columns: ["region_critere_id"]
            isOneToOne: false
            referencedRelation: "region_criteres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criteres_type_analyse_id_fkey"
            columns: ["type_analyse_id"]
            isOneToOne: false
            referencedRelation: "type_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      depenses: {
        Row: {
          beneficiaire: string | null
          categorie: string
          created_at: string
          created_by: string | null
          date_depense: string
          employe_id: string | null
          id: string
          libelle: string
          mission_id: string | null
          mode_paiement: string | null
          montant_ht: number
          montant_ttc: number
          notes: string | null
          numero: string
          projet_id: string | null
          reference_piece: string | null
          tva_pct: number
          updated_at: string
        }
        Insert: {
          beneficiaire?: string | null
          categorie: string
          created_at?: string
          created_by?: string | null
          date_depense?: string
          employe_id?: string | null
          id?: string
          libelle: string
          mission_id?: string | null
          mode_paiement?: string | null
          montant_ht?: number
          montant_ttc?: number
          notes?: string | null
          numero: string
          projet_id?: string | null
          reference_piece?: string | null
          tva_pct?: number
          updated_at?: string
        }
        Update: {
          beneficiaire?: string | null
          categorie?: string
          created_at?: string
          created_by?: string | null
          date_depense?: string
          employe_id?: string | null
          id?: string
          libelle?: string
          mission_id?: string | null
          mode_paiement?: string | null
          montant_ht?: number
          montant_ttc?: number
          notes?: string | null
          numero?: string
          projet_id?: string | null
          reference_piece?: string | null
          tva_pct?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "depenses_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "depenses_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "depenses_projet_id_fkey"
            columns: ["projet_id"]
            isOneToOne: false
            referencedRelation: "projets"
            referencedColumns: ["id"]
          },
        ]
      }
      devis: {
        Row: {
          accepte_at: string | null
          bc_id: string | null
          client_id: string
          conditions: string | null
          created_at: string
          created_by: string | null
          date_devis: string
          envoye_at: string | null
          id: string
          notes: string | null
          numero: string
          objet: string | null
          reference_client: string | null
          remise_pct: number
          statut: Database["public"]["Enums"]["devis_statut"]
          total_ht: number
          total_ttc: number
          total_tva: number
          updated_at: string
          validite_jours: number
        }
        Insert: {
          accepte_at?: string | null
          bc_id?: string | null
          client_id: string
          conditions?: string | null
          created_at?: string
          created_by?: string | null
          date_devis?: string
          envoye_at?: string | null
          id?: string
          notes?: string | null
          numero: string
          objet?: string | null
          reference_client?: string | null
          remise_pct?: number
          statut?: Database["public"]["Enums"]["devis_statut"]
          total_ht?: number
          total_ttc?: number
          total_tva?: number
          updated_at?: string
          validite_jours?: number
        }
        Update: {
          accepte_at?: string | null
          bc_id?: string | null
          client_id?: string
          conditions?: string | null
          created_at?: string
          created_by?: string | null
          date_devis?: string
          envoye_at?: string | null
          id?: string
          notes?: string | null
          numero?: string
          objet?: string | null
          reference_client?: string | null
          remise_pct?: number
          statut?: Database["public"]["Enums"]["devis_statut"]
          total_ht?: number
          total_ttc?: number
          total_tva?: number
          updated_at?: string
          validite_jours?: number
        }
        Relationships: []
      }
      devis_lignes: {
        Row: {
          created_at: string
          designation: string
          devis_id: string
          id: string
          ordre: number
          parametre_id: string | null
          prix_unitaire: number
          produit_id: string | null
          quantite: number
          remise_pct: number
          total_ht: number
          tva_pct: number
        }
        Insert: {
          created_at?: string
          designation: string
          devis_id: string
          id?: string
          ordre?: number
          parametre_id?: string | null
          prix_unitaire?: number
          produit_id?: string | null
          quantite?: number
          remise_pct?: number
          total_ht?: number
          tva_pct?: number
        }
        Update: {
          created_at?: string
          designation?: string
          devis_id?: string
          id?: string
          ordre?: number
          parametre_id?: string | null
          prix_unitaire?: number
          produit_id?: string | null
          quantite?: number
          remise_pct?: number
          total_ht?: number
          tva_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "devis_lignes_devis_id_fkey"
            columns: ["devis_id"]
            isOneToOne: false
            referencedRelation: "devis"
            referencedColumns: ["id"]
          },
        ]
      }
      documents_qualite: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          date_realisation: string | null
          description: string | null
          fichier_url: string | null
          id: string
          libelle: string | null
          updated_at: string
          version: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          date_realisation?: string | null
          description?: string | null
          fichier_url?: string | null
          id?: string
          libelle?: string | null
          updated_at?: string
          version?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          date_realisation?: string | null
          description?: string | null
          fichier_url?: string | null
          id?: string
          libelle?: string | null
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      echantillon_historique: {
        Row: {
          action: string
          ancien_statut: string | null
          created_at: string | null
          echantillon_id: string
          emplacement: string | null
          id: string
          notes: string | null
          nouveau_statut: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          ancien_statut?: string | null
          created_at?: string | null
          echantillon_id: string
          emplacement?: string | null
          id?: string
          notes?: string | null
          nouveau_statut?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          ancien_statut?: string | null
          created_at?: string | null
          echantillon_id?: string
          emplacement?: string | null
          id?: string
          notes?: string | null
          nouveau_statut?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "echantillon_historique_echantillon_id_fkey"
            columns: ["echantillon_id"]
            isOneToOne: false
            referencedRelation: "echantillons"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons: {
        Row: {
          aliquot_index: number | null
          code_barre: string
          created_at: string | null
          created_by: string | null
          date_conservation_fin: string | null
          date_destruction: string | null
          date_reception: string | null
          designation: string
          emplacement: string | null
          emplacement_id: string | null
          id: string
          notes: string | null
          parent_id: string | null
          prelevement_id: string | null
          statut: string
          temperature_stockage: number | null
          tenant_id: string | null
          type_echantillon: string | null
          updated_at: string | null
          volume_quantite: string | null
        }
        Insert: {
          aliquot_index?: number | null
          code_barre: string
          created_at?: string | null
          created_by?: string | null
          date_conservation_fin?: string | null
          date_destruction?: string | null
          date_reception?: string | null
          designation: string
          emplacement?: string | null
          emplacement_id?: string | null
          id?: string
          notes?: string | null
          parent_id?: string | null
          prelevement_id?: string | null
          statut?: string
          temperature_stockage?: number | null
          tenant_id?: string | null
          type_echantillon?: string | null
          updated_at?: string | null
          volume_quantite?: string | null
        }
        Update: {
          aliquot_index?: number | null
          code_barre?: string
          created_at?: string | null
          created_by?: string | null
          date_conservation_fin?: string | null
          date_destruction?: string | null
          date_reception?: string | null
          designation?: string
          emplacement?: string | null
          emplacement_id?: string | null
          id?: string
          notes?: string | null
          parent_id?: string | null
          prelevement_id?: string | null
          statut?: string
          temperature_stockage?: number | null
          tenant_id?: string | null
          type_echantillon?: string | null
          updated_at?: string | null
          volume_quantite?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_emplacement_id_fkey"
            columns: ["emplacement_id"]
            isOneToOne: false
            referencedRelation: "emplacements_stockage"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "echantillons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_prelevement_id_fkey"
            columns: ["prelevement_id"]
            isOneToOne: false
            referencedRelation: "prelevements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      eil_participations: {
        Row: {
          actions_correctives: string | null
          created_at: string | null
          date_participation: string | null
          date_resultat: string | null
          id: string
          organisme: string
          parametre: string | null
          rapport_url: string | null
          reference: string | null
          resultat: string | null
          tenant_id: string | null
          updated_at: string | null
          valeur_assignee: number | null
          valeur_labo: number | null
          z_score: number | null
        }
        Insert: {
          actions_correctives?: string | null
          created_at?: string | null
          date_participation?: string | null
          date_resultat?: string | null
          id?: string
          organisme: string
          parametre?: string | null
          rapport_url?: string | null
          reference?: string | null
          resultat?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          valeur_assignee?: number | null
          valeur_labo?: number | null
          z_score?: number | null
        }
        Update: {
          actions_correctives?: string | null
          created_at?: string | null
          date_participation?: string | null
          date_resultat?: string | null
          id?: string
          organisme?: string
          parametre?: string | null
          rapport_url?: string | null
          reference?: string | null
          resultat?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          valeur_assignee?: number | null
          valeur_labo?: number | null
          z_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "eil_participations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      emplacements_stockage: {
        Row: {
          capacite: number | null
          code: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          libelle: string
          notes: string | null
          occupation: number
          parent_id: string | null
          temperature_cible: number | null
          temperature_max: number | null
          temperature_min: number | null
          tenant_id: string | null
          type_emplacement: string
          updated_at: string
        }
        Insert: {
          capacite?: number | null
          code: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          libelle: string
          notes?: string | null
          occupation?: number
          parent_id?: string | null
          temperature_cible?: number | null
          temperature_max?: number | null
          temperature_min?: number | null
          tenant_id?: string | null
          type_emplacement?: string
          updated_at?: string
        }
        Update: {
          capacite?: number | null
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          libelle?: string
          notes?: string | null
          occupation?: number
          parent_id?: string | null
          temperature_cible?: number | null
          temperature_max?: number | null
          temperature_min?: number | null
          tenant_id?: string | null
          type_emplacement?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emplacements_stockage_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "emplacements_stockage"
            referencedColumns: ["id"]
          },
        ]
      }
      employes: {
        Row: {
          adresse: string | null
          cin: string | null
          cnss: string | null
          contrat_type: Database["public"]["Enums"]["contrat_type"]
          created_at: string
          created_by: string | null
          date_embauche: string
          date_fin_contrat: string | null
          date_naissance: string | null
          date_sortie: string | null
          email: string | null
          fonction: string | null
          id: string
          is_active: boolean
          matricule: string | null
          nom: string
          notes: string | null
          numero: string
          prenom: string
          rib: string | null
          salaire_base: number
          service: string | null
          telephone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          adresse?: string | null
          cin?: string | null
          cnss?: string | null
          contrat_type?: Database["public"]["Enums"]["contrat_type"]
          created_at?: string
          created_by?: string | null
          date_embauche?: string
          date_fin_contrat?: string | null
          date_naissance?: string | null
          date_sortie?: string | null
          email?: string | null
          fonction?: string | null
          id?: string
          is_active?: boolean
          matricule?: string | null
          nom: string
          notes?: string | null
          numero: string
          prenom: string
          rib?: string | null
          salaire_base?: number
          service?: string | null
          telephone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          adresse?: string | null
          cin?: string | null
          cnss?: string | null
          contrat_type?: Database["public"]["Enums"]["contrat_type"]
          created_at?: string
          created_by?: string | null
          date_embauche?: string
          date_fin_contrat?: string | null
          date_naissance?: string | null
          date_sortie?: string | null
          email?: string | null
          fonction?: string | null
          id?: string
          is_active?: boolean
          matricule?: string | null
          nom?: string
          notes?: string | null
          numero?: string
          prenom?: string
          rib?: string | null
          salaire_base?: number
          service?: string | null
          telephone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      equipements: {
        Row: {
          code: string | null
          cout_achat: number | null
          created_at: string
          created_by: string | null
          date_achat: string | null
          date_mise_service: string | null
          designation: string
          fournisseur: string | null
          frequence_etalonnage_mois: number | null
          garantie_fin: string | null
          id: string
          localisation: string | null
          marque: string | null
          modele: string | null
          notes: string | null
          numero: string
          numero_serie: string | null
          prochaine_etalonnage: string | null
          responsable_id: string | null
          service: string | null
          statut: Database["public"]["Enums"]["equipement_statut"]
          updated_at: string
        }
        Insert: {
          code?: string | null
          cout_achat?: number | null
          created_at?: string
          created_by?: string | null
          date_achat?: string | null
          date_mise_service?: string | null
          designation: string
          fournisseur?: string | null
          frequence_etalonnage_mois?: number | null
          garantie_fin?: string | null
          id?: string
          localisation?: string | null
          marque?: string | null
          modele?: string | null
          notes?: string | null
          numero: string
          numero_serie?: string | null
          prochaine_etalonnage?: string | null
          responsable_id?: string | null
          service?: string | null
          statut?: Database["public"]["Enums"]["equipement_statut"]
          updated_at?: string
        }
        Update: {
          code?: string | null
          cout_achat?: number | null
          created_at?: string
          created_by?: string | null
          date_achat?: string | null
          date_mise_service?: string | null
          designation?: string
          fournisseur?: string | null
          frequence_etalonnage_mois?: number | null
          garantie_fin?: string | null
          id?: string
          localisation?: string | null
          marque?: string | null
          modele?: string | null
          notes?: string | null
          numero?: string
          numero_serie?: string | null
          prochaine_etalonnage?: string | null
          responsable_id?: string | null
          service?: string | null
          statut?: Database["public"]["Enums"]["equipement_statut"]
          updated_at?: string
        }
        Relationships: []
      }
      etalonnages: {
        Row: {
          certificat_url: string | null
          cout: number | null
          created_at: string
          created_by: string | null
          date_etalonnage: string
          equipement_id: string
          id: string
          numero_certificat: string | null
          observations: string | null
          organisme: string | null
          prochaine_date: string | null
          resultat: Database["public"]["Enums"]["etalonnage_resultat"]
        }
        Insert: {
          certificat_url?: string | null
          cout?: number | null
          created_at?: string
          created_by?: string | null
          date_etalonnage: string
          equipement_id: string
          id?: string
          numero_certificat?: string | null
          observations?: string | null
          organisme?: string | null
          prochaine_date?: string | null
          resultat?: Database["public"]["Enums"]["etalonnage_resultat"]
        }
        Update: {
          certificat_url?: string | null
          cout?: number | null
          created_at?: string
          created_by?: string | null
          date_etalonnage?: string
          equipement_id?: string
          id?: string
          numero_certificat?: string | null
          observations?: string | null
          organisme?: string | null
          prochaine_date?: string | null
          resultat?: Database["public"]["Enums"]["etalonnage_resultat"]
        }
        Relationships: [
          {
            foreignKeyName: "etalonnages_equipement_id_fkey"
            columns: ["equipement_id"]
            isOneToOne: false
            referencedRelation: "equipements"
            referencedColumns: ["id"]
          },
        ]
      }
      facture_bons_commande: {
        Row: {
          bon_commande_id: string
          facture_id: string
          id: string
          ordre: number | null
        }
        Insert: {
          bon_commande_id: string
          facture_id: string
          id?: string
          ordre?: number | null
        }
        Update: {
          bon_commande_id?: string
          facture_id?: string
          id?: string
          ordre?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "facture_bons_commande_bon_commande_id_fkey"
            columns: ["bon_commande_id"]
            isOneToOne: false
            referencedRelation: "bons_commande"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facture_bons_commande_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
        ]
      }
      factures: {
        Row: {
          adresse: string | null
          client_id: string
          code_tva: string | null
          created_at: string
          created_by: string | null
          date_echeance: string | null
          date_facture: string
          date_reglement: string | null
          elfatoora_status: string | null
          elfatoora_uuid: string | null
          fax: string | null
          id: string
          last_reminder_at: string | null
          mode_reglement_id: string | null
          net_a_payer: number | null
          net_a_payer_texte: string | null
          numero: string
          payment_status: string | null
          reminder_count: number | null
          retenue_source: number | null
          statut: string
          telephone: string | null
          timbre: number | null
          total_ht: number | null
          total_ttc: number | null
          total_tva: number | null
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          client_id: string
          code_tva?: string | null
          created_at?: string
          created_by?: string | null
          date_echeance?: string | null
          date_facture?: string
          date_reglement?: string | null
          elfatoora_status?: string | null
          elfatoora_uuid?: string | null
          fax?: string | null
          id?: string
          last_reminder_at?: string | null
          mode_reglement_id?: string | null
          net_a_payer?: number | null
          net_a_payer_texte?: string | null
          numero: string
          payment_status?: string | null
          reminder_count?: number | null
          retenue_source?: number | null
          statut?: string
          telephone?: string | null
          timbre?: number | null
          total_ht?: number | null
          total_ttc?: number | null
          total_tva?: number | null
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          client_id?: string
          code_tva?: string | null
          created_at?: string
          created_by?: string | null
          date_echeance?: string | null
          date_facture?: string
          date_reglement?: string | null
          elfatoora_status?: string | null
          elfatoora_uuid?: string | null
          fax?: string | null
          id?: string
          last_reminder_at?: string | null
          mode_reglement_id?: string | null
          net_a_payer?: number | null
          net_a_payer_texte?: string | null
          numero?: string
          payment_status?: string | null
          reminder_count?: number | null
          retenue_source?: number | null
          statut?: string
          telephone?: string | null
          timbre?: number | null
          total_ht?: number | null
          total_ttc?: number | null
          total_tva?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "factures_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factures_mode_reglement_id_fkey"
            columns: ["mode_reglement_id"]
            isOneToOne: false
            referencedRelation: "modes_reglement"
            referencedColumns: ["id"]
          },
        ]
      }
      familles: {
        Row: {
          code: string
          created_at: string
          id: string
          libelle: string | null
          region_critere_id: string | null
          super_famille_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          libelle?: string | null
          region_critere_id?: string | null
          super_famille_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          libelle?: string | null
          region_critere_id?: string | null
          super_famille_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "familles_region_critere_id_fkey"
            columns: ["region_critere_id"]
            isOneToOne: false
            referencedRelation: "region_criteres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "familles_super_famille_id_fkey"
            columns: ["super_famille_id"]
            isOneToOne: false
            referencedRelation: "super_familles"
            referencedColumns: ["id"]
          },
        ]
      }
      feuilles_route: {
        Row: {
          created_at: string
          created_by: string | null
          date_fr: string
          id: string
          laboratoire: string | null
          notes: string | null
          numero: string
          statut: Database["public"]["Enums"]["fr_statut"]
          technicien_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date_fr?: string
          id?: string
          laboratoire?: string | null
          notes?: string | null
          numero: string
          statut?: Database["public"]["Enums"]["fr_statut"]
          technicien_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date_fr?: string
          id?: string
          laboratoire?: string | null
          notes?: string | null
          numero?: string
          statut?: Database["public"]["Enums"]["fr_statut"]
          technicien_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      formations: {
        Row: {
          attestation_url: string | null
          cout: number | null
          created_at: string
          created_by: string | null
          date_debut: string | null
          date_fin: string | null
          duree_heures: number | null
          employe_id: string
          id: string
          intitule: string
          notes: string | null
          organisme: string | null
          resultat: string
          score: number | null
          tenant_id: string | null
          type_formation: string
          updated_at: string
        }
        Insert: {
          attestation_url?: string | null
          cout?: number | null
          created_at?: string
          created_by?: string | null
          date_debut?: string | null
          date_fin?: string | null
          duree_heures?: number | null
          employe_id: string
          id?: string
          intitule: string
          notes?: string | null
          organisme?: string | null
          resultat?: string
          score?: number | null
          tenant_id?: string | null
          type_formation?: string
          updated_at?: string
        }
        Update: {
          attestation_url?: string | null
          cout?: number | null
          created_at?: string
          created_by?: string | null
          date_debut?: string | null
          date_fin?: string | null
          duree_heures?: number | null
          employe_id?: string
          id?: string
          intitule?: string
          notes?: string | null
          organisme?: string | null
          resultat?: string
          score?: number | null
          tenant_id?: string | null
          type_formation?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "formations_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
        ]
      }
      fr_taches: {
        Row: {
          created_at: string
          fr_id: string
          id: string
          notes: string | null
          ordre: number
          parametre_id: string | null
          prelevement_id: string | null
          statut: string | null
        }
        Insert: {
          created_at?: string
          fr_id: string
          id?: string
          notes?: string | null
          ordre?: number
          parametre_id?: string | null
          prelevement_id?: string | null
          statut?: string | null
        }
        Update: {
          created_at?: string
          fr_id?: string
          id?: string
          notes?: string | null
          ordre?: number
          parametre_id?: string | null
          prelevement_id?: string | null
          statut?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fr_taches_fr_id_fkey"
            columns: ["fr_id"]
            isOneToOne: false
            referencedRelation: "feuilles_route"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fr_taches_parametre_id_fkey"
            columns: ["parametre_id"]
            isOneToOne: false
            referencedRelation: "parametres_analyse"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fr_taches_prelevement_id_fkey"
            columns: ["prelevement_id"]
            isOneToOne: false
            referencedRelation: "prelevements"
            referencedColumns: ["id"]
          },
        ]
      }
      habilitations: {
        Row: {
          commentaire: string | null
          created_at: string
          created_by: string | null
          date_expiration: string | null
          date_habilitation: string
          employe_id: string
          equipement_id: string | null
          evaluateur_id: string | null
          id: string
          intitule: string
          methode_id: string | null
          niveau: string
          parametre_id: string | null
          preuve_url: string | null
          statut: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          commentaire?: string | null
          created_at?: string
          created_by?: string | null
          date_expiration?: string | null
          date_habilitation?: string
          employe_id: string
          equipement_id?: string | null
          evaluateur_id?: string | null
          id?: string
          intitule: string
          methode_id?: string | null
          niveau?: string
          parametre_id?: string | null
          preuve_url?: string | null
          statut?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          commentaire?: string | null
          created_at?: string
          created_by?: string | null
          date_expiration?: string | null
          date_habilitation?: string
          employe_id?: string
          equipement_id?: string | null
          evaluateur_id?: string | null
          id?: string
          intitule?: string
          methode_id?: string | null
          niveau?: string
          parametre_id?: string | null
          preuve_url?: string | null
          statut?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "habilitations_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habilitations_equipement_id_fkey"
            columns: ["equipement_id"]
            isOneToOne: false
            referencedRelation: "equipements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habilitations_methode_id_fkey"
            columns: ["methode_id"]
            isOneToOne: false
            referencedRelation: "methodes_analyse"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habilitations_parametre_id_fkey"
            columns: ["parametre_id"]
            isOneToOne: false
            referencedRelation: "parametres_analyse"
            referencedColumns: ["id"]
          },
        ]
      }
      indicateurs_qualite: {
        Row: {
          annee: number
          commentaire: string | null
          created_at: string
          created_by: string | null
          delai_moyen_traitement_nc: number | null
          delai_moyen_traitement_rec: number | null
          id: string
          mois: number
          nb_audits: number
          nb_nc_cloturees: number
          nb_nc_ouvertes: number
          nb_rapports_emis: number
          nb_reclamations: number
          nb_reclamations_fondees: number
          taux_conformite: number | null
          taux_satisfaction: number | null
          updated_at: string
        }
        Insert: {
          annee: number
          commentaire?: string | null
          created_at?: string
          created_by?: string | null
          delai_moyen_traitement_nc?: number | null
          delai_moyen_traitement_rec?: number | null
          id?: string
          mois: number
          nb_audits?: number
          nb_nc_cloturees?: number
          nb_nc_ouvertes?: number
          nb_rapports_emis?: number
          nb_reclamations?: number
          nb_reclamations_fondees?: number
          taux_conformite?: number | null
          taux_satisfaction?: number | null
          updated_at?: string
        }
        Update: {
          annee?: number
          commentaire?: string | null
          created_at?: string
          created_by?: string | null
          delai_moyen_traitement_nc?: number | null
          delai_moyen_traitement_rec?: number | null
          id?: string
          mois?: number
          nb_audits?: number
          nb_nc_cloturees?: number
          nb_nc_ouvertes?: number
          nb_rapports_emis?: number
          nb_reclamations?: number
          nb_reclamations_fondees?: number
          taux_conformite?: number | null
          taux_satisfaction?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      legacy_password_md5: {
        Row: {
          created_at: string
          email: string
          id: string
          legacy_user_id: number | null
          md5_hash: string
          rehashed: boolean
          rehashed_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          legacy_user_id?: number | null
          md5_hash: string
          rehashed?: boolean
          rehashed_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          legacy_user_id?: number | null
          md5_hash?: string
          rehashed?: boolean
          rehashed_at?: string | null
        }
        Relationships: []
      }
      lignes_avoir: {
        Row: {
          avoir_id: string
          created_at: string
          designation: string | null
          id: string
          ordre: number
          prix_unitaire: number | null
          quantite: number | null
          reference: string | null
          remise: number | null
          total_ht: number | null
          tva: number | null
        }
        Insert: {
          avoir_id: string
          created_at?: string
          designation?: string | null
          id?: string
          ordre?: number
          prix_unitaire?: number | null
          quantite?: number | null
          reference?: string | null
          remise?: number | null
          total_ht?: number | null
          tva?: number | null
        }
        Update: {
          avoir_id?: string
          created_at?: string
          designation?: string | null
          id?: string
          ordre?: number
          prix_unitaire?: number | null
          quantite?: number | null
          reference?: string | null
          remise?: number | null
          total_ht?: number | null
          tva?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lignes_avoir_avoir_id_fkey"
            columns: ["avoir_id"]
            isOneToOne: false
            referencedRelation: "avoirs"
            referencedColumns: ["id"]
          },
        ]
      }
      lignes_facture: {
        Row: {
          created_at: string
          designation: string | null
          facture_id: string
          id: string
          ordre: number
          prix_unitaire: number | null
          quantite: number | null
          reference: string | null
          remise: number | null
          total_ht: number | null
          tva: number | null
        }
        Insert: {
          created_at?: string
          designation?: string | null
          facture_id: string
          id?: string
          ordre?: number
          prix_unitaire?: number | null
          quantite?: number | null
          reference?: string | null
          remise?: number | null
          total_ht?: number | null
          tva?: number | null
        }
        Update: {
          created_at?: string
          designation?: string | null
          facture_id?: string
          id?: string
          ordre?: number
          prix_unitaire?: number | null
          quantite?: number | null
          reference?: string | null
          remise?: number | null
          total_ht?: number | null
          tva?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lignes_facture_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
        ]
      }
      lignes_pack_analyse: {
        Row: {
          catalogue_analyse_id: string | null
          created_at: string
          critere_id: string | null
          id: string
          ordre: number
          pack_analyse_id: string
        }
        Insert: {
          catalogue_analyse_id?: string | null
          created_at?: string
          critere_id?: string | null
          id?: string
          ordre?: number
          pack_analyse_id: string
        }
        Update: {
          catalogue_analyse_id?: string | null
          created_at?: string
          critere_id?: string | null
          id?: string
          ordre?: number
          pack_analyse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lignes_pack_analyse_catalogue_analyse_id_fkey"
            columns: ["catalogue_analyse_id"]
            isOneToOne: false
            referencedRelation: "catalogue_analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_pack_analyse_critere_id_fkey"
            columns: ["critere_id"]
            isOneToOne: false
            referencedRelation: "criteres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_pack_analyse_pack_analyse_id_fkey"
            columns: ["pack_analyse_id"]
            isOneToOne: false
            referencedRelation: "pack_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      lignes_reglement: {
        Row: {
          created_at: string
          date_facture: string | null
          facture_id: string
          fraction_reglee: number | null
          id: string
          net_a_payer: number | null
          ordre: number
          reglement_id: string
        }
        Insert: {
          created_at?: string
          date_facture?: string | null
          facture_id: string
          fraction_reglee?: number | null
          id?: string
          net_a_payer?: number | null
          ordre?: number
          reglement_id: string
        }
        Update: {
          created_at?: string
          date_facture?: string | null
          facture_id?: string
          fraction_reglee?: number | null
          id?: string
          net_a_payer?: number | null
          ordre?: number
          reglement_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lignes_reglement_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_reglement_reglement_id_fkey"
            columns: ["reglement_id"]
            isOneToOne: false
            referencedRelation: "reglements"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenances: {
        Row: {
          cout: number | null
          created_at: string
          created_by: string | null
          date_intervention: string
          description: string
          duree_arret_h: number | null
          equipement_id: string
          id: string
          intervenant: string | null
          observations: string | null
          type: Database["public"]["Enums"]["maintenance_type"]
        }
        Insert: {
          cout?: number | null
          created_at?: string
          created_by?: string | null
          date_intervention: string
          description: string
          duree_arret_h?: number | null
          equipement_id: string
          id?: string
          intervenant?: string | null
          observations?: string | null
          type?: Database["public"]["Enums"]["maintenance_type"]
        }
        Update: {
          cout?: number | null
          created_at?: string
          created_by?: string | null
          date_intervention?: string
          description?: string
          duree_arret_h?: number | null
          equipement_id?: string
          id?: string
          intervenant?: string | null
          observations?: string | null
          type?: Database["public"]["Enums"]["maintenance_type"]
        }
        Relationships: [
          {
            foreignKeyName: "maintenances_equipement_id_fkey"
            columns: ["equipement_id"]
            isOneToOne: false
            referencedRelation: "equipements"
            referencedColumns: ["id"]
          },
        ]
      }
      methodes_analyse: {
        Row: {
          accreditee: boolean
          code: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          libelle: string
          norme: string | null
          type_methode: string | null
          updated_at: string
        }
        Insert: {
          accreditee?: boolean
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          libelle: string
          norme?: string | null
          type_methode?: string | null
          updated_at?: string
        }
        Update: {
          accreditee?: boolean
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          libelle?: string
          norme?: string | null
          type_methode?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      milieu_origines: {
        Row: {
          code: string
          created_at: string
          date_reception: string | null
          date_sortie: string | null
          dlc: string | null
          id: string
          lot_fabricant: string | null
          quantite_base: number | null
          quantite_restante: number | null
          type_milieu_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          date_reception?: string | null
          date_sortie?: string | null
          dlc?: string | null
          id?: string
          lot_fabricant?: string | null
          quantite_base?: number | null
          quantite_restante?: number | null
          type_milieu_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          date_reception?: string | null
          date_sortie?: string | null
          dlc?: string | null
          id?: string
          lot_fabricant?: string | null
          quantite_base?: number | null
          quantite_restante?: number | null
          type_milieu_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "milieu_origines_type_milieu_id_fkey"
            columns: ["type_milieu_id"]
            isOneToOne: false
            referencedRelation: "type_milieux"
            referencedColumns: ["id"]
          },
        ]
      }
      milieux: {
        Row: {
          appareil_id: string | null
          code: string
          created_at: string
          date_preparation: string | null
          dlc: string | null
          id: string
          milieu_origine_id: string | null
          ph: number | null
          preparateur_id: string | null
          quantite: number | null
          test_negativite: boolean | null
          test_positivite: boolean | null
          test_sterilite: boolean | null
          updated_at: string
          volume: number | null
        }
        Insert: {
          appareil_id?: string | null
          code: string
          created_at?: string
          date_preparation?: string | null
          dlc?: string | null
          id?: string
          milieu_origine_id?: string | null
          ph?: number | null
          preparateur_id?: string | null
          quantite?: number | null
          test_negativite?: boolean | null
          test_positivite?: boolean | null
          test_sterilite?: boolean | null
          updated_at?: string
          volume?: number | null
        }
        Update: {
          appareil_id?: string | null
          code?: string
          created_at?: string
          date_preparation?: string | null
          dlc?: string | null
          id?: string
          milieu_origine_id?: string | null
          ph?: number | null
          preparateur_id?: string | null
          quantite?: number | null
          test_negativite?: boolean | null
          test_positivite?: boolean | null
          test_sterilite?: boolean | null
          updated_at?: string
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "milieux_milieu_origine_id_fkey"
            columns: ["milieu_origine_id"]
            isOneToOne: false
            referencedRelation: "milieu_origines"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_echantillons: {
        Row: {
          code_echantillon: string
          conditions_prelevement: string | null
          created_at: string
          designation: string
          id: string
          mission_id: string
          notes: string | null
          produit_id: string | null
          quantite: number | null
          unite_id: string | null
        }
        Insert: {
          code_echantillon: string
          conditions_prelevement?: string | null
          created_at?: string
          designation: string
          id?: string
          mission_id: string
          notes?: string | null
          produit_id?: string | null
          quantite?: number | null
          unite_id?: string | null
        }
        Update: {
          code_echantillon?: string
          conditions_prelevement?: string | null
          created_at?: string
          designation?: string
          id?: string
          mission_id?: string
          notes?: string | null
          produit_id?: string | null
          quantite?: number | null
          unite_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mission_echantillons_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_echantillons_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_echantillons_unite_id_fkey"
            columns: ["unite_id"]
            isOneToOne: false
            referencedRelation: "unites"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          bc_id: string | null
          bon: number | null
          client_id: string
          created_at: string
          created_by: string | null
          date_mission: string
          date_prevue: string | null
          frais: number | null
          id: string
          kilometrage_arrivee: number | null
          kilometrage_depart: number | null
          lieu: string | null
          moyen_locomotion_id: string | null
          notes: string | null
          numero: string
          objet: string | null
          preleveur_id: string | null
          statut: Database["public"]["Enums"]["mission_statut"]
          updated_at: string
        }
        Insert: {
          bc_id?: string | null
          bon?: number | null
          client_id: string
          created_at?: string
          created_by?: string | null
          date_mission?: string
          date_prevue?: string | null
          frais?: number | null
          id?: string
          kilometrage_arrivee?: number | null
          kilometrage_depart?: number | null
          lieu?: string | null
          moyen_locomotion_id?: string | null
          notes?: string | null
          numero: string
          objet?: string | null
          preleveur_id?: string | null
          statut?: Database["public"]["Enums"]["mission_statut"]
          updated_at?: string
        }
        Update: {
          bc_id?: string | null
          bon?: number | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          date_mission?: string
          date_prevue?: string | null
          frais?: number | null
          id?: string
          kilometrage_arrivee?: number | null
          kilometrage_depart?: number | null
          lieu?: string | null
          moyen_locomotion_id?: string | null
          notes?: string | null
          numero?: string
          objet?: string | null
          preleveur_id?: string | null
          statut?: Database["public"]["Enums"]["mission_statut"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "missions_bc_id_fkey"
            columns: ["bc_id"]
            isOneToOne: false
            referencedRelation: "bons_commande"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_moyen_locomotion_id_fkey"
            columns: ["moyen_locomotion_id"]
            isOneToOne: false
            referencedRelation: "moyens_locomotion"
            referencedColumns: ["id"]
          },
        ]
      }
      modes_reglement: {
        Row: {
          code: string
          created_at: string
          id: string
          libelle: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          libelle?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          libelle?: string | null
        }
        Relationships: []
      }
      moyens_locomotion: {
        Row: {
          code: string
          created_at: string
          id: string
          immatriculation: string | null
          is_active: boolean | null
          libelle: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          immatriculation?: string | null
          is_active?: boolean | null
          libelle?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          immatriculation?: string | null
          is_active?: boolean | null
          libelle?: string | null
        }
        Relationships: []
      }
      nature_analyses: {
        Row: {
          code: string
          created_at: string
          id: string
          libelle: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          libelle: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          libelle?: string
        }
        Relationships: []
      }
      nature_criteres: {
        Row: {
          code: string
          created_at: string
          has_max: boolean | null
          has_min: boolean | null
          id: string
          libelle: string | null
        }
        Insert: {
          code: string
          created_at?: string
          has_max?: boolean | null
          has_min?: boolean | null
          id?: string
          libelle?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          has_max?: boolean | null
          has_min?: boolean | null
          id?: string
          libelle?: string | null
        }
        Relationships: []
      }
      non_conformites: {
        Row: {
          action_immediate: string | null
          analyse_id: string | null
          cause_racine: string | null
          client_id: string | null
          commentaire_cloture: string | null
          created_at: string
          created_by: string | null
          date_cloture: string | null
          date_detection: string
          description: string
          detectee_par: string | null
          efficacite_verifiee: boolean | null
          equipement_ref: string | null
          gravite: Database["public"]["Enums"]["nc_gravite"]
          id: string
          impact: string | null
          methode_id: string | null
          numero: string
          origine: string | null
          prelevement_id: string | null
          responsable_id: string | null
          service: string | null
          source: Database["public"]["Enums"]["nc_source"]
          statut: Database["public"]["Enums"]["nc_statut"]
          titre: string
          updated_at: string
        }
        Insert: {
          action_immediate?: string | null
          analyse_id?: string | null
          cause_racine?: string | null
          client_id?: string | null
          commentaire_cloture?: string | null
          created_at?: string
          created_by?: string | null
          date_cloture?: string | null
          date_detection?: string
          description: string
          detectee_par?: string | null
          efficacite_verifiee?: boolean | null
          equipement_ref?: string | null
          gravite?: Database["public"]["Enums"]["nc_gravite"]
          id?: string
          impact?: string | null
          methode_id?: string | null
          numero: string
          origine?: string | null
          prelevement_id?: string | null
          responsable_id?: string | null
          service?: string | null
          source?: Database["public"]["Enums"]["nc_source"]
          statut?: Database["public"]["Enums"]["nc_statut"]
          titre: string
          updated_at?: string
        }
        Update: {
          action_immediate?: string | null
          analyse_id?: string | null
          cause_racine?: string | null
          client_id?: string | null
          commentaire_cloture?: string | null
          created_at?: string
          created_by?: string | null
          date_cloture?: string | null
          date_detection?: string
          description?: string
          detectee_par?: string | null
          efficacite_verifiee?: boolean | null
          equipement_ref?: string | null
          gravite?: Database["public"]["Enums"]["nc_gravite"]
          id?: string
          impact?: string | null
          methode_id?: string | null
          numero?: string
          origine?: string | null
          prelevement_id?: string | null
          responsable_id?: string | null
          service?: string | null
          source?: Database["public"]["Enums"]["nc_source"]
          statut?: Database["public"]["Enums"]["nc_statut"]
          titre?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_rules: {
        Row: {
          actif: boolean
          canal_email: boolean
          canal_in_app: boolean
          conditions: Json | null
          created_at: string
          delai_minutes: number | null
          destinataires_roles: string[] | null
          destinataires_users: string[] | null
          evenement: string
          id: string
          libelle: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          canal_email?: boolean
          canal_in_app?: boolean
          conditions?: Json | null
          created_at?: string
          delai_minutes?: number | null
          destinataires_roles?: string[] | null
          destinataires_users?: string[] | null
          evenement: string
          id?: string
          libelle: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          canal_email?: boolean
          canal_in_app?: boolean
          conditions?: Json | null
          created_at?: string
          delai_minutes?: number | null
          destinataires_roles?: string[] | null
          destinataires_users?: string[] | null
          evenement?: string
          id?: string
          libelle?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          level: string
          link: string | null
          message: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          level?: string
          link?: string | null
          message?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          level?: string
          link?: string | null
          message?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      numbering_sequences: {
        Row: {
          code: string
          created_at: string
          current_value: number
          current_year: number
          format_template: string
          id: string
          label: string
          padding: number
          prefix: string
          suffix: string
          tenant_id: string | null
          updated_at: string
          year_reset: boolean
        }
        Insert: {
          code: string
          created_at?: string
          current_value?: number
          current_year?: number
          format_template?: string
          id?: string
          label: string
          padding?: number
          prefix?: string
          suffix?: string
          tenant_id?: string | null
          updated_at?: string
          year_reset?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          current_value?: number
          current_year?: number
          format_template?: string
          id?: string
          label?: string
          padding?: number
          prefix?: string
          suffix?: string
          tenant_id?: string | null
          updated_at?: string
          year_reset?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "numbering_sequences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pack_analyses: {
        Row: {
          avec_declaration_conformite: boolean | null
          code: string
          created_at: string
          id: string
          is_active: boolean | null
          libelle: string | null
          note_pour_criteres: string | null
          origine: string | null
          reference_critere: string | null
          tableau_resultats: string | null
          updated_at: string
        }
        Insert: {
          avec_declaration_conformite?: boolean | null
          code: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          libelle?: string | null
          note_pour_criteres?: string | null
          origine?: string | null
          reference_critere?: string | null
          tableau_resultats?: string | null
          updated_at?: string
        }
        Update: {
          avec_declaration_conformite?: boolean | null
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          libelle?: string | null
          note_pour_criteres?: string | null
          origine?: string | null
          reference_critere?: string | null
          tableau_resultats?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      parametres_analyse: {
        Row: {
          code: string | null
          created_at: string
          delai_jours: number | null
          id: string
          is_active: boolean
          libelle: string
          methode_id: string | null
          prix_unitaire: number
          seuil_max: number | null
          seuil_min: number | null
          unite_id: string | null
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          delai_jours?: number | null
          id?: string
          is_active?: boolean
          libelle: string
          methode_id?: string | null
          prix_unitaire?: number
          seuil_max?: number | null
          seuil_min?: number | null
          unite_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          delai_jours?: number | null
          id?: string
          is_active?: boolean
          libelle?: string
          methode_id?: string | null
          prix_unitaire?: number
          seuil_max?: number | null
          seuil_min?: number | null
          unite_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parametres_analyse_methode_id_fkey"
            columns: ["methode_id"]
            isOneToOne: false
            referencedRelation: "methodes_analyse"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parametres_analyse_unite_id_fkey"
            columns: ["unite_id"]
            isOneToOne: false
            referencedRelation: "unites"
            referencedColumns: ["id"]
          },
        ]
      }
      pointages: {
        Row: {
          absent: boolean
          created_at: string
          date_pointage: string
          employe_id: string
          heure_arrivee: string | null
          heure_depart: string | null
          heures_supp: number | null
          heures_travaillees: number | null
          id: string
          motif_absence: string | null
          notes: string | null
        }
        Insert: {
          absent?: boolean
          created_at?: string
          date_pointage: string
          employe_id: string
          heure_arrivee?: string | null
          heure_depart?: string | null
          heures_supp?: number | null
          heures_travaillees?: number | null
          id?: string
          motif_absence?: string | null
          notes?: string | null
        }
        Update: {
          absent?: boolean
          created_at?: string
          date_pointage?: string
          employe_id?: string
          heure_arrivee?: string | null
          heure_depart?: string | null
          heures_supp?: number | null
          heures_travaillees?: number | null
          id?: string
          motif_absence?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pointages_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
        ]
      }
      prelevements: {
        Row: {
          client_id: string
          code_barre: string | null
          conclusion: string | null
          conditions: string | null
          conformite: boolean | null
          created_at: string
          created_by: string | null
          date_prelevement: string
          date_reception: string | null
          denomination: string | null
          df: string | null
          dlc: string | null
          echantillon_id: string | null
          famille_id: string | null
          fournisseur: string | null
          id: string
          lieu: string | null
          lot: string | null
          mission_id: string | null
          mode_acheminement: string | null
          mode_conservation: string | null
          numero: string
          observations: string | null
          pack_analyse_id: string | null
          preleveur_nom: string | null
          referentiel_id: string | null
          region_critere_id: string | null
          remarque_non_conformite: string | null
          scanne_at: string | null
          scanne_by: string | null
          secteur: string | null
          statut: Database["public"]["Enums"]["prelevement_statut"]
          temperature: number | null
          tp_ambiante: number | null
          tp_produit: number | null
          updated_at: string
          validateur_id: string | null
          verifie_at: string | null
          verifie_by: string | null
          version: string | null
        }
        Insert: {
          client_id: string
          code_barre?: string | null
          conclusion?: string | null
          conditions?: string | null
          conformite?: boolean | null
          created_at?: string
          created_by?: string | null
          date_prelevement?: string
          date_reception?: string | null
          denomination?: string | null
          df?: string | null
          dlc?: string | null
          echantillon_id?: string | null
          famille_id?: string | null
          fournisseur?: string | null
          id?: string
          lieu?: string | null
          lot?: string | null
          mission_id?: string | null
          mode_acheminement?: string | null
          mode_conservation?: string | null
          numero: string
          observations?: string | null
          pack_analyse_id?: string | null
          preleveur_nom?: string | null
          referentiel_id?: string | null
          region_critere_id?: string | null
          remarque_non_conformite?: string | null
          scanne_at?: string | null
          scanne_by?: string | null
          secteur?: string | null
          statut?: Database["public"]["Enums"]["prelevement_statut"]
          temperature?: number | null
          tp_ambiante?: number | null
          tp_produit?: number | null
          updated_at?: string
          validateur_id?: string | null
          verifie_at?: string | null
          verifie_by?: string | null
          version?: string | null
        }
        Update: {
          client_id?: string
          code_barre?: string | null
          conclusion?: string | null
          conditions?: string | null
          conformite?: boolean | null
          created_at?: string
          created_by?: string | null
          date_prelevement?: string
          date_reception?: string | null
          denomination?: string | null
          df?: string | null
          dlc?: string | null
          echantillon_id?: string | null
          famille_id?: string | null
          fournisseur?: string | null
          id?: string
          lieu?: string | null
          lot?: string | null
          mission_id?: string | null
          mode_acheminement?: string | null
          mode_conservation?: string | null
          numero?: string
          observations?: string | null
          pack_analyse_id?: string | null
          preleveur_nom?: string | null
          referentiel_id?: string | null
          region_critere_id?: string | null
          remarque_non_conformite?: string | null
          scanne_at?: string | null
          scanne_by?: string | null
          secteur?: string | null
          statut?: Database["public"]["Enums"]["prelevement_statut"]
          temperature?: number | null
          tp_ambiante?: number | null
          tp_produit?: number | null
          updated_at?: string
          validateur_id?: string | null
          verifie_at?: string | null
          verifie_by?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prelevements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prelevements_echantillon_id_fkey"
            columns: ["echantillon_id"]
            isOneToOne: false
            referencedRelation: "mission_echantillons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prelevements_famille_id_fkey"
            columns: ["famille_id"]
            isOneToOne: false
            referencedRelation: "familles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prelevements_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prelevements_pack_analyse_id_fkey"
            columns: ["pack_analyse_id"]
            isOneToOne: false
            referencedRelation: "pack_analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prelevements_referentiel_id_fkey"
            columns: ["referentiel_id"]
            isOneToOne: false
            referencedRelation: "referentiels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prelevements_region_critere_id_fkey"
            columns: ["region_critere_id"]
            isOneToOne: false
            referencedRelation: "region_criteres"
            referencedColumns: ["id"]
          },
        ]
      }
      produits: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          libelle: string
          matrice: Database["public"]["Enums"]["type_matrice"]
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          libelle: string
          matrice?: Database["public"]["Enums"]["type_matrice"]
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          libelle?: string
          matrice?: Database["public"]["Enums"]["type_matrice"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          client_id: string | null
          created_at: string
          email: string
          first_name: string | null
          fonction: string | null
          id: string
          is_active: boolean
          last_login_at: string | null
          last_name: string | null
          legacy_user_id: number | null
          matricule: string | null
          phone: string | null
          service: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          fonction?: string | null
          id: string
          is_active?: boolean
          last_login_at?: string | null
          last_name?: string | null
          legacy_user_id?: number | null
          matricule?: string | null
          phone?: string | null
          service?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          fonction?: string | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          last_name?: string | null
          legacy_user_id?: number | null
          matricule?: string | null
          phone?: string | null
          service?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      projet_taches: {
        Row: {
          assigne_id: string | null
          created_at: string
          created_by: string | null
          date_debut: string | null
          date_echeance: string | null
          date_fin: string | null
          description: string | null
          id: string
          ordre: number
          priorite: Database["public"]["Enums"]["tache_priorite"]
          projet_id: string
          statut: Database["public"]["Enums"]["tache_statut"]
          titre: string
          updated_at: string
        }
        Insert: {
          assigne_id?: string | null
          created_at?: string
          created_by?: string | null
          date_debut?: string | null
          date_echeance?: string | null
          date_fin?: string | null
          description?: string | null
          id?: string
          ordre?: number
          priorite?: Database["public"]["Enums"]["tache_priorite"]
          projet_id: string
          statut?: Database["public"]["Enums"]["tache_statut"]
          titre: string
          updated_at?: string
        }
        Update: {
          assigne_id?: string | null
          created_at?: string
          created_by?: string | null
          date_debut?: string | null
          date_echeance?: string | null
          date_fin?: string | null
          description?: string | null
          id?: string
          ordre?: number
          priorite?: Database["public"]["Enums"]["tache_priorite"]
          projet_id?: string
          statut?: Database["public"]["Enums"]["tache_statut"]
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projet_taches_projet_id_fkey"
            columns: ["projet_id"]
            isOneToOne: false
            referencedRelation: "projets"
            referencedColumns: ["id"]
          },
        ]
      }
      projets: {
        Row: {
          avancement_pct: number
          budget: number | null
          client_id: string | null
          cout_reel: number | null
          created_at: string
          created_by: string | null
          date_debut: string | null
          date_fin_prevue: string | null
          date_fin_reelle: string | null
          description: string | null
          id: string
          nom: string
          notes: string | null
          numero: string
          responsable_id: string | null
          statut: Database["public"]["Enums"]["projet_statut"]
          updated_at: string
        }
        Insert: {
          avancement_pct?: number
          budget?: number | null
          client_id?: string | null
          cout_reel?: number | null
          created_at?: string
          created_by?: string | null
          date_debut?: string | null
          date_fin_prevue?: string | null
          date_fin_reelle?: string | null
          description?: string | null
          id?: string
          nom: string
          notes?: string | null
          numero: string
          responsable_id?: string | null
          statut?: Database["public"]["Enums"]["projet_statut"]
          updated_at?: string
        }
        Update: {
          avancement_pct?: number
          budget?: number | null
          client_id?: string | null
          cout_reel?: number | null
          created_at?: string
          created_by?: string | null
          date_debut?: string | null
          date_fin_prevue?: string | null
          date_fin_reelle?: string | null
          description?: string | null
          id?: string
          nom?: string
          notes?: string | null
          numero?: string
          responsable_id?: string | null
          statut?: Database["public"]["Enums"]["projet_statut"]
          updated_at?: string
        }
        Relationships: []
      }
      rapport_analyses: {
        Row: {
          analyse_id: string
          created_at: string
          id: string
          ordre: number
          rapport_id: string
        }
        Insert: {
          analyse_id: string
          created_at?: string
          id?: string
          ordre?: number
          rapport_id: string
        }
        Update: {
          analyse_id?: string
          created_at?: string
          id?: string
          ordre?: number
          rapport_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rapport_analyses_analyse_id_fkey"
            columns: ["analyse_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rapport_analyses_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "rapports"
            referencedColumns: ["id"]
          },
        ]
      }
      rapports: {
        Row: {
          bc_id: string | null
          client_id: string
          conclusion: string | null
          created_at: string
          created_by: string | null
          date_rapport: string
          envoye_at: string | null
          envoye_par: string | null
          id: string
          numero: string
          pdf_path: string | null
          statut: Database["public"]["Enums"]["rapport_statut"]
          titre: string
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          bc_id?: string | null
          client_id: string
          conclusion?: string | null
          created_at?: string
          created_by?: string | null
          date_rapport?: string
          envoye_at?: string | null
          envoye_par?: string | null
          id?: string
          numero: string
          pdf_path?: string | null
          statut?: Database["public"]["Enums"]["rapport_statut"]
          titre: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          bc_id?: string | null
          client_id?: string
          conclusion?: string | null
          created_at?: string
          created_by?: string | null
          date_rapport?: string
          envoye_at?: string | null
          envoye_par?: string | null
          id?: string
          numero?: string
          pdf_path?: string | null
          statut?: Database["public"]["Enums"]["rapport_statut"]
          titre?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rapports_bc_id_fkey"
            columns: ["bc_id"]
            isOneToOne: false
            referencedRelation: "bons_commande"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rapports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      reactif_mouvements: {
        Row: {
          analyse_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          quantite: number
          reactif_id: string
          type_mouvement: string
          user_id: string | null
        }
        Insert: {
          analyse_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          quantite: number
          reactif_id: string
          type_mouvement: string
          user_id?: string | null
        }
        Update: {
          analyse_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          quantite?: number
          reactif_id?: string
          type_mouvement?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reactif_mouvements_analyse_id_fkey"
            columns: ["analyse_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactif_mouvements_reactif_id_fkey"
            columns: ["reactif_id"]
            isOneToOne: false
            referencedRelation: "reactifs"
            referencedColumns: ["id"]
          },
        ]
      }
      reactifs: {
        Row: {
          code: string
          created_at: string | null
          date_ouverture: string | null
          date_peremption: string | null
          date_reception: string | null
          emplacement: string | null
          fds_url: string | null
          fournisseur: string | null
          id: string
          is_actif: boolean | null
          nom: string
          notes: string | null
          numero_lot: string | null
          quantite_actuelle: number | null
          quantite_initiale: number | null
          seuil_alerte: number | null
          temperature_stockage: string | null
          tenant_id: string | null
          unite: string | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          date_ouverture?: string | null
          date_peremption?: string | null
          date_reception?: string | null
          emplacement?: string | null
          fds_url?: string | null
          fournisseur?: string | null
          id?: string
          is_actif?: boolean | null
          nom: string
          notes?: string | null
          numero_lot?: string | null
          quantite_actuelle?: number | null
          quantite_initiale?: number | null
          seuil_alerte?: number | null
          temperature_stockage?: string | null
          tenant_id?: string | null
          unite?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          date_ouverture?: string | null
          date_peremption?: string | null
          date_reception?: string | null
          emplacement?: string | null
          fds_url?: string | null
          fournisseur?: string | null
          id?: string
          is_actif?: boolean | null
          nom?: string
          notes?: string | null
          numero_lot?: string | null
          quantite_actuelle?: number | null
          quantite_initiale?: number | null
          seuil_alerte?: number | null
          temperature_stockage?: string | null
          tenant_id?: string | null
          unite?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reactifs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reclamations: {
        Row: {
          analyse_id: string | null
          bc_id: string | null
          canal: Database["public"]["Enums"]["reclamation_canal"]
          client_id: string
          contact_email: string | null
          contact_nom: string | null
          contact_telephone: string | null
          created_at: string
          created_by: string | null
          date_accuse: string | null
          date_cloture: string | null
          date_reception: string
          date_reponse: string | null
          description: string
          fondee: boolean | null
          id: string
          nc_id: string | null
          numero: string
          objet: string
          rapport_id: string | null
          reponse: string | null
          responsable_id: string | null
          satisfaction_client: number | null
          statut: Database["public"]["Enums"]["reclamation_statut"]
          updated_at: string
        }
        Insert: {
          analyse_id?: string | null
          bc_id?: string | null
          canal?: Database["public"]["Enums"]["reclamation_canal"]
          client_id: string
          contact_email?: string | null
          contact_nom?: string | null
          contact_telephone?: string | null
          created_at?: string
          created_by?: string | null
          date_accuse?: string | null
          date_cloture?: string | null
          date_reception?: string
          date_reponse?: string | null
          description: string
          fondee?: boolean | null
          id?: string
          nc_id?: string | null
          numero: string
          objet: string
          rapport_id?: string | null
          reponse?: string | null
          responsable_id?: string | null
          satisfaction_client?: number | null
          statut?: Database["public"]["Enums"]["reclamation_statut"]
          updated_at?: string
        }
        Update: {
          analyse_id?: string | null
          bc_id?: string | null
          canal?: Database["public"]["Enums"]["reclamation_canal"]
          client_id?: string
          contact_email?: string | null
          contact_nom?: string | null
          contact_telephone?: string | null
          created_at?: string
          created_by?: string | null
          date_accuse?: string | null
          date_cloture?: string | null
          date_reception?: string
          date_reponse?: string | null
          description?: string
          fondee?: boolean | null
          id?: string
          nc_id?: string | null
          numero?: string
          objet?: string
          rapport_id?: string | null
          reponse?: string | null
          responsable_id?: string | null
          satisfaction_client?: number | null
          statut?: Database["public"]["Enums"]["reclamation_statut"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reclamations_nc_id_fkey"
            columns: ["nc_id"]
            isOneToOne: false
            referencedRelation: "non_conformites"
            referencedColumns: ["id"]
          },
        ]
      }
      referentiels: {
        Row: {
          code: string
          created_at: string
          id: string
          libelle: string | null
          organisme: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          libelle?: string | null
          organisme?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          libelle?: string | null
          organisme?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      region_criteres: {
        Row: {
          code: string
          created_at: string
          id: string
          libelle: string | null
          referentiel_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          libelle?: string | null
          referentiel_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          libelle?: string | null
          referentiel_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "region_criteres_referentiel_id_fkey"
            columns: ["referentiel_id"]
            isOneToOne: false
            referencedRelation: "referentiels"
            referencedColumns: ["id"]
          },
        ]
      }
      reglements: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          date_effective: string | null
          date_paiement: string | null
          date_versement: string | null
          etablissement_payeur: string | null
          id: string
          mode_reglement_id: string | null
          montant: number
          numero: string
          payeur: string | null
          reference: string | null
          solde_actuel: number | null
          solde_precedent: number | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          date_effective?: string | null
          date_paiement?: string | null
          date_versement?: string | null
          etablissement_payeur?: string | null
          id?: string
          mode_reglement_id?: string | null
          montant?: number
          numero: string
          payeur?: string | null
          reference?: string | null
          solde_actuel?: number | null
          solde_precedent?: number | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          date_effective?: string | null
          date_paiement?: string | null
          date_versement?: string | null
          etablissement_payeur?: string | null
          id?: string
          mode_reglement_id?: string | null
          montant?: number
          numero?: string
          payeur?: string | null
          reference?: string | null
          solde_actuel?: number | null
          solde_precedent?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reglements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reglements_mode_reglement_id_fkey"
            columns: ["mode_reglement_id"]
            isOneToOne: false
            referencedRelation: "modes_reglement"
            referencedColumns: ["id"]
          },
        ]
      }
      relances: {
        Row: {
          client_id: string | null
          contenu: string | null
          created_at: string
          created_by: string | null
          date_envoi: string
          facture_id: string | null
          id: string
          mode: string
          montant_relance: number | null
          niveau: number
          numero: string
          statut: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          contenu?: string | null
          created_at?: string
          created_by?: string | null
          date_envoi?: string
          facture_id?: string | null
          id?: string
          mode?: string
          montant_relance?: number | null
          niveau?: number
          numero: string
          statut?: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          contenu?: string | null
          created_at?: string
          created_by?: string | null
          date_envoi?: string
          facture_id?: string | null
          id?: string
          mode?: string
          montant_relance?: number | null
          niveau?: number
          numero?: string
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "relances_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relances_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
        ]
      }
      releves_sonde: {
        Row: {
          batterie_pct: number | null
          conformite: boolean | null
          created_at: string
          id: string
          mesure: number
          mesuree_at: string
          payload: Json | null
          signal_pct: number | null
          sonde_id: string
        }
        Insert: {
          batterie_pct?: number | null
          conformite?: boolean | null
          created_at?: string
          id?: string
          mesure: number
          mesuree_at?: string
          payload?: Json | null
          signal_pct?: number | null
          sonde_id: string
        }
        Update: {
          batterie_pct?: number | null
          conformite?: boolean | null
          created_at?: string
          id?: string
          mesure?: number
          mesuree_at?: string
          payload?: Json | null
          signal_pct?: number | null
          sonde_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "releves_sonde_sonde_id_fkey"
            columns: ["sonde_id"]
            isOneToOne: false
            referencedRelation: "sondes"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations_equipement: {
        Row: {
          created_at: string
          created_by: string | null
          date_debut: string
          date_fin: string
          equipement_id: string
          id: string
          motif: string | null
          notes: string | null
          numero: string
          statut: string
          updated_at: string
          utilisateur_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date_debut: string
          date_fin: string
          equipement_id: string
          id?: string
          motif?: string | null
          notes?: string | null
          numero: string
          statut?: string
          updated_at?: string
          utilisateur_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date_debut?: string
          date_fin?: string
          equipement_id?: string
          id?: string
          motif?: string | null
          notes?: string | null
          numero?: string
          statut?: string
          updated_at?: string
          utilisateur_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_equipement_equipement_id_fkey"
            columns: ["equipement_id"]
            isOneToOne: false
            referencedRelation: "equipements"
            referencedColumns: ["id"]
          },
        ]
      }
      revues_direction: {
        Row: {
          axes_amelioration: string | null
          bilan_audits: string | null
          bilan_nc: string | null
          bilan_qualite: string | null
          bilan_reclamations: string | null
          bilan_satisfaction: string | null
          created_at: string
          created_by: string | null
          date_revue: string
          decisions: string | null
          id: string
          numero: string
          ordre_du_jour: string | null
          participants: string | null
          responsable_id: string | null
          ressources_necessaires: string | null
          statut: Database["public"]["Enums"]["revue_statut"]
          titre: string
          updated_at: string
        }
        Insert: {
          axes_amelioration?: string | null
          bilan_audits?: string | null
          bilan_nc?: string | null
          bilan_qualite?: string | null
          bilan_reclamations?: string | null
          bilan_satisfaction?: string | null
          created_at?: string
          created_by?: string | null
          date_revue?: string
          decisions?: string | null
          id?: string
          numero: string
          ordre_du_jour?: string | null
          participants?: string | null
          responsable_id?: string | null
          ressources_necessaires?: string | null
          statut?: Database["public"]["Enums"]["revue_statut"]
          titre: string
          updated_at?: string
        }
        Update: {
          axes_amelioration?: string | null
          bilan_audits?: string | null
          bilan_nc?: string | null
          bilan_qualite?: string | null
          bilan_reclamations?: string | null
          bilan_satisfaction?: string | null
          created_at?: string
          created_by?: string | null
          date_revue?: string
          decisions?: string | null
          id?: string
          numero?: string
          ordre_du_jour?: string | null
          participants?: string | null
          responsable_id?: string | null
          ressources_necessaires?: string | null
          statut?: Database["public"]["Enums"]["revue_statut"]
          titre?: string
          updated_at?: string
        }
        Relationships: []
      }
      sondes: {
        Row: {
          api_key_hash: string | null
          code: string
          created_at: string
          created_by: string | null
          equipement_id: string | null
          fournisseur: string | null
          id: string
          intervalle_minutes: number
          is_active: boolean
          last_batterie: number | null
          last_mesure: number | null
          last_releve_at: string | null
          libelle: string
          localisation: string | null
          modele: string | null
          seuil_max: number | null
          seuil_min: number | null
          type: Database["public"]["Enums"]["sonde_type"]
          unite: string
          updated_at: string
        }
        Insert: {
          api_key_hash?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          equipement_id?: string | null
          fournisseur?: string | null
          id?: string
          intervalle_minutes?: number
          is_active?: boolean
          last_batterie?: number | null
          last_mesure?: number | null
          last_releve_at?: string | null
          libelle: string
          localisation?: string | null
          modele?: string | null
          seuil_max?: number | null
          seuil_min?: number | null
          type?: Database["public"]["Enums"]["sonde_type"]
          unite?: string
          updated_at?: string
        }
        Update: {
          api_key_hash?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          equipement_id?: string | null
          fournisseur?: string | null
          id?: string
          intervalle_minutes?: number
          is_active?: boolean
          last_batterie?: number | null
          last_mesure?: number | null
          last_releve_at?: string | null
          libelle?: string
          localisation?: string | null
          modele?: string | null
          seuil_max?: number | null
          seuil_min?: number | null
          type?: Database["public"]["Enums"]["sonde_type"]
          unite?: string
          updated_at?: string
        }
        Relationships: []
      }
      super_familles: {
        Row: {
          code: string
          created_at: string
          groupe_date_analyse: string | null
          id: string
          libelle: string | null
          ordre: number
          prix_defaut: number | null
        }
        Insert: {
          code: string
          created_at?: string
          groupe_date_analyse?: string | null
          id?: string
          libelle?: string | null
          ordre?: number
          prix_defaut?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          groupe_date_analyse?: string | null
          id?: string
          libelle?: string | null
          ordre?: number
          prix_defaut?: number | null
        }
        Relationships: []
      }
      tenant_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          tenant_id: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          tenant_id: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          tenant_id?: string
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "tenant_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          adresse: string | null
          code_postal: string | null
          couleur_primaire: string | null
          couleur_secondaire: string | null
          created_at: string
          email: string | null
          favicon_url: string | null
          format_date: string | null
          fuseau: string | null
          id: string
          is_active: boolean
          langue: string | null
          logo_url: string | null
          matricule_fiscal: string | null
          mentions_legales: string | null
          monnaie: string | null
          nom: string
          pays: string | null
          retenue_source: number | null
          rib: string | null
          signature_scan_url: string | null
          site_web: string | null
          slug: string
          telephone: string | null
          timbre_fiscal: number | null
          tva_defaut: number | null
          updated_at: string
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          code_postal?: string | null
          couleur_primaire?: string | null
          couleur_secondaire?: string | null
          created_at?: string
          email?: string | null
          favicon_url?: string | null
          format_date?: string | null
          fuseau?: string | null
          id?: string
          is_active?: boolean
          langue?: string | null
          logo_url?: string | null
          matricule_fiscal?: string | null
          mentions_legales?: string | null
          monnaie?: string | null
          nom: string
          pays?: string | null
          retenue_source?: number | null
          rib?: string | null
          signature_scan_url?: string | null
          site_web?: string | null
          slug: string
          telephone?: string | null
          timbre_fiscal?: number | null
          tva_defaut?: number | null
          updated_at?: string
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          code_postal?: string | null
          couleur_primaire?: string | null
          couleur_secondaire?: string | null
          created_at?: string
          email?: string | null
          favicon_url?: string | null
          format_date?: string | null
          fuseau?: string | null
          id?: string
          is_active?: boolean
          langue?: string | null
          logo_url?: string | null
          matricule_fiscal?: string | null
          mentions_legales?: string | null
          monnaie?: string | null
          nom?: string
          pays?: string | null
          retenue_source?: number | null
          rib?: string | null
          signature_scan_url?: string | null
          site_web?: string | null
          slug?: string
          telephone?: string | null
          timbre_fiscal?: number | null
          tva_defaut?: number | null
          updated_at?: string
          ville?: string | null
        }
        Relationships: []
      }
      type_analyses: {
        Row: {
          code: string
          created_at: string
          format_texte_rapport: string | null
          id: string
          libelle: string | null
          nature_analyse_id: string | null
          nombre_decimales: number | null
          ordre: number
        }
        Insert: {
          code: string
          created_at?: string
          format_texte_rapport?: string | null
          id?: string
          libelle?: string | null
          nature_analyse_id?: string | null
          nombre_decimales?: number | null
          ordre?: number
        }
        Update: {
          code?: string
          created_at?: string
          format_texte_rapport?: string | null
          id?: string
          libelle?: string | null
          nature_analyse_id?: string | null
          nombre_decimales?: number | null
          ordre?: number
        }
        Relationships: [
          {
            foreignKeyName: "type_analyses_nature_analyse_id_fkey"
            columns: ["nature_analyse_id"]
            isOneToOne: false
            referencedRelation: "nature_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      type_milieux: {
        Row: {
          code: string
          created_at: string
          id: string
          libelle: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          libelle?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          libelle?: string | null
        }
        Relationships: []
      }
      type_prelevements: {
        Row: {
          categorie: string | null
          champs_specifiques: Json
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          libelle: string
          updated_at: string
        }
        Insert: {
          categorie?: string | null
          champs_specifiques?: Json
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          libelle: string
          updated_at?: string
        }
        Update: {
          categorie?: string | null
          champs_specifiques?: Json
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          libelle?: string
          updated_at?: string
        }
        Relationships: []
      }
      unites: {
        Row: {
          code: string
          created_at: string
          id: string
          libelle: string
          symbole: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          libelle: string
          symbole: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          libelle?: string
          symbole?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      validations: {
        Row: {
          commentaire: string | null
          created_at: string
          decision: string
          entity_id: string
          entity_type: string
          id: string
          niveau: Database["public"]["Enums"]["niveau_validation"]
          validateur_id: string
        }
        Insert: {
          commentaire?: string | null
          created_at?: string
          decision: string
          entity_id: string
          entity_type: string
          id?: string
          niveau: Database["public"]["Enums"]["niveau_validation"]
          validateur_id: string
        }
        Update: {
          commentaire?: string | null
          created_at?: string
          decision?: string
          entity_id?: string
          entity_type?: string
          id?: string
          niveau?: Database["public"]["Enums"]["niveau_validation"]
          validateur_id?: string
        }
        Relationships: []
      }
      validations_rapport: {
        Row: {
          commentaire: string | null
          created_at: string | null
          id: string
          niveau: string
          rapport_id: string
          signature_hash: string | null
          signature_ip: string | null
          signed_at: string | null
          statut: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          commentaire?: string | null
          created_at?: string | null
          id?: string
          niveau: string
          rapport_id: string
          signature_hash?: string | null
          signature_ip?: string | null
          signed_at?: string | null
          statut?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          commentaire?: string | null
          created_at?: string | null
          id?: string
          niveau?: string
          rapport_id?: string
          signature_hash?: string | null
          signature_ip?: string | null
          signed_at?: string | null
          statut?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "validations_rapport_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "rapports"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      convert_devis_to_bc: { Args: { _devis_id: string }; Returns: string }
      current_tenant_id: { Args: never; Returns: string }
      current_user_client_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      next_numero: { Args: { _code: string }; Returns: string }
    }
    Enums: {
      alerte_sonde_type:
        | "hors_seuil_haut"
        | "hors_seuil_bas"
        | "hors_ligne"
        | "batterie_faible"
      analyse_statut:
        | "a_faire"
        | "en_cours"
        | "termine"
        | "valide_tech"
        | "valide_chef"
        | "valide_qualite"
        | "rejete"
      app_role:
        | "admin"
        | "direction"
        | "commercial"
        | "chef_labo"
        | "technicien"
        | "qualite"
        | "comptable"
        | "rh"
        | "client"
      audit_statut:
        | "planifie"
        | "en_cours"
        | "realise"
        | "rapport_diffuse"
        | "cloture"
      audit_type:
        | "interne"
        | "externe"
        | "fournisseur"
        | "accreditation"
        | "suivi"
      bc_statut:
        | "brouillon"
        | "envoye"
        | "accepte"
        | "refuse"
        | "en_cours"
        | "cloture"
        | "annule"
      capa_statut:
        | "planifiee"
        | "en_cours"
        | "realisee"
        | "verifiee"
        | "cloturee"
        | "abandonnee"
      capa_type: "corrective" | "preventive" | "immediate" | "amelioration"
      conge_statut: "demande" | "approuve" | "refuse" | "annule"
      conge_type:
        | "annuel"
        | "maladie"
        | "maternite"
        | "paternite"
        | "sans_solde"
        | "special"
      constat_type:
        | "ecart_majeur"
        | "ecart_mineur"
        | "observation"
        | "opportunite"
        | "point_fort"
      contrat_type: "cdi" | "cdd" | "stage" | "freelance" | "interim"
      devis_statut:
        | "brouillon"
        | "envoye"
        | "accepte"
        | "refuse"
        | "expire"
        | "converti"
      equipement_statut: "actif" | "maintenance" | "hors_service" | "reforme"
      etalonnage_resultat: "conforme" | "non_conforme" | "avec_reserves"
      fr_statut: "planifiee" | "en_cours" | "terminee" | "annulee"
      maintenance_type: "preventive" | "corrective" | "verification"
      mission_statut: "planifiee" | "en_cours" | "terminee" | "annulee"
      nc_gravite: "mineure" | "majeure" | "critique"
      nc_source:
        | "interne"
        | "client"
        | "audit"
        | "fournisseur"
        | "equipement"
        | "methode"
        | "autre"
      nc_statut:
        | "ouverte"
        | "en_traitement"
        | "en_verification"
        | "cloturee"
        | "annulee"
      niveau_validation: "technicien" | "chef_labo" | "qualite"
      prelevement_statut: "planifie" | "effectue" | "recu_labo" | "rejete"
      projet_statut: "planifie" | "en_cours" | "en_pause" | "termine" | "annule"
      rapport_statut:
        | "brouillon"
        | "en_validation"
        | "valide"
        | "envoye"
        | "annule"
      reclamation_canal:
        | "email"
        | "telephone"
        | "courrier"
        | "visite"
        | "portail"
        | "autre"
      reclamation_statut:
        | "recue"
        | "en_traitement"
        | "en_attente_client"
        | "resolue"
        | "cloturee"
        | "rejetee"
      revue_statut: "planifiee" | "tenue" | "cloturee"
      sonde_type:
        | "temperature"
        | "humidite"
        | "pression"
        | "co2"
        | "o2"
        | "ph"
        | "autre"
      tache_priorite: "basse" | "normale" | "haute" | "critique"
      tache_statut: "a_faire" | "en_cours" | "bloquee" | "terminee"
      type_matrice:
        | "eau"
        | "sol"
        | "air"
        | "alimentaire"
        | "cosmetique"
        | "pharmaceutique"
        | "industriel"
        | "autre"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      alerte_sonde_type: [
        "hors_seuil_haut",
        "hors_seuil_bas",
        "hors_ligne",
        "batterie_faible",
      ],
      analyse_statut: [
        "a_faire",
        "en_cours",
        "termine",
        "valide_tech",
        "valide_chef",
        "valide_qualite",
        "rejete",
      ],
      app_role: [
        "admin",
        "direction",
        "commercial",
        "chef_labo",
        "technicien",
        "qualite",
        "comptable",
        "rh",
        "client",
      ],
      audit_statut: [
        "planifie",
        "en_cours",
        "realise",
        "rapport_diffuse",
        "cloture",
      ],
      audit_type: [
        "interne",
        "externe",
        "fournisseur",
        "accreditation",
        "suivi",
      ],
      bc_statut: [
        "brouillon",
        "envoye",
        "accepte",
        "refuse",
        "en_cours",
        "cloture",
        "annule",
      ],
      capa_statut: [
        "planifiee",
        "en_cours",
        "realisee",
        "verifiee",
        "cloturee",
        "abandonnee",
      ],
      capa_type: ["corrective", "preventive", "immediate", "amelioration"],
      conge_statut: ["demande", "approuve", "refuse", "annule"],
      conge_type: [
        "annuel",
        "maladie",
        "maternite",
        "paternite",
        "sans_solde",
        "special",
      ],
      constat_type: [
        "ecart_majeur",
        "ecart_mineur",
        "observation",
        "opportunite",
        "point_fort",
      ],
      contrat_type: ["cdi", "cdd", "stage", "freelance", "interim"],
      devis_statut: [
        "brouillon",
        "envoye",
        "accepte",
        "refuse",
        "expire",
        "converti",
      ],
      equipement_statut: ["actif", "maintenance", "hors_service", "reforme"],
      etalonnage_resultat: ["conforme", "non_conforme", "avec_reserves"],
      fr_statut: ["planifiee", "en_cours", "terminee", "annulee"],
      maintenance_type: ["preventive", "corrective", "verification"],
      mission_statut: ["planifiee", "en_cours", "terminee", "annulee"],
      nc_gravite: ["mineure", "majeure", "critique"],
      nc_source: [
        "interne",
        "client",
        "audit",
        "fournisseur",
        "equipement",
        "methode",
        "autre",
      ],
      nc_statut: [
        "ouverte",
        "en_traitement",
        "en_verification",
        "cloturee",
        "annulee",
      ],
      niveau_validation: ["technicien", "chef_labo", "qualite"],
      prelevement_statut: ["planifie", "effectue", "recu_labo", "rejete"],
      projet_statut: ["planifie", "en_cours", "en_pause", "termine", "annule"],
      rapport_statut: [
        "brouillon",
        "en_validation",
        "valide",
        "envoye",
        "annule",
      ],
      reclamation_canal: [
        "email",
        "telephone",
        "courrier",
        "visite",
        "portail",
        "autre",
      ],
      reclamation_statut: [
        "recue",
        "en_traitement",
        "en_attente_client",
        "resolue",
        "cloturee",
        "rejetee",
      ],
      revue_statut: ["planifiee", "tenue", "cloturee"],
      sonde_type: [
        "temperature",
        "humidite",
        "pression",
        "co2",
        "o2",
        "ph",
        "autre",
      ],
      tache_priorite: ["basse", "normale", "haute", "critique"],
      tache_statut: ["a_faire", "en_cours", "bloquee", "terminee"],
      type_matrice: [
        "eau",
        "sol",
        "air",
        "alimentaire",
        "cosmetique",
        "pharmaceutique",
        "industriel",
        "autre",
      ],
    },
  },
} as const
