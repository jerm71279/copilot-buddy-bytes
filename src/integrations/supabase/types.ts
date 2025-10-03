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
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
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
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
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
      workflows: {
        Row: {
          avg_completion_time: number | null
          created_at: string
          customer_id: string
          description: string | null
          id: string
          steps: Json | null
          successful_executions: number | null
          systems_involved: string[] | null
          total_executions: number | null
          updated_at: string
          workflow_name: string
        }
        Insert: {
          avg_completion_time?: number | null
          created_at?: string
          customer_id: string
          description?: string | null
          id?: string
          steps?: Json | null
          successful_executions?: number | null
          systems_involved?: string[] | null
          total_executions?: number | null
          updated_at?: string
          workflow_name: string
        }
        Update: {
          avg_completion_time?: number | null
          created_at?: string
          customer_id?: string
          description?: string | null
          id?: string
          steps?: Json | null
          successful_executions?: number | null
          systems_involved?: string[] | null
          total_executions?: number | null
          updated_at?: string
          workflow_name?: string
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
