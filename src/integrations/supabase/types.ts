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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_interactions: {
        Row: {
          ai_response: string
          confidence_score: number | null
          conversation_id: string
          created_at: string
          customer_id: string
          feedback_rating: number | null
          id: string
          insight_generated: boolean | null
          interaction_type: string
          knowledge_sources: Json | null
          metadata: Json | null
          user_id: string
          user_query: string
          was_helpful: boolean | null
        }
        Insert: {
          ai_response: string
          confidence_score?: number | null
          conversation_id: string
          created_at?: string
          customer_id: string
          feedback_rating?: number | null
          id?: string
          insight_generated?: boolean | null
          interaction_type: string
          knowledge_sources?: Json | null
          metadata?: Json | null
          user_id: string
          user_query: string
          was_helpful?: boolean | null
        }
        Update: {
          ai_response?: string
          confidence_score?: number | null
          conversation_id?: string
          created_at?: string
          customer_id?: string
          feedback_rating?: number | null
          id?: string
          insight_generated?: boolean | null
          interaction_type?: string
          knowledge_sources?: Json | null
          metadata?: Json | null
          user_id?: string
          user_query?: string
          was_helpful?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_interactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_learning_metrics: {
        Row: {
          articles_created: number | null
          avg_confidence_score: number | null
          avg_user_rating: number | null
          created_at: string
          customer_id: string
          id: string
          improvement_rate: number | null
          insights_generated: number | null
          knowledge_base_size: number | null
          metric_date: string
          total_interactions: number | null
          updated_at: string
        }
        Insert: {
          articles_created?: number | null
          avg_confidence_score?: number | null
          avg_user_rating?: number | null
          created_at?: string
          customer_id: string
          id?: string
          improvement_rate?: number | null
          insights_generated?: number | null
          knowledge_base_size?: number | null
          metric_date?: string
          total_interactions?: number | null
          updated_at?: string
        }
        Update: {
          articles_created?: number | null
          avg_confidence_score?: number | null
          avg_user_rating?: number | null
          created_at?: string
          customer_id?: string
          id?: string
          improvement_rate?: number | null
          insights_generated?: number | null
          knowledge_base_size?: number | null
          metric_date?: string
          total_interactions?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_learning_metrics_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      anomaly_detections: {
        Row: {
          affected_user_id: string | null
          anomaly_type: string
          confidence_score: number | null
          created_at: string
          customer_id: string
          description: string
          detection_method: string
          id: string
          raw_data: Json | null
          resolved_at: string | null
          severity: string
          status: string
          system_name: string
        }
        Insert: {
          affected_user_id?: string | null
          anomaly_type: string
          confidence_score?: number | null
          created_at?: string
          customer_id: string
          description: string
          detection_method: string
          id?: string
          raw_data?: Json | null
          resolved_at?: string | null
          severity: string
          status?: string
          system_name: string
        }
        Update: {
          affected_user_id?: string | null
          anomaly_type?: string
          confidence_score?: number | null
          created_at?: string
          customer_id?: string
          description?: string
          detection_method?: string
          id?: string
          raw_data?: Json | null
          resolved_at?: string | null
          severity?: string
          status?: string
          system_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "anomaly_detections_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      application_access: {
        Row: {
          application_id: string
          created_at: string
          department: string | null
          id: string
          role_id: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          department?: string | null
          id?: string
          role_id?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          department?: string | null
          id?: string
          role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_access_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_access_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          app_url: string | null
          auth_type: string
          category: string
          config: Json | null
          created_at: string
          description: string | null
          display_order: number | null
          icon_name: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          app_url?: string | null
          auth_type?: string
          category?: string
          config?: Json | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon_name?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          app_url?: string | null
          auth_type?: string
          category?: string
          config?: Json | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon_name?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action_details: Json | null
          action_type: string
          compliance_tags: string[] | null
          created_at: string
          customer_id: string
          id: string
          system_name: string
          timestamp: string
          user_id: string
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          compliance_tags?: string[] | null
          created_at?: string
          customer_id: string
          id?: string
          system_name: string
          timestamp?: string
          user_id: string
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          compliance_tags?: string[] | null
          created_at?: string
          customer_id?: string
          id?: string
          system_name?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      behavioral_events: {
        Row: {
          action: string
          context: Json | null
          created_at: string
          customer_id: string
          duration_ms: number | null
          event_type: string
          id: string
          success: boolean
          system_name: string
          timestamp: string
          user_id: string
        }
        Insert: {
          action: string
          context?: Json | null
          created_at?: string
          customer_id: string
          duration_ms?: number | null
          event_type: string
          id?: string
          success?: boolean
          system_name: string
          timestamp?: string
          user_id: string
        }
        Update: {
          action?: string
          context?: Json | null
          created_at?: string
          customer_id?: string
          duration_ms?: number | null
          event_type?: string
          id?: string
          success?: boolean
          system_name?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "behavioral_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      case_studies: {
        Row: {
          challenge: string
          company_name: string
          created_at: string
          id: string
          industry: string
          is_featured: boolean
          is_published: boolean
          metrics: Json
          published_date: string | null
          results: Json
          slug: string
          solution: string
          summary: string
          testimonial_author: string | null
          testimonial_quote: string | null
          testimonial_role: string | null
          title: string
          updated_at: string
        }
        Insert: {
          challenge: string
          company_name: string
          created_at?: string
          id?: string
          industry: string
          is_featured?: boolean
          is_published?: boolean
          metrics: Json
          published_date?: string | null
          results: Json
          slug: string
          solution: string
          summary: string
          testimonial_author?: string | null
          testimonial_quote?: string | null
          testimonial_role?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          challenge?: string
          company_name?: string
          created_at?: string
          id?: string
          industry?: string
          is_featured?: boolean
          is_published?: boolean
          metrics?: Json
          published_date?: string | null
          results?: Json
          slug?: string
          solution?: string
          summary?: string
          testimonial_author?: string | null
          testimonial_quote?: string | null
          testimonial_role?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_onboarding_tasks: {
        Row: {
          actual_hours: number | null
          assigned_role: string | null
          assigned_to: string | null
          blockers: string | null
          completed_at: string | null
          completed_by: string | null
          compliance_tags: string[] | null
          created_at: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          notes: string | null
          onboarding_id: string
          required_documents: Json | null
          sequence_order: number
          status: string
          task_category: string
          task_name: string
          template_task_id: string | null
          updated_at: string
          uploaded_documents: Json | null
        }
        Insert: {
          actual_hours?: number | null
          assigned_role?: string | null
          assigned_to?: string | null
          blockers?: string | null
          completed_at?: string | null
          completed_by?: string | null
          compliance_tags?: string[] | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          notes?: string | null
          onboarding_id: string
          required_documents?: Json | null
          sequence_order?: number
          status?: string
          task_category: string
          task_name: string
          template_task_id?: string | null
          updated_at?: string
          uploaded_documents?: Json | null
        }
        Update: {
          actual_hours?: number | null
          assigned_role?: string | null
          assigned_to?: string | null
          blockers?: string | null
          completed_at?: string | null
          completed_by?: string | null
          compliance_tags?: string[] | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          notes?: string | null
          onboarding_id?: string
          required_documents?: Json | null
          sequence_order?: number
          status?: string
          task_category?: string
          task_name?: string
          template_task_id?: string | null
          updated_at?: string
          uploaded_documents?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "client_onboarding_tasks_onboarding_id_fkey"
            columns: ["onboarding_id"]
            isOneToOne: false
            referencedRelation: "client_onboardings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_onboarding_tasks_template_task_id_fkey"
            columns: ["template_task_id"]
            isOneToOne: false
            referencedRelation: "onboarding_template_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      client_onboardings: {
        Row: {
          actual_completion_date: string | null
          client_contact_email: string
          client_contact_name: string | null
          client_name: string
          completion_percentage: number | null
          created_at: string
          created_by: string
          customer_id: string
          id: string
          metadata: Json | null
          notes: string | null
          start_date: string | null
          status: string
          target_completion_date: string | null
          template_id: string
          updated_at: string
        }
        Insert: {
          actual_completion_date?: string | null
          client_contact_email: string
          client_contact_name?: string | null
          client_name: string
          completion_percentage?: number | null
          created_at?: string
          created_by: string
          customer_id: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          start_date?: string | null
          status?: string
          target_completion_date?: string | null
          template_id: string
          updated_at?: string
        }
        Update: {
          actual_completion_date?: string | null
          client_contact_email?: string
          client_contact_name?: string | null
          client_name?: string
          completion_percentage?: number | null
          created_at?: string
          created_by?: string
          customer_id?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          start_date?: string | null
          status?: string
          target_completion_date?: string | null
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_onboardings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_onboardings_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "onboarding_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_controls: {
        Row: {
          automation_level: string
          category: string
          control_id: string
          control_name: string
          created_at: string
          description: string | null
          framework_id: string
          id: string
          required_evidence: string[] | null
        }
        Insert: {
          automation_level?: string
          category: string
          control_id: string
          control_name: string
          created_at?: string
          description?: string | null
          framework_id: string
          id?: string
          required_evidence?: string[] | null
        }
        Update: {
          automation_level?: string
          category?: string
          control_id?: string
          control_name?: string
          created_at?: string
          description?: string | null
          framework_id?: string
          id?: string
          required_evidence?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_controls_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "compliance_frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_frameworks: {
        Row: {
          created_at: string
          description: string | null
          framework_code: string
          framework_name: string
          id: string
          industry: string
          is_active: boolean
          updated_at: string
          version: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          framework_code: string
          framework_name: string
          id?: string
          industry: string
          is_active?: boolean
          updated_at?: string
          version?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          framework_code?: string
          framework_name?: string
          id?: string
          industry?: string
          is_active?: boolean
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      compliance_reports: {
        Row: {
          created_at: string
          customer_id: string
          evidence_count: number | null
          findings: Json | null
          framework: string
          generated_at: string
          generated_by: string
          id: string
          report_name: string
          report_period_end: string
          report_period_start: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          evidence_count?: number | null
          findings?: Json | null
          framework: string
          generated_at?: string
          generated_by: string
          id?: string
          report_name: string
          report_period_end: string
          report_period_start: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          evidence_count?: number | null
          findings?: Json | null
          framework?: string
          generated_at?: string
          generated_by?: string
          id?: string
          report_name?: string
          report_period_end?: string
          report_period_start?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_reports_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_tags: {
        Row: {
          applicable_frameworks: string[] | null
          created_at: string
          description: string | null
          id: string
          tag_name: string
          tag_type: string
        }
        Insert: {
          applicable_frameworks?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          tag_name: string
          tag_type: string
        }
        Update: {
          applicable_frameworks?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          tag_name?: string
          tag_type?: string
        }
        Relationships: []
      }
      customer_customizations: {
        Row: {
          accent_color: string | null
          company_logo_url: string | null
          created_at: string
          custom_settings: Json | null
          customer_id: string
          dashboard_layout: Json | null
          default_dashboard: string | null
          enabled_features: Json | null
          enabled_integrations: Json | null
          id: string
          primary_color: string | null
          secondary_color: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          company_logo_url?: string | null
          created_at?: string
          custom_settings?: Json | null
          customer_id: string
          dashboard_layout?: Json | null
          default_dashboard?: string | null
          enabled_features?: Json | null
          enabled_integrations?: Json | null
          id?: string
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          company_logo_url?: string | null
          created_at?: string
          custom_settings?: Json | null
          customer_id?: string
          dashboard_layout?: Json | null
          default_dashboard?: string | null
          enabled_features?: Json | null
          enabled_integrations?: Json | null
          id?: string
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_customizations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_frameworks: {
        Row: {
          created_at: string
          custom_controls: Json | null
          customer_id: string
          enabled_at: string
          framework_id: string
          id: string
        }
        Insert: {
          created_at?: string
          custom_controls?: Json | null
          customer_id: string
          enabled_at?: string
          framework_id: string
          id?: string
        }
        Update: {
          created_at?: string
          custom_controls?: Json | null
          customer_id?: string
          enabled_at?: string
          framework_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_frameworks_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_frameworks_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "compliance_frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          company_name: string
          contact_name: string
          created_at: string
          email: string
          id: string
          phone: string | null
          plan_type: string
          status: string
          subscription_end_date: string | null
          subscription_plan_id: string | null
          subscription_start_date: string | null
          subscription_status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          company_name: string
          contact_name: string
          created_at?: string
          email: string
          id?: string
          phone?: string | null
          plan_type?: string
          status?: string
          subscription_end_date?: string | null
          subscription_plan_id?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          company_name?: string
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          phone?: string | null
          plan_type?: string
          status?: string
          subscription_end_date?: string | null
          subscription_plan_id?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_subscription_plan_id_fkey"
            columns: ["subscription_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_widgets: {
        Row: {
          created_at: string
          customer_id: string
          height: number
          id: string
          is_visible: boolean
          position_x: number
          position_y: number
          updated_at: string
          user_id: string
          widget_config: Json
          widget_type: string
          width: number
        }
        Insert: {
          created_at?: string
          customer_id: string
          height: number
          id?: string
          is_visible?: boolean
          position_x: number
          position_y: number
          updated_at?: string
          user_id: string
          widget_config: Json
          widget_type: string
          width: number
        }
        Update: {
          created_at?: string
          customer_id?: string
          height?: number
          id?: string
          is_visible?: boolean
          position_x?: number
          position_y?: number
          updated_at?: string
          user_id?: string
          widget_config?: Json
          widget_type?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_widgets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      department_permissions: {
        Row: {
          accessible_features: Json
          accessible_tables: Json
          created_at: string
          dashboard_widgets: Json
          department: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          accessible_features?: Json
          accessible_tables?: Json
          created_at?: string
          dashboard_widgets?: Json
          department: string
          display_name: string
          id?: string
          updated_at?: string
        }
        Update: {
          accessible_features?: Json
          accessible_tables?: Json
          created_at?: string
          dashboard_widgets?: Json
          department?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      evidence_files: {
        Row: {
          control_id: string | null
          created_at: string
          customer_id: string
          description: string | null
          file_name: string
          file_size: number
          file_type: string
          framework_id: string | null
          id: string
          storage_path: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          control_id?: string | null
          created_at?: string
          customer_id: string
          description?: string | null
          file_name: string
          file_size: number
          file_type: string
          framework_id?: string | null
          id?: string
          storage_path: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          control_id?: string | null
          created_at?: string
          customer_id?: string
          description?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          framework_id?: string | null
          id?: string
          storage_path?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_files_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_files_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "compliance_frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_credentials: {
        Row: {
          created_at: string
          credential_type: string
          customer_id: string
          encrypted_data: string
          expires_at: string | null
          id: string
          integration_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          credential_type: string
          customer_id: string
          encrypted_data: string
          expires_at?: string | null
          id?: string
          integration_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          credential_type?: string
          customer_id?: string
          encrypted_data?: string
          expires_at?: string | null
          id?: string
          integration_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_credentials_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_credentials_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          auth_method: string
          connected_at: string | null
          created_at: string
          customer_id: string
          id: string
          last_sync: string | null
          status: string
          system_name: string
          system_type: string
          updated_at: string
        }
        Insert: {
          auth_method: string
          connected_at?: string | null
          created_at?: string
          customer_id: string
          id?: string
          last_sync?: string | null
          status?: string
          system_name: string
          system_type: string
          updated_at?: string
        }
        Update: {
          auth_method?: string
          connected_at?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          last_sync?: string | null
          status?: string
          system_name?: string
          system_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_access_logs: {
        Row: {
          access_type: string
          article_id: string | null
          customer_id: string
          id: string
          search_query: string | null
          timestamp: string
          user_id: string
        }
        Insert: {
          access_type: string
          article_id?: string | null
          customer_id: string
          id?: string
          search_query?: string | null
          timestamp?: string
          user_id: string
        }
        Update: {
          access_type?: string
          article_id?: string | null
          customer_id?: string
          id?: string
          search_query?: string | null
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_access_logs_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "knowledge_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_articles: {
        Row: {
          article_type: string
          category_id: string | null
          content: string
          created_at: string
          created_by: string
          customer_id: string
          id: string
          source_metadata: Json | null
          source_type: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          article_type: string
          category_id?: string | null
          content: string
          created_at?: string
          created_by: string
          customer_id: string
          id?: string
          source_metadata?: Json | null
          source_type?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          article_type?: string
          category_id?: string | null
          content?: string
          created_at?: string
          created_by?: string
          customer_id?: string
          id?: string
          source_metadata?: Json | null
          source_type?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "knowledge_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_categories: {
        Row: {
          created_at: string
          description: string | null
          icon_name: string | null
          id: string
          name: string
          parent_category_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          name: string
          parent_category_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          name?: string
          parent_category_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "knowledge_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_files: {
        Row: {
          ai_summary: string | null
          article_id: string | null
          customer_id: string
          extracted_content: string | null
          file_name: string
          file_size: number
          file_type: string
          id: string
          metadata: Json | null
          processed_status: string
          storage_path: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          ai_summary?: string | null
          article_id?: string | null
          customer_id: string
          extracted_content?: string | null
          file_name: string
          file_size: number
          file_type: string
          id?: string
          metadata?: Json | null
          processed_status?: string
          storage_path: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          ai_summary?: string | null
          article_id?: string | null
          customer_id?: string
          extracted_content?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          metadata?: Json | null
          processed_status?: string
          storage_path?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_files_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "knowledge_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_insights: {
        Row: {
          confidence_score: number | null
          created_at: string
          customer_id: string
          data_sources: Json | null
          description: string
          id: string
          insight_type: string
          related_articles: string[] | null
          related_workflows: string[] | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          title: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          customer_id: string
          data_sources?: Json | null
          description: string
          id?: string
          insight_type: string
          related_articles?: string[] | null
          related_workflows?: string[] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          customer_id?: string
          data_sources?: Json | null
          description?: string
          id?: string
          insight_type?: string
          related_articles?: string[] | null
          related_workflows?: string[] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title?: string
        }
        Relationships: []
      }
      knowledge_versions: {
        Row: {
          article_id: string
          change_summary: string | null
          changed_by: string
          content: string
          created_at: string
          id: string
          title: string
          version: number
        }
        Insert: {
          article_id: string
          change_summary?: string | null
          changed_by: string
          content: string
          created_at?: string
          id?: string
          title: string
          version: number
        }
        Update: {
          article_id?: string
          change_summary?: string | null
          changed_by?: string
          content?: string
          created_at?: string
          id?: string
          title?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_versions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "knowledge_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      mcp_execution_logs: {
        Row: {
          customer_id: string
          error_message: string | null
          execution_time_ms: number | null
          id: string
          input_data: Json
          output_data: Json | null
          server_id: string
          status: string
          timestamp: string
          tool_id: string | null
          tool_name: string
          user_id: string | null
        }
        Insert: {
          customer_id: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_data: Json
          output_data?: Json | null
          server_id: string
          status: string
          timestamp?: string
          tool_id?: string | null
          tool_name: string
          user_id?: string | null
        }
        Update: {
          customer_id?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_data?: Json
          output_data?: Json | null
          server_id?: string
          status?: string
          timestamp?: string
          tool_id?: string | null
          tool_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mcp_execution_logs_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "mcp_servers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mcp_execution_logs_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "mcp_tools"
            referencedColumns: ["id"]
          },
        ]
      }
      mcp_resources: {
        Row: {
          access_count: number
          created_at: string
          description: string | null
          id: string
          last_accessed: string | null
          metadata: Json | null
          resource_type: string
          resource_uri: string
          server_id: string
        }
        Insert: {
          access_count?: number
          created_at?: string
          description?: string | null
          id?: string
          last_accessed?: string | null
          metadata?: Json | null
          resource_type: string
          resource_uri: string
          server_id: string
        }
        Update: {
          access_count?: number
          created_at?: string
          description?: string | null
          id?: string
          last_accessed?: string | null
          metadata?: Json | null
          resource_type?: string
          resource_uri?: string
          server_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mcp_resources_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "mcp_servers"
            referencedColumns: ["id"]
          },
        ]
      }
      mcp_servers: {
        Row: {
          capabilities: Json
          config: Json | null
          created_at: string
          customer_id: string
          description: string | null
          endpoint_url: string | null
          error_message: string | null
          id: string
          last_health_check: string | null
          server_name: string
          server_type: string
          status: string
          updated_at: string
        }
        Insert: {
          capabilities?: Json
          config?: Json | null
          created_at?: string
          customer_id: string
          description?: string | null
          endpoint_url?: string | null
          error_message?: string | null
          id?: string
          last_health_check?: string | null
          server_name: string
          server_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          capabilities?: Json
          config?: Json | null
          created_at?: string
          customer_id?: string
          description?: string | null
          endpoint_url?: string | null
          error_message?: string | null
          id?: string
          last_health_check?: string | null
          server_name?: string
          server_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      mcp_tools: {
        Row: {
          avg_execution_time_ms: number | null
          created_at: string
          description: string
          execution_count: number
          id: string
          input_schema: Json
          is_enabled: boolean
          output_schema: Json | null
          server_id: string
          tool_name: string
        }
        Insert: {
          avg_execution_time_ms?: number | null
          created_at?: string
          description: string
          execution_count?: number
          id?: string
          input_schema: Json
          is_enabled?: boolean
          output_schema?: Json | null
          server_id: string
          tool_name: string
        }
        Update: {
          avg_execution_time_ms?: number | null
          created_at?: string
          description?: string
          execution_count?: number
          id?: string
          input_schema?: Json
          is_enabled?: boolean
          output_schema?: Json | null
          server_id?: string
          tool_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "mcp_tools_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "mcp_servers"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_insights: {
        Row: {
          affected_users: string[] | null
          category: string
          confidence_score: number | null
          created_at: string
          customer_id: string
          data_source: Json | null
          description: string
          expires_at: string | null
          id: string
          insight_type: string
          status: string
        }
        Insert: {
          affected_users?: string[] | null
          category: string
          confidence_score?: number | null
          created_at?: string
          customer_id: string
          data_source?: Json | null
          description: string
          expires_at?: string | null
          id?: string
          insight_type: string
          status?: string
        }
        Update: {
          affected_users?: string[] | null
          category?: string
          confidence_score?: number | null
          created_at?: string
          customer_id?: string
          data_source?: Json | null
          description?: string
          expires_at?: string | null
          id?: string
          insight_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ml_insights_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_models: {
        Row: {
          accuracy_score: number | null
          created_at: string
          customer_id: string
          deployed_at: string | null
          features_used: string[] | null
          hyperparameters: Json | null
          id: string
          model_name: string
          model_type: string
          status: string
          trained_at: string | null
          training_data_count: number | null
          updated_at: string
          version: string
        }
        Insert: {
          accuracy_score?: number | null
          created_at?: string
          customer_id: string
          deployed_at?: string | null
          features_used?: string[] | null
          hyperparameters?: Json | null
          id?: string
          model_name: string
          model_type: string
          status?: string
          trained_at?: string | null
          training_data_count?: number | null
          updated_at?: string
          version: string
        }
        Update: {
          accuracy_score?: number | null
          created_at?: string
          customer_id?: string
          deployed_at?: string | null
          features_used?: string[] | null
          hyperparameters?: Json | null
          id?: string
          model_name?: string
          model_type?: string
          status?: string
          trained_at?: string | null
          training_data_count?: number | null
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "ml_models_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          is_read: boolean
          link_url: string | null
          message: string
          notification_type: string
          severity: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          is_read?: boolean
          link_url?: string | null
          message: string
          notification_type: string
          severity?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          is_read?: boolean
          link_url?: string | null
          message?: string
          notification_type?: string
          severity?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_milestones: {
        Row: {
          completed_date: string | null
          created_at: string
          description: string | null
          id: string
          milestone_name: string
          onboarding_id: string
          required_task_ids: Json | null
          status: string
          target_date: string | null
        }
        Insert: {
          completed_date?: string | null
          created_at?: string
          description?: string | null
          id?: string
          milestone_name: string
          onboarding_id: string
          required_task_ids?: Json | null
          status?: string
          target_date?: string | null
        }
        Update: {
          completed_date?: string | null
          created_at?: string
          description?: string | null
          id?: string
          milestone_name?: string
          onboarding_id?: string
          required_task_ids?: Json | null
          status?: string
          target_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_milestones_onboarding_id_fkey"
            columns: ["onboarding_id"]
            isOneToOne: false
            referencedRelation: "client_onboardings"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_task_comments: {
        Row: {
          comment_text: string
          created_at: string
          id: string
          is_internal: boolean | null
          task_id: string
          user_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          task_id: string
          user_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "client_onboarding_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_template_tasks: {
        Row: {
          assigned_role: string | null
          compliance_tags: string[] | null
          created_at: string
          dependencies: Json | null
          description: string | null
          estimated_hours: number | null
          id: string
          required_documents: Json | null
          requires_client_input: boolean | null
          sequence_order: number
          task_category: string
          task_name: string
          template_id: string
        }
        Insert: {
          assigned_role?: string | null
          compliance_tags?: string[] | null
          created_at?: string
          dependencies?: Json | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          required_documents?: Json | null
          requires_client_input?: boolean | null
          sequence_order?: number
          task_category: string
          task_name: string
          template_id: string
        }
        Update: {
          assigned_role?: string | null
          compliance_tags?: string[] | null
          created_at?: string
          dependencies?: Json | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          required_documents?: Json | null
          requires_client_input?: boolean | null
          sequence_order?: number
          task_category?: string
          task_name?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_template_tasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "onboarding_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_templates: {
        Row: {
          client_type: string
          created_at: string
          created_by: string
          customer_id: string
          description: string | null
          estimated_days: number | null
          id: string
          is_active: boolean
          template_name: string
          updated_at: string
        }
        Insert: {
          client_type?: string
          created_at?: string
          created_by: string
          customer_id: string
          description?: string | null
          estimated_days?: number | null
          id?: string
          is_active?: boolean
          template_name: string
          updated_at?: string
        }
        Update: {
          client_type?: string
          created_at?: string
          created_by?: string
          customer_id?: string
          description?: string | null
          estimated_days?: number | null
          id?: string
          is_active?: boolean
          template_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_templates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      prediction_history: {
        Row: {
          actual_value: Json | null
          confidence_score: number | null
          created_at: string
          customer_id: string
          id: string
          input_features: Json
          model_id: string
          predicted_value: Json
          prediction_type: string
          was_accurate: boolean | null
        }
        Insert: {
          actual_value?: Json | null
          confidence_score?: number | null
          created_at?: string
          customer_id: string
          id?: string
          input_features: Json
          model_id: string
          predicted_value: Json
          prediction_type: string
          was_accurate?: boolean | null
        }
        Update: {
          actual_value?: Json | null
          confidence_score?: number | null
          created_at?: string
          customer_id?: string
          id?: string
          input_features?: Json
          model_id?: string
          predicted_value?: Json
          prediction_type?: string
          was_accurate?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "prediction_history_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prediction_history_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ml_models"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_level: string
          resource_name: string
          resource_type: string
          role_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_level?: string
          resource_name: string
          resource_type: string
          role_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_level?: string
          resource_name?: string
          resource_type?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      sharepoint_sync_config: {
        Row: {
          created_at: string
          customer_id: string
          filter_extensions: string[] | null
          id: string
          last_sync_at: string | null
          library_id: string | null
          library_name: string | null
          site_id: string
          site_name: string
          site_url: string
          sync_enabled: boolean
          sync_frequency_minutes: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          filter_extensions?: string[] | null
          id?: string
          last_sync_at?: string | null
          library_id?: string | null
          library_name?: string | null
          site_id: string
          site_name: string
          site_url: string
          sync_enabled?: boolean
          sync_frequency_minutes?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          filter_extensions?: string[] | null
          id?: string
          last_sync_at?: string | null
          library_id?: string | null
          library_name?: string | null
          site_id?: string
          site_name?: string
          site_url?: string
          sync_enabled?: boolean
          sync_frequency_minutes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sharepoint_sync_config_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      sharepoint_sync_logs: {
        Row: {
          created_at: string
          error_message: string | null
          files_failed: number | null
          files_synced: number | null
          id: string
          status: string
          sync_completed_at: string | null
          sync_config_id: string
          sync_details: Json | null
          sync_started_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          files_failed?: number | null
          files_synced?: number | null
          id?: string
          status?: string
          sync_completed_at?: string | null
          sync_config_id: string
          sync_details?: Json | null
          sync_started_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          files_failed?: number | null
          files_synced?: number | null
          id?: string
          status?: string
          sync_completed_at?: string | null
          sync_config_id?: string
          sync_details?: Json | null
          sync_started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sharepoint_sync_logs_sync_config_id_fkey"
            columns: ["sync_config_id"]
            isOneToOne: false
            referencedRelation: "sharepoint_sync_config"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          features: Json
          id: string
          is_active: boolean
          max_controls: number | null
          max_frameworks: number | null
          max_team_members: number | null
          plan_name: string
          plan_tier: string
          price_monthly: number | null
          price_yearly: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          features: Json
          id?: string
          is_active?: boolean
          max_controls?: number | null
          max_frameworks?: number | null
          max_team_members?: number | null
          plan_name: string
          plan_tier: string
          price_monthly?: number | null
          price_yearly?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          max_controls?: number | null
          max_frameworks?: number | null
          max_team_members?: number | null
          plan_name?: string
          plan_tier?: string
          price_monthly?: number | null
          price_yearly?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      system_access_logs: {
        Row: {
          access_type: string
          created_at: string
          customer_id: string
          id: string
          resource_accessed: string | null
          success: boolean
          system_name: string
          timestamp: string
          user_id: string
        }
        Insert: {
          access_type: string
          created_at?: string
          customer_id: string
          id?: string
          resource_accessed?: string | null
          success?: boolean
          system_name: string
          timestamp?: string
          user_id: string
        }
        Update: {
          access_type?: string
          created_at?: string
          customer_id?: string
          id?: string
          resource_accessed?: string | null
          success?: boolean
          system_name?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_access_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          author_name: string
          author_role: string
          company_name: string
          created_at: string
          display_order: number | null
          id: string
          is_featured: boolean
          is_published: boolean
          quote: string
          rating: number
          updated_at: string
        }
        Insert: {
          author_name: string
          author_role: string
          company_name: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          quote: string
          rating: number
          updated_at?: string
        }
        Update: {
          author_name?: string
          author_role?: string
          company_name?: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          quote?: string
          rating?: number
          updated_at?: string
        }
        Relationships: []
      }
      use_cases: {
        Row: {
          created_at: string
          description: string
          display_order: number | null
          frameworks: string[] | null
          icon_name: string | null
          id: string
          industry: string
          is_featured: boolean
          is_published: boolean
          key_features: string[] | null
          metrics: Json | null
          problem_statement: string
          solution_approach: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          display_order?: number | null
          frameworks?: string[] | null
          icon_name?: string | null
          id?: string
          industry: string
          is_featured?: boolean
          is_published?: boolean
          key_features?: string[] | null
          metrics?: Json | null
          problem_statement: string
          solution_approach: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number | null
          frameworks?: string[] | null
          icon_name?: string | null
          id?: string
          industry?: string
          is_featured?: boolean
          is_published?: boolean
          key_features?: string[] | null
          metrics?: Json | null
          problem_statement?: string
          solution_approach?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          customer_id: string | null
          department: string | null
          full_name: string | null
          id: string
          job_title: string | null
          preferences: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          customer_id?: string | null
          department?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          preferences?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          customer_id?: string | null
          department?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          preferences?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          ip_address: string | null
          session_end: string | null
          session_start: string
          status: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          ip_address?: string | null
          session_end?: string | null
          session_start?: string
          status?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          ip_address?: string | null
          session_end?: string | null
          session_start?: string
          status?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_conditions: {
        Row: {
          condition_expression: Json
          condition_type: string
          created_at: string
          false_path: Json | null
          id: string
          step_id: string
          true_path: Json | null
          workflow_id: string
        }
        Insert: {
          condition_expression: Json
          condition_type: string
          created_at?: string
          false_path?: Json | null
          id?: string
          step_id: string
          true_path?: Json | null
          workflow_id: string
        }
        Update: {
          condition_expression?: Json
          condition_type?: string
          created_at?: string
          false_path?: Json | null
          id?: string
          step_id?: string
          true_path?: Json | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_conditions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_executions: {
        Row: {
          completed_at: string | null
          created_at: string
          customer_id: string
          error_message: string | null
          execution_log: Json | null
          id: string
          started_at: string
          status: string
          trigger_data: Json | null
          triggered_by: string
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          customer_id: string
          error_message?: string | null
          execution_log?: Json | null
          id?: string
          started_at?: string
          status?: string
          trigger_data?: Json | null
          triggered_by: string
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          customer_id?: string
          error_message?: string | null
          execution_log?: Json | null
          id?: string
          started_at?: string
          status?: string
          trigger_data?: Json | null
          triggered_by?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_triggers: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          is_enabled: boolean
          last_triggered_at: string | null
          trigger_config: Json
          trigger_type: string
          updated_at: string
          webhook_secret: string | null
          webhook_url: string | null
          workflow_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          is_enabled?: boolean
          last_triggered_at?: string | null
          trigger_config?: Json
          trigger_type: string
          updated_at?: string
          webhook_secret?: string | null
          webhook_url?: string | null
          workflow_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          is_enabled?: boolean
          last_triggered_at?: string | null
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string
          webhook_secret?: string | null
          webhook_url?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_triggers_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          avg_completion_time: number | null
          created_at: string
          customer_id: string
          description: string | null
          id: string
          is_active: boolean
          steps: Json | null
          successful_executions: number | null
          systems_involved: string[] | null
          tags: string[] | null
          total_executions: number | null
          updated_at: string
          version: number | null
          workflow_name: string
          workflow_type: string | null
        }
        Insert: {
          avg_completion_time?: number | null
          created_at?: string
          customer_id: string
          description?: string | null
          id?: string
          is_active?: boolean
          steps?: Json | null
          successful_executions?: number | null
          systems_involved?: string[] | null
          tags?: string[] | null
          total_executions?: number | null
          updated_at?: string
          version?: number | null
          workflow_name: string
          workflow_type?: string | null
        }
        Update: {
          avg_completion_time?: number | null
          created_at?: string
          customer_id?: string
          description?: string | null
          id?: string
          is_active?: boolean
          steps?: Json | null
          successful_executions?: number | null
          systems_involved?: string[] | null
          tags?: string[] | null
          total_executions?: number | null
          updated_at?: string
          version?: number | null
          workflow_name?: string
          workflow_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflows_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_integration_credential: {
        Args: { _customer_id: string; _integration_id: string }
        Returns: {
          credential_type: string
          customer_id: string
          encrypted_data: string
          expires_at: string
          id: string
          integration_id: string
        }[]
      }
      get_user_customer_id: {
        Args: { _user_id: string }
        Returns: string
      }
      has_permission: {
        Args: {
          _min_permission?: string
          _resource_name: string
          _resource_type: string
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "customer"
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
      app_role: ["admin", "customer"],
    },
  },
} as const
