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
      bc_statut:
        | "brouillon"
        | "envoye"
        | "accepte"
        | "refuse"
        | "en_cours"
        | "cloture"
        | "annule"
      fr_statut: "planifiee" | "en_cours" | "terminee" | "annulee"
      mission_statut: "planifiee" | "en_cours" | "terminee" | "annulee"
      niveau_validation: "technicien" | "chef_labo" | "qualite"
      prelevement_statut: "planifie" | "effectue" | "recu_labo" | "rejete"
      rapport_statut:
        | "brouillon"
        | "en_validation"
        | "valide"
        | "envoye"
        | "annule"
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
      bc_statut: [
        "brouillon",
        "envoye",
        "accepte",
        "refuse",
        "en_cours",
        "cloture",
        "annule",
      ],
      fr_statut: ["planifiee", "en_cours", "terminee", "annulee"],
      mission_statut: ["planifiee", "en_cours", "terminee", "annulee"],
      niveau_validation: ["technicien", "chef_labo", "qualite"],
      prelevement_statut: ["planifie", "effectue", "recu_labo", "rejete"],
      rapport_statut: [
        "brouillon",
        "en_validation",
        "valide",
        "envoye",
        "annule",
      ],
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
