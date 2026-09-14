export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      bookings: {
        Row: {
          assigned_to: string | null;
          cancel_reason: string | null;
          city: string | null;
          company: string | null;
          created_at: string;
          customer_id: string | null;
          division: string;
          duration_minutes: number;
          email: string;
          id: string;
          internal_notes: string | null;
          lead_id: string | null;
          meeting_type: string;
          message: string | null;
          name: string;
          phone: string;
          reference: string;
          rescheduled_from: string | null;
          service: string | null;
          slot_at: string;
          source: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          assigned_to?: string | null;
          cancel_reason?: string | null;
          city?: string | null;
          company?: string | null;
          created_at?: string;
          customer_id?: string | null;
          division: string;
          duration_minutes?: number;
          email: string;
          id?: string;
          internal_notes?: string | null;
          lead_id?: string | null;
          meeting_type?: string;
          message?: string | null;
          name: string;
          phone: string;
          reference: string;
          rescheduled_from?: string | null;
          service?: string | null;
          slot_at: string;
          source?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          assigned_to?: string | null;
          cancel_reason?: string | null;
          city?: string | null;
          company?: string | null;
          created_at?: string;
          customer_id?: string | null;
          division?: string;
          duration_minutes?: number;
          email?: string;
          id?: string;
          internal_notes?: string | null;
          lead_id?: string | null;
          meeting_type?: string;
          message?: string | null;
          name?: string;
          phone?: string;
          reference?: string;
          rescheduled_from?: string | null;
          service?: string | null;
          slot_at?: string;
          source?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      cms_audit_log: {
        Row: {
          action: string;
          actor_email: string | null;
          actor_id: string | null;
          created_at: string;
          detail: Json;
          entity_id: string | null;
          entity_slug: string | null;
          entity_title: string | null;
          id: string;
          module: string;
        };
        Insert: {
          action: string;
          actor_email?: string | null;
          actor_id?: string | null;
          created_at?: string;
          detail?: Json;
          entity_id?: string | null;
          entity_slug?: string | null;
          entity_title?: string | null;
          id?: string;
          module: string;
        };
        Update: {
          action?: string;
          actor_email?: string | null;
          actor_id?: string | null;
          created_at?: string;
          detail?: Json;
          entity_id?: string | null;
          entity_slug?: string | null;
          entity_title?: string | null;
          id?: string;
          module?: string;
        };
        Relationships: [];
      };
      cms_case_studies: {
        Row: {
          body: string | null;
          client: string | null;
          created_at: string;
          created_by: string | null;
          data: Json;
          featured: boolean;
          hero_image: string | null;
          id: string;
          industry: string | null;
          og_image: string | null;
          seo_description: string | null;
          seo_keywords: string[];
          seo_title: string | null;
          service: string | null;
          slug: string;
          sort_order: number;
          status: string;
          summary: string | null;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          body?: string | null;
          client?: string | null;
          created_at?: string;
          created_by?: string | null;
          data?: Json;
          featured?: boolean;
          hero_image?: string | null;
          id?: string;
          industry?: string | null;
          og_image?: string | null;
          seo_description?: string | null;
          seo_keywords?: string[];
          seo_title?: string | null;
          service?: string | null;
          slug: string;
          sort_order?: number;
          status?: string;
          summary?: string | null;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          body?: string | null;
          client?: string | null;
          created_at?: string;
          created_by?: string | null;
          data?: Json;
          featured?: boolean;
          hero_image?: string | null;
          id?: string;
          industry?: string | null;
          og_image?: string | null;
          seo_description?: string | null;
          seo_keywords?: string[];
          seo_title?: string | null;
          service?: string | null;
          slug?: string;
          sort_order?: number;
          status?: string;
          summary?: string | null;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      cms_downloads: {
        Row: {
          body: string | null;
          category: string | null;
          created_at: string;
          created_by: string | null;
          cta_label: string | null;
          data: Json;
          featured: boolean;
          file_bucket: string | null;
          file_path: string | null;
          file_url: string | null;
          hero_image: string | null;
          id: string;
          og_image: string | null;
          seo_description: string | null;
          seo_keywords: string[];
          seo_title: string | null;
          slug: string;
          sort_order: number;
          status: string;
          summary: string | null;
          thumbnail: string | null;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          body?: string | null;
          category?: string | null;
          created_at?: string;
          created_by?: string | null;
          cta_label?: string | null;
          data?: Json;
          featured?: boolean;
          file_bucket?: string | null;
          file_path?: string | null;
          file_url?: string | null;
          hero_image?: string | null;
          id?: string;
          og_image?: string | null;
          seo_description?: string | null;
          seo_keywords?: string[];
          seo_title?: string | null;
          slug: string;
          sort_order?: number;
          status?: string;
          summary?: string | null;
          thumbnail?: string | null;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          body?: string | null;
          category?: string | null;
          created_at?: string;
          created_by?: string | null;
          cta_label?: string | null;
          data?: Json;
          featured?: boolean;
          file_bucket?: string | null;
          file_path?: string | null;
          file_url?: string | null;
          hero_image?: string | null;
          id?: string;
          og_image?: string | null;
          seo_description?: string | null;
          seo_keywords?: string[];
          seo_title?: string | null;
          slug?: string;
          sort_order?: number;
          status?: string;
          summary?: string | null;
          thumbnail?: string | null;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      cms_faqs: {
        Row: {
          answer: string;
          category: string | null;
          created_at: string;
          created_by: string | null;
          data: Json;
          featured: boolean;
          id: string;
          industry_id: string | null;
          question: string;
          service_id: string | null;
          slug: string | null;
          sort_order: number;
          status: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          answer: string;
          category?: string | null;
          created_at?: string;
          created_by?: string | null;
          data?: Json;
          featured?: boolean;
          id?: string;
          industry_id?: string | null;
          question: string;
          service_id?: string | null;
          slug?: string | null;
          sort_order?: number;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          answer?: string;
          category?: string | null;
          created_at?: string;
          created_by?: string | null;
          data?: Json;
          featured?: boolean;
          id?: string;
          industry_id?: string | null;
          question?: string;
          service_id?: string | null;
          slug?: string | null;
          sort_order?: number;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "cms_faqs_industry_id_fkey";
            columns: ["industry_id"];
            isOneToOne: false;
            referencedRelation: "cms_industries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cms_faqs_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "cms_services";
            referencedColumns: ["id"];
          },
        ];
      };
      cms_industries: {
        Row: {
          body: string | null;
          created_at: string;
          created_by: string | null;
          cta_href: string | null;
          cta_label: string | null;
          data: Json;
          featured: boolean;
          hero_description: string | null;
          hero_image: string | null;
          hero_title: string | null;
          icon: string | null;
          id: string;
          og_image: string | null;
          seo_description: string | null;
          seo_keywords: string[];
          seo_title: string | null;
          slug: string;
          sort_order: number;
          status: string;
          summary: string | null;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          created_by?: string | null;
          cta_href?: string | null;
          cta_label?: string | null;
          data?: Json;
          featured?: boolean;
          hero_description?: string | null;
          hero_image?: string | null;
          hero_title?: string | null;
          icon?: string | null;
          id?: string;
          og_image?: string | null;
          seo_description?: string | null;
          seo_keywords?: string[];
          seo_title?: string | null;
          slug: string;
          sort_order?: number;
          status?: string;
          summary?: string | null;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          created_by?: string | null;
          cta_href?: string | null;
          cta_label?: string | null;
          data?: Json;
          featured?: boolean;
          hero_description?: string | null;
          hero_image?: string | null;
          hero_title?: string | null;
          icon?: string | null;
          id?: string;
          og_image?: string | null;
          seo_description?: string | null;
          seo_keywords?: string[];
          seo_title?: string | null;
          slug?: string;
          sort_order?: number;
          status?: string;
          summary?: string | null;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      cms_jobs: {
        Row: {
          body: string | null;
          created_at: string;
          created_by: string | null;
          cta_href: string | null;
          cta_label: string | null;
          data: Json;
          deadline: string | null;
          department: string | null;
          employment_type: string | null;
          experience: string | null;
          featured: boolean;
          hero_image: string | null;
          id: string;
          location: string | null;
          og_image: string | null;
          openings: number | null;
          salary: string | null;
          seo_description: string | null;
          seo_keywords: string[];
          seo_title: string | null;
          skills: string[];
          slug: string;
          sort_order: number;
          status: string;
          summary: string | null;
          title: string;
          updated_at: string;
          updated_by: string | null;
          work_mode: string | null;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          created_by?: string | null;
          cta_href?: string | null;
          cta_label?: string | null;
          data?: Json;
          deadline?: string | null;
          department?: string | null;
          employment_type?: string | null;
          experience?: string | null;
          featured?: boolean;
          hero_image?: string | null;
          id?: string;
          location?: string | null;
          og_image?: string | null;
          openings?: number | null;
          salary?: string | null;
          seo_description?: string | null;
          seo_keywords?: string[];
          seo_title?: string | null;
          skills?: string[];
          slug: string;
          sort_order?: number;
          status?: string;
          summary?: string | null;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
          work_mode?: string | null;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          created_by?: string | null;
          cta_href?: string | null;
          cta_label?: string | null;
          data?: Json;
          deadline?: string | null;
          department?: string | null;
          employment_type?: string | null;
          experience?: string | null;
          featured?: boolean;
          hero_image?: string | null;
          id?: string;
          location?: string | null;
          og_image?: string | null;
          openings?: number | null;
          salary?: string | null;
          seo_description?: string | null;
          seo_keywords?: string[];
          seo_title?: string | null;
          skills?: string[];
          slug?: string;
          sort_order?: number;
          status?: string;
          summary?: string | null;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
          work_mode?: string | null;
        };
        Relationships: [];
      };
      cms_media: {
        Row: {
          alt_text: string | null;
          bucket: string;
          created_at: string;
          id: string;
          mime_type: string | null;
          name: string;
          path: string;
          size_bytes: number | null;
          updated_at: string;
          uploaded_by: string | null;
          url: string;
        };
        Insert: {
          alt_text?: string | null;
          bucket?: string;
          created_at?: string;
          id?: string;
          mime_type?: string | null;
          name: string;
          path: string;
          size_bytes?: number | null;
          updated_at?: string;
          uploaded_by?: string | null;
          url: string;
        };
        Update: {
          alt_text?: string | null;
          bucket?: string;
          created_at?: string;
          id?: string;
          mime_type?: string | null;
          name?: string;
          path?: string;
          size_bytes?: number | null;
          updated_at?: string;
          uploaded_by?: string | null;
          url?: string;
        };
        Relationships: [];
      };
      cms_offices: {
        Row: {
          address: string | null;
          city: string | null;
          created_at: string;
          created_by: string | null;
          data: Json;
          email: string | null;
          embed_url: string | null;
          featured: boolean;
          hours: string | null;
          id: string;
          latitude: number | null;
          longitude: number | null;
          maps_url: string | null;
          phone: string | null;
          slug: string;
          sort_order: number;
          status: string;
          summary: string | null;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          address?: string | null;
          city?: string | null;
          created_at?: string;
          created_by?: string | null;
          data?: Json;
          email?: string | null;
          embed_url?: string | null;
          featured?: boolean;
          hours?: string | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          maps_url?: string | null;
          phone?: string | null;
          slug: string;
          sort_order?: number;
          status?: string;
          summary?: string | null;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          created_at?: string;
          created_by?: string | null;
          data?: Json;
          email?: string | null;
          embed_url?: string | null;
          featured?: boolean;
          hours?: string | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          maps_url?: string | null;
          phone?: string | null;
          slug?: string;
          sort_order?: number;
          status?: string;
          summary?: string | null;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      cms_pages: {
        Row: {
          body: string | null;
          created_at: string;
          created_by: string | null;
          cta_href: string | null;
          cta_label: string | null;
          data: Json;
          featured: boolean;
          hero_description: string | null;
          hero_image: string | null;
          hero_title: string | null;
          id: string;
          og_image: string | null;
          seo_description: string | null;
          seo_keywords: string[];
          seo_title: string | null;
          slug: string;
          sort_order: number;
          status: string;
          summary: string | null;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          created_by?: string | null;
          cta_href?: string | null;
          cta_label?: string | null;
          data?: Json;
          featured?: boolean;
          hero_description?: string | null;
          hero_image?: string | null;
          hero_title?: string | null;
          id?: string;
          og_image?: string | null;
          seo_description?: string | null;
          seo_keywords?: string[];
          seo_title?: string | null;
          slug: string;
          sort_order?: number;
          status?: string;
          summary?: string | null;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          created_by?: string | null;
          cta_href?: string | null;
          cta_label?: string | null;
          data?: Json;
          featured?: boolean;
          hero_description?: string | null;
          hero_image?: string | null;
          hero_title?: string | null;
          id?: string;
          og_image?: string | null;
          seo_description?: string | null;
          seo_keywords?: string[];
          seo_title?: string | null;
          slug?: string;
          sort_order?: number;
          status?: string;
          summary?: string | null;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      cms_posts: {
        Row: {
          author: string | null;
          author_role: string | null;
          body: string | null;
          category: string | null;
          created_at: string;
          created_by: string | null;
          data: Json;
          excerpt: string | null;
          featured: boolean;
          hero_image: string | null;
          id: string;
          og_image: string | null;
          published_at: string | null;
          read_time: string | null;
          seo_description: string | null;
          seo_keywords: string[];
          seo_title: string | null;
          slug: string;
          sort_order: number;
          status: string;
          tags: string[];
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          author?: string | null;
          author_role?: string | null;
          body?: string | null;
          category?: string | null;
          created_at?: string;
          created_by?: string | null;
          data?: Json;
          excerpt?: string | null;
          featured?: boolean;
          hero_image?: string | null;
          id?: string;
          og_image?: string | null;
          published_at?: string | null;
          read_time?: string | null;
          seo_description?: string | null;
          seo_keywords?: string[];
          seo_title?: string | null;
          slug: string;
          sort_order?: number;
          status?: string;
          tags?: string[];
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          author?: string | null;
          author_role?: string | null;
          body?: string | null;
          category?: string | null;
          created_at?: string;
          created_by?: string | null;
          data?: Json;
          excerpt?: string | null;
          featured?: boolean;
          hero_image?: string | null;
          id?: string;
          og_image?: string | null;
          published_at?: string | null;
          read_time?: string | null;
          seo_description?: string | null;
          seo_keywords?: string[];
          seo_title?: string | null;
          slug?: string;
          sort_order?: number;
          status?: string;
          tags?: string[];
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      cms_projects: {
        Row: {
          body: string | null;
          client: string | null;
          created_at: string;
          created_by: string | null;
          data: Json;
          featured: boolean;
          hero_image: string | null;
          id: string;
          industry: string | null;
          og_image: string | null;
          project_url: string | null;
          seo_description: string | null;
          seo_keywords: string[];
          seo_title: string | null;
          service: string | null;
          slug: string;
          sort_order: number;
          status: string;
          summary: string | null;
          technologies: string[];
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          body?: string | null;
          client?: string | null;
          created_at?: string;
          created_by?: string | null;
          data?: Json;
          featured?: boolean;
          hero_image?: string | null;
          id?: string;
          industry?: string | null;
          og_image?: string | null;
          project_url?: string | null;
          seo_description?: string | null;
          seo_keywords?: string[];
          seo_title?: string | null;
          service?: string | null;
          slug: string;
          sort_order?: number;
          status?: string;
          summary?: string | null;
          technologies?: string[];
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          body?: string | null;
          client?: string | null;
          created_at?: string;
          created_by?: string | null;
          data?: Json;
          featured?: boolean;
          hero_image?: string | null;
          id?: string;
          industry?: string | null;
          og_image?: string | null;
          project_url?: string | null;
          seo_description?: string | null;
          seo_keywords?: string[];
          seo_title?: string | null;
          service?: string | null;
          slug?: string;
          sort_order?: number;
          status?: string;
          summary?: string | null;
          technologies?: string[];
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      cms_resources: {
        Row: {
          author: string | null;
          body: string | null;
          category: string | null;
          created_at: string;
          created_by: string | null;
          cta_label: string | null;
          data: Json;
          featured: boolean;
          file_bucket: string | null;
          file_path: string | null;
          hero_image: string | null;
          icon: string | null;
          id: string;
          og_image: string | null;
          resource_type: string | null;
          seo_description: string | null;
          seo_keywords: string[];
          seo_title: string | null;
          slug: string;
          sort_order: number;
          status: string;
          summary: string | null;
          thumbnail: string | null;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          author?: string | null;
          body?: string | null;
          category?: string | null;
          created_at?: string;
          created_by?: string | null;
          cta_label?: string | null;
          data?: Json;
          featured?: boolean;
          file_bucket?: string | null;
          file_path?: string | null;
          hero_image?: string | null;
          icon?: string | null;
          id?: string;
          og_image?: string | null;
          resource_type?: string | null;
          seo_description?: string | null;
          seo_keywords?: string[];
          seo_title?: string | null;
          slug: string;
          sort_order?: number;
          status?: string;
          summary?: string | null;
          thumbnail?: string | null;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          author?: string | null;
          body?: string | null;
          category?: string | null;
          created_at?: string;
          created_by?: string | null;
          cta_label?: string | null;
          data?: Json;
          featured?: boolean;
          file_bucket?: string | null;
          file_path?: string | null;
          hero_image?: string | null;
          icon?: string | null;
          id?: string;
          og_image?: string | null;
          resource_type?: string | null;
          seo_description?: string | null;
          seo_keywords?: string[];
          seo_title?: string | null;
          slug?: string;
          sort_order?: number;
          status?: string;
          summary?: string | null;
          thumbnail?: string | null;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      cms_services: {
        Row: {
          body: string | null;
          created_at: string;
          created_by: string | null;
          data: Json;
          featured: boolean;
          hero_description: string | null;
          hero_image: string | null;
          hero_title: string | null;
          icon: string | null;
          id: string;
          og_image: string | null;
          seo_description: string | null;
          seo_keywords: string[];
          seo_title: string | null;
          service_key: string | null;
          slug: string;
          sort_order: number;
          status: string;
          summary: string | null;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          created_by?: string | null;
          data?: Json;
          featured?: boolean;
          hero_description?: string | null;
          hero_image?: string | null;
          hero_title?: string | null;
          icon?: string | null;
          id?: string;
          og_image?: string | null;
          seo_description?: string | null;
          seo_keywords?: string[];
          seo_title?: string | null;
          service_key?: string | null;
          slug: string;
          sort_order?: number;
          status?: string;
          summary?: string | null;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          created_by?: string | null;
          data?: Json;
          featured?: boolean;
          hero_description?: string | null;
          hero_image?: string | null;
          hero_title?: string | null;
          icon?: string | null;
          id?: string;
          og_image?: string | null;
          seo_description?: string | null;
          seo_keywords?: string[];
          seo_title?: string | null;
          service_key?: string | null;
          slug?: string;
          sort_order?: number;
          status?: string;
          summary?: string | null;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      cms_settings: {
        Row: {
          created_at: string;
          key: string;
          updated_at: string;
          updated_by: string | null;
          value: Json;
        };
        Insert: {
          created_at?: string;
          key: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: Json;
        };
        Update: {
          created_at?: string;
          key?: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: Json;
        };
        Relationships: [];
      };
      cms_sub_services: {
        Row: {
          body: string | null;
          created_at: string;
          created_by: string | null;
          cta_href: string | null;
          cta_label: string | null;
          data: Json;
          featured: boolean;
          hero_description: string | null;
          hero_image: string | null;
          hero_title: string | null;
          icon: string | null;
          id: string;
          og_image: string | null;
          parent_key: string | null;
          seo_description: string | null;
          seo_keywords: string[];
          seo_title: string | null;
          service_id: string | null;
          slug: string;
          sort_order: number;
          status: string;
          summary: string | null;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          created_by?: string | null;
          cta_href?: string | null;
          cta_label?: string | null;
          data?: Json;
          featured?: boolean;
          hero_description?: string | null;
          hero_image?: string | null;
          hero_title?: string | null;
          icon?: string | null;
          id?: string;
          og_image?: string | null;
          parent_key?: string | null;
          seo_description?: string | null;
          seo_keywords?: string[];
          seo_title?: string | null;
          service_id?: string | null;
          slug: string;
          sort_order?: number;
          status?: string;
          summary?: string | null;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          created_by?: string | null;
          cta_href?: string | null;
          cta_label?: string | null;
          data?: Json;
          featured?: boolean;
          hero_description?: string | null;
          hero_image?: string | null;
          hero_title?: string | null;
          icon?: string | null;
          id?: string;
          og_image?: string | null;
          parent_key?: string | null;
          seo_description?: string | null;
          seo_keywords?: string[];
          seo_title?: string | null;
          service_id?: string | null;
          slug?: string;
          sort_order?: number;
          status?: string;
          summary?: string | null;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "cms_sub_services_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "cms_services";
            referencedColumns: ["id"];
          },
        ];
      };
      customers: {
        Row: {
          address: string | null;
          city: string | null;
          company: string | null;
          created_at: string;
          created_by: string | null;
          division: string | null;
          email: string | null;
          id: string;
          name: string;
          origin_lead_id: string | null;
          phone: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          city?: string | null;
          company?: string | null;
          created_at?: string;
          created_by?: string | null;
          division?: string | null;
          email?: string | null;
          id?: string;
          name: string;
          origin_lead_id?: string | null;
          phone?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          company?: string | null;
          created_at?: string;
          created_by?: string | null;
          division?: string | null;
          email?: string | null;
          id?: string;
          name?: string;
          origin_lead_id?: string | null;
          phone?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customers_origin_lead_id_fkey";
            columns: ["origin_lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          created_at: string;
          customer_id: string | null;
          id: string;
          lead_id: string | null;
          mime_type: string | null;
          name: string;
          path: string;
          rejection_reason: string | null;
          replaces_document_id: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          size_bytes: number | null;
          status: string;
          updated_at: string;
          uploaded_by: string | null;
          uploaded_by_label: string | null;
        };
        Insert: {
          created_at?: string;
          customer_id?: string | null;
          id?: string;
          lead_id?: string | null;
          mime_type?: string | null;
          name: string;
          path: string;
          rejection_reason?: string | null;
          replaces_document_id?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          size_bytes?: number | null;
          status?: string;
          updated_at?: string;
          uploaded_by?: string | null;
          uploaded_by_label?: string | null;
        };
        Update: {
          created_at?: string;
          customer_id?: string | null;
          id?: string;
          lead_id?: string | null;
          mime_type?: string | null;
          name?: string;
          path?: string;
          rejection_reason?: string | null;
          replaces_document_id?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          size_bytes?: number | null;
          status?: string;
          updated_at?: string;
          uploaded_by?: string | null;
          uploaded_by_label?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "documents_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_replaces_document_id_fkey";
            columns: ["replaces_document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
        ];
      };
      follow_ups: {
        Row: {
          assigned_to: string | null;
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          customer_id: string | null;
          due_at: string;
          id: string;
          lead_id: string | null;
          notes: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          assigned_to?: string | null;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          customer_id?: string | null;
          due_at: string;
          id?: string;
          lead_id?: string | null;
          notes?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          assigned_to?: string | null;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          customer_id?: string | null;
          due_at?: string;
          id?: string;
          lead_id?: string | null;
          notes?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "follow_ups_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "follow_ups_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_activity: {
        Row: {
          action: string;
          actor_id: string | null;
          booking_id: string | null;
          created_at: string;
          customer_id: string | null;
          detail: Json;
          id: string;
          lead_id: string | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          booking_id?: string | null;
          created_at?: string;
          customer_id?: string | null;
          detail?: Json;
          id?: string;
          lead_id?: string | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          booking_id?: string | null;
          created_at?: string;
          customer_id?: string | null;
          detail?: Json;
          id?: string;
          lead_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lead_activity_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_activity_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_activity_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_notes: {
        Row: {
          author_id: string | null;
          created_at: string;
          id: string;
          lead_id: string;
          note: string;
          updated_at: string;
        };
        Insert: {
          author_id?: string | null;
          created_at?: string;
          id?: string;
          lead_id: string;
          note: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string | null;
          created_at?: string;
          id?: string;
          lead_id?: string;
          note?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          application_stage: string | null;
          assigned_to: string | null;
          attachments: Json;
          city: string | null;
          company: string | null;
          created_at: string;
          customer_id: string | null;
          department: string | null;
          details: Json;
          division: string;
          email: string;
          estimated_value: string | null;
          follow_up_at: string | null;
          id: string;
          message: string | null;
          name: string;
          page_url: string | null;
          phone: string;
          priority: string;
          project_size: string | null;
          reference: string;
          score: string;
          score_value: number;
          service: string | null;
          source: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          application_stage?: string | null;
          assigned_to?: string | null;
          attachments?: Json;
          city?: string | null;
          company?: string | null;
          created_at?: string;
          customer_id?: string | null;
          department?: string | null;
          details?: Json;
          division: string;
          email: string;
          estimated_value?: string | null;
          follow_up_at?: string | null;
          id?: string;
          message?: string | null;
          name: string;
          page_url?: string | null;
          phone: string;
          priority?: string;
          project_size?: string | null;
          reference: string;
          score?: string;
          score_value?: number;
          service?: string | null;
          source?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          application_stage?: string | null;
          assigned_to?: string | null;
          attachments?: Json;
          city?: string | null;
          company?: string | null;
          created_at?: string;
          customer_id?: string | null;
          department?: string | null;
          details?: Json;
          division?: string;
          email?: string;
          estimated_value?: string | null;
          follow_up_at?: string | null;
          id?: string;
          message?: string | null;
          name?: string;
          page_url?: string | null;
          phone?: string;
          priority?: string;
          project_size?: string | null;
          reference?: string;
          score?: string;
          score_value?: number;
          service?: string | null;
          source?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leads_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          assigned_to: string | null;
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          customer_id: string | null;
          due_at: string | null;
          id: string;
          lead_id: string | null;
          notes: string | null;
          priority: string;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          assigned_to?: string | null;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          customer_id?: string | null;
          due_at?: string | null;
          id?: string;
          lead_id?: string | null;
          notes?: string | null;
          priority?: string;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          assigned_to?: string | null;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          customer_id?: string | null;
          due_at?: string | null;
          id?: string;
          lead_id?: string | null;
          notes?: string | null;
          priority?: string;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_exists: { Args: never; Returns: boolean };
      claim_first_admin: { Args: never; Returns: boolean };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_team: { Args: { _user_id: string }; Returns: boolean };
    };
    Enums: {
      app_role: "admin" | "manager" | "staff";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "staff"],
    },
  },
} as const;
