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
      analyse_resultats: {
        Row: {
          analyse_id: string
          conformite: boolean | null
          created_at: string
          id: string
          incertitude: number | null
          methode_id: string | null
          observations: string | null
          parametre_id: string
          unite_id: string | null
          updated_at: string
          valeur: string | null
          valeur_numerique: number | null
        }
        Insert: {
          analyse_id: string
          conformite?: boolean | null
          created_at?: string
          id?: string
          incertitude?: number | null
          methode_id?: string | null
          observations?: string | null
          parametre_id: string
          unite_id?: string | null
          updated_at?: string
          valeur?: string | null
          valeur_numerique?: number | null
        }
        Update: {
          analyse_id?: string
          conformite?: boolean | null
          created_at?: string
          id?: string
          incertitude?: number | null
          methode_id?: string | null
          observations?: string | null
          parametre_id?: string
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
          conditions: string | null
          created_at: string
          created_by: string | null
          date_bc: string
          date_souhaitee: string | null
          id: string
          notes: string | null
          numero: string
          objet: string | null
          reference_client: string | null
          remise_pct: number
          statut: Database["public"]["Enums"]["bc_statut"]
          total_ht: number
          total_ttc: number
          total_tva: number
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          client_id: string
          conditions?: string | null
          created_at?: string
          created_by?: string | null
          date_bc?: string
          date_souhaitee?: string | null
          id?: string
          notes?: string | null
          numero: string
          objet?: string | null
          reference_client?: string | null
          remise_pct?: number
          statut?: Database["public"]["Enums"]["bc_statut"]
          total_ht?: number
          total_ttc?: number
          total_tva?: number
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          client_id?: string
          conditions?: string | null
          created_at?: string
          created_by?: string | null
          date_bc?: string
          date_souhaitee?: string | null
          id?: string
          notes?: string | null
          numero?: string
          objet?: string | null
          reference_client?: string | null
          remise_pct?: number
          statut?: Database["public"]["Enums"]["bc_statut"]
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
          client_id: string
          created_at: string
          created_by: string | null
          date_mission: string
          date_prevue: string | null
          id: string
          lieu: string | null
          notes: string | null
          numero: string
          objet: string | null
          preleveur_id: string | null
          statut: Database["public"]["Enums"]["mission_statut"]
          updated_at: string
        }
        Insert: {
          bc_id?: string | null
          client_id: string
          created_at?: string
          created_by?: string | null
          date_mission?: string
          date_prevue?: string | null
          id?: string
          lieu?: string | null
          notes?: string | null
          numero: string
          objet?: string | null
          preleveur_id?: string | null
          statut?: Database["public"]["Enums"]["mission_statut"]
          updated_at?: string
        }
        Update: {
          bc_id?: string | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          date_mission?: string
          date_prevue?: string | null
          id?: string
          lieu?: string | null
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
        ]
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
          updated_at?: string
          year_reset?: boolean
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
          conditions: string | null
          conformite: boolean | null
          created_at: string
          created_by: string | null
          date_prelevement: string
          date_reception: string | null
          echantillon_id: string | null
          id: string
          lieu: string | null
          mission_id: string | null
          numero: string
          observations: string | null
          preleveur_nom: string | null
          statut: Database["public"]["Enums"]["prelevement_statut"]
          temperature: number | null
          updated_at: string
        }
        Insert: {
          client_id: string
          conditions?: string | null
          conformite?: boolean | null
          created_at?: string
          created_by?: string | null
          date_prelevement?: string
          date_reception?: string | null
          echantillon_id?: string | null
          id?: string
          lieu?: string | null
          mission_id?: string | null
          numero: string
          observations?: string | null
          preleveur_nom?: string | null
          statut?: Database["public"]["Enums"]["prelevement_statut"]
          temperature?: number | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          conditions?: string | null
          conformite?: boolean | null
          created_at?: string
          created_by?: string | null
          date_prelevement?: string
          date_reception?: string | null
          echantillon_id?: string | null
          id?: string
          lieu?: string | null
          mission_id?: string | null
          numero?: string
          observations?: string | null
          preleveur_nom?: string | null
          statut?: Database["public"]["Enums"]["prelevement_statut"]
          temperature?: number | null
          updated_at?: string
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
            foreignKeyName: "prelevements_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
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
          updated_at?: string
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
