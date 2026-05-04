export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5';
  };
  public: {
    Tables: {
      absence_justifications: {
        Row: {
          absence_date: string;
          absence_type: string;
          created_at: string | null;
          description: string | null;
          document_url: string | null;
          employee_id: string;
          id: string;
          is_paid: boolean | null;
          justification_type: string;
          rejection_reason: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          absence_date: string;
          absence_type: string;
          created_at?: string | null;
          description?: string | null;
          document_url?: string | null;
          employee_id: string;
          id?: string;
          is_paid?: boolean | null;
          justification_type: string;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          absence_date?: string;
          absence_type?: string;
          created_at?: string | null;
          description?: string | null;
          document_url?: string | null;
          employee_id?: string;
          id?: string;
          is_paid?: boolean | null;
          justification_type?: string;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'absence_justifications_employee_id_fkey';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'absence_justifications_reviewed_by_fkey';
            columns: ['reviewed_by'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['id'];
          },
        ];
      };
      absence_types: {
        Row: {
          code: string;
          color: string | null;
          created_at: string;
          deducts_from_balance: boolean | null;
          id: string;
          max_days_per_year: number | null;
          name: string;
          requires_approval: boolean | null;
          updated_at: string;
        };
        Insert: {
          code: string;
          color?: string | null;
          created_at?: string;
          deducts_from_balance?: boolean | null;
          id?: string;
          max_days_per_year?: number | null;
          name: string;
          requires_approval?: boolean | null;
          updated_at?: string;
        };
        Update: {
          code?: string;
          color?: string | null;
          created_at?: string;
          deducts_from_balance?: boolean | null;
          id?: string;
          max_days_per_year?: number | null;
          name?: string;
          requires_approval?: boolean | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      absences: {
        Row: {
          absence_type_id: string;
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          employee_id: string;
          end_date: string;
          id: string;
          medical_certificate: boolean | null;
          reason: string | null;
          rejection_reason: string | null;
          start_date: string;
          status: string;
          tenant_id: string | null;
          total_days: number;
          updated_at: string;
        };
        Insert: {
          absence_type_id: string;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          employee_id: string;
          end_date: string;
          id?: string;
          medical_certificate?: boolean | null;
          reason?: string | null;
          rejection_reason?: string | null;
          start_date: string;
          status?: string;
          tenant_id?: string | null;
          total_days?: number;
          updated_at?: string;
        };
        Update: {
          absence_type_id?: string;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          employee_id?: string;
          end_date?: string;
          id?: string;
          medical_certificate?: boolean | null;
          reason?: string | null;
          rejection_reason?: string | null;
          start_date?: string;
          status?: string;
          tenant_id?: string | null;
          total_days?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_absences_employee';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['user_id'];
          },
        ];
      };
      administrative_requests: {
        Row: {
          amount: number | null;
          completion_date: string | null;
          created_at: string | null;
          description: string;
          document_url: string | null;
          employee_id: string;
          id: string;
          priority: string | null;
          processed_at: string | null;
          processed_by: string | null;
          request_type: string;
          response: string | null;
          status: string | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          amount?: number | null;
          completion_date?: string | null;
          created_at?: string | null;
          description: string;
          document_url?: string | null;
          employee_id: string;
          id?: string;
          priority?: string | null;
          processed_at?: string | null;
          processed_by?: string | null;
          request_type: string;
          response?: string | null;
          status?: string | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          amount?: number | null;
          completion_date?: string | null;
          created_at?: string | null;
          description?: string;
          document_url?: string | null;
          employee_id?: string;
          id?: string;
          priority?: string | null;
          processed_at?: string | null;
          processed_by?: string | null;
          request_type?: string;
          response?: string | null;
          status?: string | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'administrative_requests_employee_id_fkey';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'administrative_requests_processed_by_fkey';
            columns: ['processed_by'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['id'];
          },
        ];
      };
      alert_instance_recommendations: {
        Row: {
          alert_instance_id: string;
          created_at: string;
          id: string;
          is_primary: boolean | null;
          recommended_score: number | null;
          solution_id: string;
          tenant_id: string | null;
        };
        Insert: {
          alert_instance_id: string;
          created_at?: string;
          id?: string;
          is_primary?: boolean | null;
          recommended_score?: number | null;
          solution_id: string;
          tenant_id?: string | null;
        };
        Update: {
          alert_instance_id?: string;
          created_at?: string;
          id?: string;
          is_primary?: boolean | null;
          recommended_score?: number | null;
          solution_id?: string;
          tenant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'alert_instance_recommendations_alert_instance_id_fkey';
            columns: ['alert_instance_id'];
            isOneToOne: false;
            referencedRelation: 'alert_instances';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'alert_instance_recommendations_solution_id_fkey';
            columns: ['solution_id'];
            isOneToOne: false;
            referencedRelation: 'alert_solutions';
            referencedColumns: ['id'];
          },
        ];
      };
      alert_instances: {
        Row: {
          acknowledged_at: string | null;
          alert_type_id: string;
          application_domain: string;
          context_data: Json | null;
          created_at: string;
          description: string | null;
          entity_id: string | null;
          entity_name: string | null;
          entity_type: string | null;
          id: string;
          resolved_at: string | null;
          resolved_by: string | null;
          severity: string;
          status: string;
          tenant_id: string | null;
          title: string;
          triggered_at: string;
          updated_at: string;
        };
        Insert: {
          acknowledged_at?: string | null;
          alert_type_id: string;
          application_domain?: string;
          context_data?: Json | null;
          created_at?: string;
          description?: string | null;
          entity_id?: string | null;
          entity_name?: string | null;
          entity_type?: string | null;
          id?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          severity: string;
          status?: string;
          tenant_id?: string | null;
          title: string;
          triggered_at?: string;
          updated_at?: string;
        };
        Update: {
          acknowledged_at?: string | null;
          alert_type_id?: string;
          application_domain?: string;
          context_data?: Json | null;
          created_at?: string;
          description?: string | null;
          entity_id?: string | null;
          entity_name?: string | null;
          entity_type?: string | null;
          id?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          severity?: string;
          status?: string;
          tenant_id?: string | null;
          title?: string;
          triggered_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'alert_instances_alert_type_id_fkey';
            columns: ['alert_type_id'];
            isOneToOne: false;
            referencedRelation: 'alert_types';
            referencedColumns: ['id'];
          },
        ];
      };
      alert_solutions: {
        Row: {
          action_steps: Json | null;
          category: string;
          cost_level: string | null;
          created_at: string;
          description: string;
          effectiveness_score: number | null;
          id: string;
          implementation_time: string | null;
          required_roles: string[] | null;
          tenant_id: string | null;
          title: string;
        };
        Insert: {
          action_steps?: Json | null;
          category: string;
          cost_level?: string | null;
          created_at?: string;
          description: string;
          effectiveness_score?: number | null;
          id?: string;
          implementation_time?: string | null;
          required_roles?: string[] | null;
          tenant_id?: string | null;
          title: string;
        };
        Update: {
          action_steps?: Json | null;
          category?: string;
          cost_level?: string | null;
          created_at?: string;
          description?: string;
          effectiveness_score?: number | null;
          id?: string;
          implementation_time?: string | null;
          required_roles?: string[] | null;
          tenant_id?: string | null;
          title?: string;
        };
        Relationships: [];
      };
      alert_type_solutions: {
        Row: {
          alert_type_id: string;
          context_conditions: Json | null;
          id: string;
          priority_order: number | null;
          solution_id: string;
        };
        Insert: {
          alert_type_id: string;
          context_conditions?: Json | null;
          id?: string;
          priority_order?: number | null;
          solution_id: string;
        };
        Update: {
          alert_type_id?: string;
          context_conditions?: Json | null;
          id?: string;
          priority_order?: number | null;
          solution_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'alert_type_solutions_alert_type_id_fkey';
            columns: ['alert_type_id'];
            isOneToOne: false;
            referencedRelation: 'alert_types';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'alert_type_solutions_solution_id_fkey';
            columns: ['solution_id'];
            isOneToOne: false;
            referencedRelation: 'alert_solutions';
            referencedColumns: ['id'];
          },
        ];
      };
      alert_types: {
        Row: {
          application_domain: string;
          auto_trigger_conditions: Json | null;
          category: string;
          code: string;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          severity: string;
        };
        Insert: {
          application_domain?: string;
          auto_trigger_conditions?: Json | null;
          category: string;
          code: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          severity?: string;
        };
        Update: {
          application_domain?: string;
          auto_trigger_conditions?: Json | null;
          category?: string;
          code?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          severity?: string;
        };
        Relationships: [];
      };
      app_secrets: {
        Row: {
          key: string;
          value: string;
        };
        Insert: {
          key: string;
          value: string;
        };
        Update: {
          key?: string;
          value?: string;
        };
        Relationships: [];
      };
      attendances: {
        Row: {
          break_duration: number | null;
          check_in: string | null;
          check_out: string | null;
          created_at: string;
          date: string;
          employee_id: string;
          id: string;
          notes: string | null;
          status: string | null;
          tenant_id: string | null;
          total_hours: number | null;
          updated_at: string;
        };
        Insert: {
          break_duration?: number | null;
          check_in?: string | null;
          check_out?: string | null;
          created_at?: string;
          date: string;
          employee_id: string;
          id?: string;
          notes?: string | null;
          status?: string | null;
          tenant_id?: string | null;
          total_hours?: number | null;
          updated_at?: string;
        };
        Update: {
          break_duration?: number | null;
          check_in?: string | null;
          check_out?: string | null;
          created_at?: string;
          date?: string;
          employee_id?: string;
          id?: string;
          notes?: string | null;
          status?: string | null;
          tenant_id?: string | null;
          total_hours?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_attendances_employee';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['user_id'];
          },
        ];
      };
      candidates: {
        Row: {
          applied_date: string;
          cover_letter: string | null;
          created_at: string;
          email: string;
          first_name: string;
          id: string;
          last_name: string;
          linkedin_url: string | null;
          phone: string | null;
          resume_url: string | null;
          source: string | null;
          status: string;
          tenant_id: string | null;
          updated_at: string;
        };
        Insert: {
          applied_date?: string;
          cover_letter?: string | null;
          created_at?: string;
          email: string;
          first_name: string;
          id?: string;
          last_name: string;
          linkedin_url?: string | null;
          phone?: string | null;
          resume_url?: string | null;
          source?: string | null;
          status?: string;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Update: {
          applied_date?: string;
          cover_letter?: string | null;
          created_at?: string;
          email?: string;
          first_name?: string;
          id?: string;
          last_name?: string;
          linkedin_url?: string | null;
          phone?: string | null;
          resume_url?: string | null;
          source?: string | null;
          status?: string;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      capacity_planning: {
        Row: {
          absence_hours: number;
          allocated_hours: number;
          available_hours: number;
          capacity_utilization: number | null;
          created_at: string;
          employee_id: string;
          id: string;
          period_end: string;
          period_start: string;
          project_hours: number;
          tenant_id: string | null;
          updated_at: string;
        };
        Insert: {
          absence_hours?: number;
          allocated_hours?: number;
          available_hours?: number;
          capacity_utilization?: number | null;
          created_at?: string;
          employee_id: string;
          id?: string;
          period_end: string;
          period_start: string;
          project_hours?: number;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Update: {
          absence_hours?: number;
          allocated_hours?: number;
          available_hours?: number;
          capacity_utilization?: number | null;
          created_at?: string;
          employee_id?: string;
          id?: string;
          period_end?: string;
          period_start?: string;
          project_hours?: number;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      corrective_actions: {
        Row: {
          completed_date: string | null;
          created_at: string;
          description: string;
          due_date: string;
          id: string;
          incident_id: string;
          responsible_person: string;
          status: string;
          tenant_id: string | null;
          updated_at: string;
        };
        Insert: {
          completed_date?: string | null;
          created_at?: string;
          description: string;
          due_date: string;
          id?: string;
          incident_id: string;
          responsible_person: string;
          status?: string;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Update: {
          completed_date?: string | null;
          created_at?: string;
          description?: string;
          due_date?: string;
          id?: string;
          incident_id?: string;
          responsible_person?: string;
          status?: string;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'corrective_actions_incident_id_fkey';
            columns: ['incident_id'];
            isOneToOne: false;
            referencedRelation: 'safety_incidents';
            referencedColumns: ['id'];
          },
        ];
      };
      country_policies: {
        Row: {
          compliance_rules: string | null;
          country_code: string;
          country_name: string;
          created_at: string;
          currency: string;
          id: string;
          language: string;
          leave_policies: Json | null;
          public_holidays: Json | null;
          tax_rates: Json | null;
          tenant_id: string | null;
          updated_at: string;
          working_hours_per_week: number | null;
        };
        Insert: {
          compliance_rules?: string | null;
          country_code: string;
          country_name: string;
          created_at?: string;
          currency?: string;
          id?: string;
          language?: string;
          leave_policies?: Json | null;
          public_holidays?: Json | null;
          tax_rates?: Json | null;
          tenant_id?: string | null;
          updated_at?: string;
          working_hours_per_week?: number | null;
        };
        Update: {
          compliance_rules?: string | null;
          country_code?: string;
          country_name?: string;
          created_at?: string;
          currency?: string;
          id?: string;
          language?: string;
          leave_policies?: Json | null;
          public_holidays?: Json | null;
          tax_rates?: Json | null;
          tenant_id?: string | null;
          updated_at?: string;
          working_hours_per_week?: number | null;
        };
        Relationships: [];
      };
      debug_logs: {
        Row: {
          created_at: string | null;
          details: Json | null;
          id: string;
          log_level: string;
          log_type: string;
          message: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          details?: Json | null;
          id?: string;
          log_level: string;
          log_type: string;
          message: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          details?: Json | null;
          id?: string;
          log_level?: string;
          log_type?: string;
          message?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      departments: {
        Row: {
          budget: number | null;
          created_at: string;
          description: string | null;
          id: string;
          manager_id: string | null;
          name: string;
          tenant_id: string | null;
          updated_at: string;
        };
        Insert: {
          budget?: number | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          manager_id?: string | null;
          name: string;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Update: {
          budget?: number | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          manager_id?: string | null;
          name?: string;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'departments_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      development_plans: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          created_by: string;
          description: string | null;
          employee_id: string;
          id: string;
          progress_percentage: number | null;
          reviewed_at: string | null;
          start_date: string;
          status: string | null;
          target_date: string;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          created_by: string;
          description?: string | null;
          employee_id: string;
          id?: string;
          progress_percentage?: number | null;
          reviewed_at?: string | null;
          start_date: string;
          status?: string | null;
          target_date: string;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          created_by?: string;
          description?: string | null;
          employee_id?: string;
          id?: string;
          progress_percentage?: number | null;
          reviewed_at?: string | null;
          start_date?: string;
          status?: string | null;
          target_date?: string;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'development_plans_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'development_plans_employee_id_fkey';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['id'];
          },
        ];
      };
      employee_access_logs: {
        Row: {
          access_context: string | null;
          access_type: string;
          accessed_at: string | null;
          accessed_by: string;
          employee_id: string | null;
          id: string;
          tenant_id: string | null;
        };
        Insert: {
          access_context?: string | null;
          access_type: string;
          accessed_at?: string | null;
          accessed_by: string;
          employee_id?: string | null;
          id?: string;
          tenant_id?: string | null;
        };
        Update: {
          access_context?: string | null;
          access_type?: string;
          accessed_at?: string | null;
          accessed_by?: string;
          employee_id?: string | null;
          id?: string;
          tenant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'employee_access_logs_employee_id_fkey';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['id'];
          },
        ];
      };
      employee_documents: {
        Row: {
          created_at: string;
          document_type: string;
          employee_id: string;
          expires_at: string | null;
          file_name: string;
          file_path: string;
          file_size: number | null;
          id: string;
          is_confidential: boolean | null;
          mime_type: string | null;
          tenant_id: string | null;
          updated_at: string;
          uploaded_by: string | null;
        };
        Insert: {
          created_at?: string;
          document_type: string;
          employee_id: string;
          expires_at?: string | null;
          file_name: string;
          file_path: string;
          file_size?: number | null;
          id?: string;
          is_confidential?: boolean | null;
          mime_type?: string | null;
          tenant_id?: string | null;
          updated_at?: string;
          uploaded_by?: string | null;
        };
        Update: {
          created_at?: string;
          document_type?: string;
          employee_id?: string;
          expires_at?: string | null;
          file_name?: string;
          file_path?: string;
          file_size?: number | null;
          id?: string;
          is_confidential?: boolean | null;
          mime_type?: string | null;
          tenant_id?: string | null;
          updated_at?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_employee_documents_employee';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['user_id'];
          },
        ];
      };
      employee_insights: {
        Row: {
          created_at: string;
          data_sources: Json | null;
          description: string | null;
          employee_id: string;
          id: string;
          insight_type: string;
          is_active: boolean | null;
          recommendations: string | null;
          risk_level: string;
          score: number | null;
          tenant_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          data_sources?: Json | null;
          description?: string | null;
          employee_id: string;
          id?: string;
          insight_type: string;
          is_active?: boolean | null;
          recommendations?: string | null;
          risk_level?: string;
          score?: number | null;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          data_sources?: Json | null;
          description?: string | null;
          employee_id?: string;
          id?: string;
          insight_type?: string;
          is_active?: boolean | null;
          recommendations?: string | null;
          risk_level?: string;
          score?: number | null;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      employee_payrolls: {
        Row: {
          base_salary: number;
          created_at: string;
          employee_id: string;
          employee_name: string;
          gross_total: number;
          hours_worked: number;
          id: string;
          net_total: number;
          overtime_hours: number | null;
          period_id: string;
          position: string;
          social_charges: number;
          standard_hours: number;
          tenant_id: string | null;
          updated_at: string;
        };
        Insert: {
          base_salary: number;
          created_at?: string;
          employee_id: string;
          employee_name: string;
          gross_total: number;
          hours_worked: number;
          id?: string;
          net_total: number;
          overtime_hours?: number | null;
          period_id: string;
          position: string;
          social_charges: number;
          standard_hours: number;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Update: {
          base_salary?: number;
          created_at?: string;
          employee_id?: string;
          employee_name?: string;
          gross_total?: number;
          hours_worked?: number;
          id?: string;
          net_total?: number;
          overtime_hours?: number | null;
          period_id?: string;
          position?: string;
          social_charges?: number;
          standard_hours?: number;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'employee_payrolls_period_id_fkey';
            columns: ['period_id'];
            isOneToOne: false;
            referencedRelation: 'payroll_periods';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_employee_payrolls_employee';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['user_id'];
          },
        ];
      };
      employee_skills: {
        Row: {
          certified_at: string | null;
          certified_by: string | null;
          created_at: string | null;
          employee_id: string;
          id: string;
          is_certified: boolean | null;
          last_used_date: string | null;
          level: string;
          notes: string | null;
          skill_id: string;
          updated_at: string | null;
          years_experience: number | null;
        };
        Insert: {
          certified_at?: string | null;
          certified_by?: string | null;
          created_at?: string | null;
          employee_id: string;
          id?: string;
          is_certified?: boolean | null;
          last_used_date?: string | null;
          level?: string;
          notes?: string | null;
          skill_id: string;
          updated_at?: string | null;
          years_experience?: number | null;
        };
        Update: {
          certified_at?: string | null;
          certified_by?: string | null;
          created_at?: string | null;
          employee_id?: string;
          id?: string;
          is_certified?: boolean | null;
          last_used_date?: string | null;
          level?: string;
          notes?: string | null;
          skill_id?: string;
          updated_at?: string | null;
          years_experience?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'employee_skills_certified_by_fkey';
            columns: ['certified_by'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'employee_skills_employee_id_fkey';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'employee_skills_skill_id_fkey';
            columns: ['skill_id'];
            isOneToOne: false;
            referencedRelation: 'skills';
            referencedColumns: ['id'];
          },
        ];
      };
      employees: {
        Row: {
          avatar_url: string | null;
          contract_type: string | null;
          created_at: string;
          department_id: string | null;
          email: string;
          emergency_contact: Json | null;
          employee_id: string;
          full_name: string;
          hire_date: string | null;
          id: string;
          job_title: string | null;
          manager_id: string | null;
          phone: string | null;
          salary: number | null;
          status: string | null;
          tenant_id: string | null;
          updated_at: string;
          user_id: string | null;
          weekly_hours: number | null;
        };
        Insert: {
          avatar_url?: string | null;
          contract_type?: string | null;
          created_at?: string;
          department_id?: string | null;
          email: string;
          emergency_contact?: Json | null;
          employee_id: string;
          full_name: string;
          hire_date?: string | null;
          id?: string;
          job_title?: string | null;
          manager_id?: string | null;
          phone?: string | null;
          salary?: number | null;
          status?: string | null;
          tenant_id?: string | null;
          updated_at?: string;
          user_id?: string | null;
          weekly_hours?: number | null;
        };
        Update: {
          avatar_url?: string | null;
          contract_type?: string | null;
          created_at?: string;
          department_id?: string | null;
          email?: string;
          emergency_contact?: Json | null;
          employee_id?: string;
          full_name?: string;
          hire_date?: string | null;
          id?: string;
          job_title?: string | null;
          manager_id?: string | null;
          phone?: string | null;
          salary?: number | null;
          status?: string | null;
          tenant_id?: string | null;
          updated_at?: string;
          user_id?: string | null;
          weekly_hours?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'employees_department_id_fkey';
            columns: ['department_id'];
            isOneToOne: false;
            referencedRelation: 'departments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'employees_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      evaluation_categories: {
        Row: {
          created_at: string;
          evaluation_id: string;
          feedback: string | null;
          id: string;
          name: string;
          score: number;
          weight: number;
        };
        Insert: {
          created_at?: string;
          evaluation_id: string;
          feedback?: string | null;
          id?: string;
          name: string;
          score: number;
          weight: number;
        };
        Update: {
          created_at?: string;
          evaluation_id?: string;
          feedback?: string | null;
          id?: string;
          name?: string;
          score?: number;
          weight?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'evaluation_categories_evaluation_id_fkey';
            columns: ['evaluation_id'];
            isOneToOne: false;
            referencedRelation: 'evaluations';
            referencedColumns: ['id'];
          },
        ];
      };
      evaluations: {
        Row: {
          created_at: string;
          employee_id: string | null;
          employee_name: string;
          evaluator_id: string | null;
          evaluator_name: string;
          id: string;
          overall_score: number | null;
          period: string;
          status: string;
          tenant_id: string | null;
          type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          employee_id?: string | null;
          employee_name: string;
          evaluator_id?: string | null;
          evaluator_name: string;
          id?: string;
          overall_score?: number | null;
          period: string;
          status?: string;
          tenant_id?: string | null;
          type: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          employee_id?: string | null;
          employee_name?: string;
          evaluator_id?: string | null;
          evaluator_name?: string;
          id?: string;
          overall_score?: number | null;
          period?: string;
          status?: string;
          tenant_id?: string | null;
          type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'evaluations_employee_id_fkey';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'evaluations_evaluator_id_fkey';
            columns: ['evaluator_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['user_id'];
          },
        ];
      };
      expense_categories: {
        Row: {
          color: string | null;
          created_at: string;
          icon: string | null;
          id: string;
          max_amount: number | null;
          name: string;
          requires_receipt: boolean | null;
          tenant_id: string | null;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          icon?: string | null;
          id?: string;
          max_amount?: number | null;
          name: string;
          requires_receipt?: boolean | null;
          tenant_id?: string | null;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          icon?: string | null;
          id?: string;
          max_amount?: number | null;
          name?: string;
          requires_receipt?: boolean | null;
          tenant_id?: string | null;
        };
        Relationships: [];
      };
      expense_items: {
        Row: {
          amount: number;
          category_id: string | null;
          category_name: string;
          created_at: string;
          currency: string;
          description: string;
          employee_id: string | null;
          expense_date: string;
          id: string;
          location: string | null;
          mileage: number | null;
          receipt_url: string | null;
          report_id: string;
          tenant_id: string | null;
        };
        Insert: {
          amount: number;
          category_id?: string | null;
          category_name: string;
          created_at?: string;
          currency?: string;
          description: string;
          employee_id?: string | null;
          expense_date: string;
          id?: string;
          location?: string | null;
          mileage?: number | null;
          receipt_url?: string | null;
          report_id: string;
          tenant_id?: string | null;
        };
        Update: {
          amount?: number;
          category_id?: string | null;
          category_name?: string;
          created_at?: string;
          currency?: string;
          description?: string;
          employee_id?: string | null;
          expense_date?: string;
          id?: string;
          location?: string | null;
          mileage?: number | null;
          receipt_url?: string | null;
          report_id?: string;
          tenant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'expense_items_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'expense_categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expense_items_employee_id_fkey';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['user_id'];
          },
        ];
      };
      expense_reports: {
        Row: {
          amount: number;
          approved_by_finance: string | null;
          approved_by_manager: string | null;
          approved_finance_at: string | null;
          approved_manager_at: string | null;
          category: string;
          created_at: string | null;
          currency: string | null;
          description: string | null;
          employee_id: string;
          employee_name: string | null;
          expense_date: string;
          id: string;
          notes: string | null;
          payment_date: string | null;
          payment_reference: string | null;
          receipt_url: string | null;
          rejection_reason: string | null;
          status: string | null;
          submitted_at: string | null;
          tenant_id: string | null;
          title: string;
          total_amount: number | null;
          updated_at: string | null;
        };
        Insert: {
          amount: number;
          approved_by_finance?: string | null;
          approved_by_manager?: string | null;
          approved_finance_at?: string | null;
          approved_manager_at?: string | null;
          category: string;
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          employee_id: string;
          employee_name?: string | null;
          expense_date: string;
          id?: string;
          notes?: string | null;
          payment_date?: string | null;
          payment_reference?: string | null;
          receipt_url?: string | null;
          rejection_reason?: string | null;
          status?: string | null;
          submitted_at?: string | null;
          tenant_id?: string | null;
          title: string;
          total_amount?: number | null;
          updated_at?: string | null;
        };
        Update: {
          amount?: number;
          approved_by_finance?: string | null;
          approved_by_manager?: string | null;
          approved_finance_at?: string | null;
          approved_manager_at?: string | null;
          category?: string;
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          employee_id?: string;
          employee_name?: string | null;
          expense_date?: string;
          id?: string;
          notes?: string | null;
          payment_date?: string | null;
          payment_reference?: string | null;
          receipt_url?: string | null;
          rejection_reason?: string | null;
          status?: string | null;
          submitted_at?: string | null;
          tenant_id?: string | null;
          title?: string;
          total_amount?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'expense_reports_approved_by_finance_fkey';
            columns: ['approved_by_finance'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expense_reports_approved_by_manager_fkey';
            columns: ['approved_by_manager'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expense_reports_employee_id_fkey';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'expense_reports_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      hr_analytics: {
        Row: {
          calculated_at: string;
          department_id: string | null;
          id: string;
          metadata: Json | null;
          metric_name: string;
          metric_type: string;
          metric_value: number;
          period_end: string;
          period_start: string;
          tenant_id: string | null;
        };
        Insert: {
          calculated_at?: string;
          department_id?: string | null;
          id?: string;
          metadata?: Json | null;
          metric_name: string;
          metric_type: string;
          metric_value: number;
          period_end: string;
          period_start: string;
          tenant_id?: string | null;
        };
        Update: {
          calculated_at?: string;
          department_id?: string | null;
          id?: string;
          metadata?: Json | null;
          metric_name?: string;
          metric_type?: string;
          metric_value?: number;
          period_end?: string;
          period_start?: string;
          tenant_id?: string | null;
        };
        Relationships: [];
      };
      interviews: {
        Row: {
          application_id: string;
          created_at: string;
          duration_minutes: number | null;
          feedback: string | null;
          id: string;
          interviewer_id: string | null;
          interviewer_name: string;
          location: string | null;
          recommendation: string | null;
          scheduled_date: string;
          scheduled_time: string | null;
          score: number | null;
          status: string;
          tenant_id: string | null;
          type: string;
          updated_at: string;
        };
        Insert: {
          application_id: string;
          created_at?: string;
          duration_minutes?: number | null;
          feedback?: string | null;
          id?: string;
          interviewer_id?: string | null;
          interviewer_name: string;
          location?: string | null;
          recommendation?: string | null;
          scheduled_date: string;
          scheduled_time?: string | null;
          score?: number | null;
          status?: string;
          tenant_id?: string | null;
          type?: string;
          updated_at?: string;
        };
        Update: {
          application_id?: string;
          created_at?: string;
          duration_minutes?: number | null;
          feedback?: string | null;
          id?: string;
          interviewer_id?: string | null;
          interviewer_name?: string;
          location?: string | null;
          recommendation?: string | null;
          scheduled_date?: string;
          scheduled_time?: string | null;
          score?: number | null;
          status?: string;
          tenant_id?: string | null;
          type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      invitations: {
        Row: {
          accepted_at: string | null;
          created_at: string;
          department: string | null;
          email: string;
          expires_at: string;
          full_name: string;
          id: string;
          invitation_type: string;
          invited_by: string | null;
          invited_by_user_id: string | null;
          job_position: string | null;
          metadata: Json | null;
          role_to_assign: string | null;
          status: string;
          tenant_id: string;
          tenant_name: string | null;
          token: string;
        };
        Insert: {
          accepted_at?: string | null;
          created_at?: string;
          department?: string | null;
          email: string;
          expires_at?: string;
          full_name: string;
          id?: string;
          invitation_type: string;
          invited_by?: string | null;
          invited_by_user_id?: string | null;
          job_position?: string | null;
          metadata?: Json | null;
          role_to_assign?: string | null;
          status?: string;
          tenant_id: string;
          tenant_name?: string | null;
          token: string;
        };
        Update: {
          accepted_at?: string | null;
          created_at?: string;
          department?: string | null;
          email?: string;
          expires_at?: string;
          full_name?: string;
          id?: string;
          invitation_type?: string;
          invited_by?: string | null;
          invited_by_user_id?: string | null;
          job_position?: string | null;
          metadata?: Json | null;
          role_to_assign?: string | null;
          status?: string;
          tenant_id?: string;
          tenant_name?: string | null;
          token?: string;
        };
        Relationships: [];
      };
      job_applications: {
        Row: {
          applied_date: string;
          candidate_id: string;
          created_at: string;
          id: string;
          job_post_id: string;
          notes: string | null;
          score: number | null;
          stage: string;
          status: string;
          tenant_id: string | null;
          updated_at: string;
        };
        Insert: {
          applied_date?: string;
          candidate_id: string;
          created_at?: string;
          id?: string;
          job_post_id: string;
          notes?: string | null;
          score?: number | null;
          stage?: string;
          status?: string;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Update: {
          applied_date?: string;
          candidate_id?: string;
          created_at?: string;
          id?: string;
          job_post_id?: string;
          notes?: string | null;
          score?: number | null;
          stage?: string;
          status?: string;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      job_offers: {
        Row: {
          application_id: string;
          approved_by: string | null;
          benefits: string | null;
          created_at: string;
          created_by: string | null;
          expiry_date: string | null;
          id: string;
          offer_date: string;
          salary_offered: number;
          start_date: string | null;
          status: string;
          tenant_id: string | null;
          terms_conditions: string | null;
          updated_at: string;
        };
        Insert: {
          application_id: string;
          approved_by?: string | null;
          benefits?: string | null;
          created_at?: string;
          created_by?: string | null;
          expiry_date?: string | null;
          id?: string;
          offer_date?: string;
          salary_offered: number;
          start_date?: string | null;
          status?: string;
          tenant_id?: string | null;
          terms_conditions?: string | null;
          updated_at?: string;
        };
        Update: {
          application_id?: string;
          approved_by?: string | null;
          benefits?: string | null;
          created_at?: string;
          created_by?: string | null;
          expiry_date?: string | null;
          id?: string;
          offer_date?: string;
          salary_offered?: number;
          start_date?: string | null;
          status?: string;
          tenant_id?: string | null;
          terms_conditions?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      job_posts: {
        Row: {
          closing_date: string | null;
          created_at: string;
          created_by: string | null;
          department_id: string | null;
          description: string | null;
          employment_type: string;
          hiring_manager_id: string | null;
          id: string;
          location: string | null;
          position_id: string | null;
          posted_date: string | null;
          requirements: string | null;
          salary_max: number | null;
          salary_min: number | null;
          status: string;
          tenant_id: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          closing_date?: string | null;
          created_at?: string;
          created_by?: string | null;
          department_id?: string | null;
          description?: string | null;
          employment_type?: string;
          hiring_manager_id?: string | null;
          id?: string;
          location?: string | null;
          position_id?: string | null;
          posted_date?: string | null;
          requirements?: string | null;
          salary_max?: number | null;
          salary_min?: number | null;
          status?: string;
          tenant_id?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          closing_date?: string | null;
          created_at?: string;
          created_by?: string | null;
          department_id?: string | null;
          description?: string | null;
          employment_type?: string;
          hiring_manager_id?: string | null;
          id?: string;
          location?: string | null;
          position_id?: string | null;
          posted_date?: string | null;
          requirements?: string | null;
          salary_max?: number | null;
          salary_min?: number | null;
          status?: string;
          tenant_id?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      key_results: {
        Row: {
          created_at: string;
          current_value: string | null;
          id: string;
          objective_id: string;
          progress: number | null;
          target: string;
          tenant_id: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          current_value?: string | null;
          id?: string;
          objective_id: string;
          progress?: number | null;
          target: string;
          tenant_id?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          current_value?: string | null;
          id?: string;
          objective_id?: string;
          progress?: number | null;
          target?: string;
          tenant_id?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'key_results_objective_id_fkey';
            columns: ['objective_id'];
            isOneToOne: false;
            referencedRelation: 'objectives';
            referencedColumns: ['id'];
          },
        ];
      };
      leave_approval_workflows: {
        Row: {
          approval_rules: Json;
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          tenant_id: string;
          updated_at: string | null;
        };
        Insert: {
          approval_rules?: Json;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          tenant_id: string;
          updated_at?: string | null;
        };
        Update: {
          approval_rules?: Json;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          tenant_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'leave_approval_workflows_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      leave_approvals: {
        Row: {
          approver_id: string;
          approver_level: number | null;
          created_at: string | null;
          decision_date: string | null;
          id: string;
          is_final_approver: boolean | null;
          leave_request_id: string;
          notes: string | null;
          sequence_order: number | null;
          status: string;
          tenant_id: string;
          updated_at: string | null;
        };
        Insert: {
          approver_id: string;
          approver_level?: number | null;
          created_at?: string | null;
          decision_date?: string | null;
          id?: string;
          is_final_approver?: boolean | null;
          leave_request_id: string;
          notes?: string | null;
          sequence_order?: number | null;
          status: string;
          tenant_id: string;
          updated_at?: string | null;
        };
        Update: {
          approver_id?: string;
          approver_level?: number | null;
          created_at?: string | null;
          decision_date?: string | null;
          id?: string;
          is_final_approver?: boolean | null;
          leave_request_id?: string;
          notes?: string | null;
          sequence_order?: number | null;
          status?: string;
          tenant_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'leave_approvals_leave_request_id_fkey';
            columns: ['leave_request_id'];
            isOneToOne: false;
            referencedRelation: 'leave_requests';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'leave_approvals_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      leave_balances: {
        Row: {
          absence_type_id: string;
          created_at: string;
          employee_id: string;
          id: string;
          remaining_days: number | null;
          tenant_id: string | null;
          total_days: number | null;
          updated_at: string;
          used_days: number | null;
          year: number;
        };
        Insert: {
          absence_type_id: string;
          created_at?: string;
          employee_id: string;
          id?: string;
          remaining_days?: number | null;
          tenant_id?: string | null;
          total_days?: number | null;
          updated_at?: string;
          used_days?: number | null;
          year: number;
        };
        Update: {
          absence_type_id?: string;
          created_at?: string;
          employee_id?: string;
          id?: string;
          remaining_days?: number | null;
          tenant_id?: string | null;
          total_days?: number | null;
          updated_at?: string;
          used_days?: number | null;
          year?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_leave_balances_employee';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'leave_balances_absence_type_id_fkey';
            columns: ['absence_type_id'];
            isOneToOne: false;
            referencedRelation: 'absence_types';
            referencedColumns: ['id'];
          },
        ];
      };
      leave_requests: {
        Row: {
          absence_type_id: string;
          approval_date: string | null;
          approval_notes: string | null;
          approval_status: string | null;
          approved_at: string | null;
          approved_by: string | null;
          approver_id: string | null;
          created_at: string;
          employee_id: string;
          end_date: string;
          id: string;
          reason: string | null;
          rejection_reason: string | null;
          start_date: string;
          status: string | null;
          tenant_id: string | null;
          total_days: number;
          updated_at: string;
        };
        Insert: {
          absence_type_id: string;
          approval_date?: string | null;
          approval_notes?: string | null;
          approval_status?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          approver_id?: string | null;
          created_at?: string;
          employee_id: string;
          end_date: string;
          id?: string;
          reason?: string | null;
          rejection_reason?: string | null;
          start_date: string;
          status?: string | null;
          tenant_id?: string | null;
          total_days: number;
          updated_at?: string;
        };
        Update: {
          absence_type_id?: string;
          approval_date?: string | null;
          approval_notes?: string | null;
          approval_status?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          approver_id?: string | null;
          created_at?: string;
          employee_id?: string;
          end_date?: string;
          id?: string;
          reason?: string | null;
          rejection_reason?: string | null;
          start_date?: string;
          status?: string | null;
          tenant_id?: string | null;
          total_days?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_leave_requests_employee';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'leave_requests_absence_type_id_fkey';
            columns: ['absence_type_id'];
            isOneToOne: false;
            referencedRelation: 'absence_types';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_preferences: {
        Row: {
          created_at: string;
          email_enabled: boolean;
          enabled: boolean;
          id: string;
          in_app_enabled: boolean;
          notification_type: string;
          tenant_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          email_enabled?: boolean;
          enabled?: boolean;
          id?: string;
          in_app_enabled?: boolean;
          notification_type: string;
          tenant_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          email_enabled?: boolean;
          enabled?: boolean;
          id?: string;
          in_app_enabled?: boolean;
          notification_type?: string;
          tenant_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          action_url: string | null;
          created_at: string | null;
          id: string;
          is_read: boolean | null;
          message: string;
          metadata: Json | null;
          tenant_id: string;
          title: string;
          type: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          action_url?: string | null;
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          message: string;
          metadata?: Json | null;
          tenant_id: string;
          title: string;
          type: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          action_url?: string | null;
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          message?: string;
          metadata?: Json | null;
          tenant_id?: string;
          title?: string;
          type?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      objective_templates: {
        Row: {
          category: string;
          created_at: string | null;
          description: string | null;
          id: string;
          tenant_id: string | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          tenant_id?: string | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          tenant_id?: string | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'objective_templates_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      objectives: {
        Row: {
          created_at: string;
          department: string;
          description: string | null;
          due_date: string;
          employee_id: string | null;
          employee_name: string;
          id: string;
          progress: number | null;
          status: string;
          tenant_id: string | null;
          title: string;
          type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          department: string;
          description?: string | null;
          due_date: string;
          employee_id?: string | null;
          employee_name: string;
          id?: string;
          progress?: number | null;
          status?: string;
          tenant_id?: string | null;
          title: string;
          type: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          department?: string;
          description?: string | null;
          due_date?: string;
          employee_id?: string | null;
          employee_name?: string;
          id?: string;
          progress?: number | null;
          status?: string;
          tenant_id?: string | null;
          title?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'objectives_employee_id_fkey';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['user_id'];
          },
        ];
      };
      offboarding_processes: {
        Row: {
          created_at: string;
          department: string;
          employee_id: string;
          employee_name: string;
          id: string;
          last_work_day: string;
          position: string;
          progress: number | null;
          status: string;
          tenant_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          department: string;
          employee_id: string;
          employee_name: string;
          id?: string;
          last_work_day: string;
          position: string;
          progress?: number | null;
          status?: string;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          department?: string;
          employee_id?: string;
          employee_name?: string;
          id?: string;
          last_work_day?: string;
          position?: string;
          progress?: number | null;
          status?: string;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'offboarding_processes_employee_id_fkey';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'offboarding_processes_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      offboarding_tasks: {
        Row: {
          category: string;
          created_at: string;
          description: string | null;
          due_date: string;
          id: string;
          process_id: string;
          responsible: string;
          status: string;
          tenant_id: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          description?: string | null;
          due_date: string;
          id?: string;
          process_id: string;
          responsible: string;
          status?: string;
          tenant_id?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string | null;
          due_date?: string;
          id?: string;
          process_id?: string;
          responsible?: string;
          status?: string;
          tenant_id?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'offboarding_tasks_process_id_fkey';
            columns: ['process_id'];
            isOneToOne: false;
            referencedRelation: 'offboarding_processes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'offboarding_tasks_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      onboarding_logs: {
        Row: {
          app_roles: string[] | null;
          created_at: string | null;
          event_data: Json | null;
          event_type: string;
          id: string;
          invitation_id: string | null;
          tenant_id: string | null;
          user_id: string | null;
        };
        Insert: {
          app_roles?: string[] | null;
          created_at?: string | null;
          event_data?: Json | null;
          event_type: string;
          id?: string;
          invitation_id?: string | null;
          tenant_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          app_roles?: string[] | null;
          created_at?: string | null;
          event_data?: Json | null;
          event_type?: string;
          id?: string;
          invitation_id?: string | null;
          tenant_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      onboarding_processes: {
        Row: {
          created_at: string;
          department: string;
          employee_id: string;
          employee_name: string;
          id: string;
          position: string;
          progress: number | null;
          start_date: string;
          status: string;
          tenant_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          department: string;
          employee_id: string;
          employee_name: string;
          id?: string;
          position: string;
          progress?: number | null;
          start_date: string;
          status?: string;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          department?: string;
          employee_id?: string;
          employee_name?: string;
          id?: string;
          position?: string;
          progress?: number | null;
          start_date?: string;
          status?: string;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'onboarding_processes_employee_id_fkey';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'onboarding_processes_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      onboarding_tasks: {
        Row: {
          category: string;
          created_at: string;
          description: string | null;
          due_date: string;
          id: string;
          process_id: string;
          responsible: string;
          status: string;
          tenant_id: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          description?: string | null;
          due_date: string;
          id?: string;
          process_id: string;
          responsible: string;
          status?: string;
          tenant_id?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string | null;
          due_date?: string;
          id?: string;
          process_id?: string;
          responsible?: string;
          status?: string;
          tenant_id?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'onboarding_tasks_process_id_fkey';
            columns: ['process_id'];
            isOneToOne: false;
            referencedRelation: 'onboarding_processes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'onboarding_tasks_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      operational_action_attachments: {
        Row: {
          action_template_id: string;
          created_at: string | null;
          description: string | null;
          file_extension: string | null;
          file_name: string;
          file_size: number;
          file_type: string;
          id: string;
          mime_type: string | null;
          storage_bucket: string | null;
          storage_path: string;
          task_id: string | null;
          tenant_id: string;
          updated_at: string | null;
          uploaded_at: string | null;
          uploaded_by: string;
        };
        Insert: {
          action_template_id: string;
          created_at?: string | null;
          description?: string | null;
          file_extension?: string | null;
          file_name: string;
          file_size: number;
          file_type: string;
          id?: string;
          mime_type?: string | null;
          storage_bucket?: string | null;
          storage_path: string;
          task_id?: string | null;
          tenant_id: string;
          updated_at?: string | null;
          uploaded_at?: string | null;
          uploaded_by: string;
        };
        Update: {
          action_template_id?: string;
          created_at?: string | null;
          description?: string | null;
          file_extension?: string | null;
          file_name?: string;
          file_size?: number;
          file_type?: string;
          id?: string;
          mime_type?: string | null;
          storage_bucket?: string | null;
          storage_path?: string;
          task_id?: string | null;
          tenant_id?: string;
          updated_at?: string | null;
          uploaded_at?: string | null;
          uploaded_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'operational_action_attachments_action_template_id_fkey';
            columns: ['action_template_id'];
            isOneToOne: false;
            referencedRelation: 'operational_action_templates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'operational_action_attachments_task_id_fkey';
            columns: ['task_id'];
            isOneToOne: false;
            referencedRelation: 'tasks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'operational_action_attachments_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      operational_action_dependencies: {
        Row: {
          action_template_id: string;
          created_at: string;
          dependency_type: string;
          depends_on_template_id: string;
          id: string;
          lag_hours: number | null;
          tenant_id: string;
        };
        Insert: {
          action_template_id: string;
          created_at?: string;
          dependency_type?: string;
          depends_on_template_id: string;
          id?: string;
          lag_hours?: number | null;
          tenant_id: string;
        };
        Update: {
          action_template_id?: string;
          created_at?: string;
          dependency_type?: string;
          depends_on_template_id?: string;
          id?: string;
          lag_hours?: number | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'operational_action_dependencies_action_template_id_fkey';
            columns: ['action_template_id'];
            isOneToOne: false;
            referencedRelation: 'operational_action_templates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'operational_action_dependencies_depends_on_template_id_fkey';
            columns: ['depends_on_template_id'];
            isOneToOne: false;
            referencedRelation: 'operational_action_templates';
            referencedColumns: ['id'];
          },
        ];
      };
      operational_action_templates: {
        Row: {
          activity_id: string;
          assigned_name: string | null;
          assignee_id: string | null;
          created_at: string;
          description: string | null;
          estimated_hours: number | null;
          id: string;
          inherit_assignee: boolean | null;
          offset_days: number | null;
          position: number;
          tenant_id: string;
          title: string;
        };
        Insert: {
          activity_id: string;
          assigned_name?: string | null;
          assignee_id?: string | null;
          created_at?: string;
          description?: string | null;
          estimated_hours?: number | null;
          id?: string;
          inherit_assignee?: boolean | null;
          offset_days?: number | null;
          position?: number;
          tenant_id: string;
          title: string;
        };
        Update: {
          activity_id?: string;
          assigned_name?: string | null;
          assignee_id?: string | null;
          created_at?: string;
          description?: string | null;
          estimated_hours?: number | null;
          id?: string;
          inherit_assignee?: boolean | null;
          offset_days?: number | null;
          position?: number;
          tenant_id?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'operational_action_templates_activity_id_fkey';
            columns: ['activity_id'];
            isOneToOne: false;
            referencedRelation: 'operational_activities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'operational_action_templates_assignee_id_fkey';
            columns: ['assignee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['id'];
          },
        ];
      };
      operational_activities: {
        Row: {
          created_at: string;
          created_by: string | null;
          department_id: string | null;
          description: string | null;
          id: string;
          is_active: boolean;
          kind: string;
          name: string;
          owner_employee_id: string | null;
          owner_id: string | null;
          owner_name: string | null;
          project_id: string | null;
          scope: string;
          task_title_template: string | null;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          department_id?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          kind?: string;
          name: string;
          owner_employee_id?: string | null;
          owner_id?: string | null;
          owner_name?: string | null;
          project_id?: string | null;
          scope?: string;
          task_title_template?: string | null;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          department_id?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          kind?: string;
          name?: string;
          owner_employee_id?: string | null;
          owner_id?: string | null;
          owner_name?: string | null;
          project_id?: string | null;
          scope?: string;
          task_title_template?: string | null;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'operational_activities_owner_employee_id_fkey';
            columns: ['owner_employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['id'];
          },
        ];
      };
      operational_schedules: {
        Row: {
          activity_id: string;
          created_at: string;
          generate_window_days: number;
          id: string;
          rrule: string | null;
          start_date: string;
          tenant_id: string;
          timezone: string;
          until: string | null;
          updated_at: string;
        };
        Insert: {
          activity_id: string;
          created_at?: string;
          generate_window_days?: number;
          id?: string;
          rrule?: string | null;
          start_date: string;
          tenant_id: string;
          timezone?: string;
          until?: string | null;
          updated_at?: string;
        };
        Update: {
          activity_id?: string;
          created_at?: string;
          generate_window_days?: number;
          id?: string;
          rrule?: string | null;
          start_date?: string;
          tenant_id?: string;
          timezone?: string;
          until?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'operational_schedules_activity_id_fkey';
            columns: ['activity_id'];
            isOneToOne: false;
            referencedRelation: 'operational_activities';
            referencedColumns: ['id'];
          },
        ];
      };
      paie_bulletins: {
        Row: {
          cnss_patronale: number;
          cnss_salariale: number;
          created_at: string | null;
          employe_id: string;
          id: string;
          montant_its: number;
          periode_id: string;
          prime_fonction: number | null;
          prime_forfaitaire: number | null;
          prime_logement: number | null;
          prime_responsabilite: number | null;
          prime_specifique: number | null;
          prime_transport: number | null;
          retenue_avance: number | null;
          retenue_waqf: number | null;
          salaire_base: number;
          salaire_brut: number;
          salaire_imposable: number;
          salaire_net: number;
          tenant_id: string;
          total_primes_imposables: number | null;
          total_retenues_absences: number | null;
        };
        Insert: {
          cnss_patronale: number;
          cnss_salariale: number;
          created_at?: string | null;
          employe_id: string;
          id?: string;
          montant_its: number;
          periode_id: string;
          prime_fonction?: number | null;
          prime_forfaitaire?: number | null;
          prime_logement?: number | null;
          prime_responsabilite?: number | null;
          prime_specifique?: number | null;
          prime_transport?: number | null;
          retenue_avance?: number | null;
          retenue_waqf?: number | null;
          salaire_base: number;
          salaire_brut: number;
          salaire_imposable: number;
          salaire_net: number;
          tenant_id?: string;
          total_primes_imposables?: number | null;
          total_retenues_absences?: number | null;
        };
        Update: {
          cnss_patronale?: number;
          cnss_salariale?: number;
          created_at?: string | null;
          employe_id?: string;
          id?: string;
          montant_its?: number;
          periode_id?: string;
          prime_fonction?: number | null;
          prime_forfaitaire?: number | null;
          prime_logement?: number | null;
          prime_responsabilite?: number | null;
          prime_specifique?: number | null;
          prime_transport?: number | null;
          retenue_avance?: number | null;
          retenue_waqf?: number | null;
          salaire_base?: number;
          salaire_brut?: number;
          salaire_imposable?: number;
          salaire_net?: number;
          tenant_id?: string;
          total_primes_imposables?: number | null;
          total_retenues_absences?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'paie_bulletins_employe_id_fkey';
            columns: ['employe_id'];
            isOneToOne: false;
            referencedRelation: 'paie_employes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'paie_bulletins_periode_id_fkey';
            columns: ['periode_id'];
            isOneToOne: false;
            referencedRelation: 'paie_periodes';
            referencedColumns: ['id'];
          },
        ];
      };
      paie_elements_variables: {
        Row: {
          created_at: string | null;
          employe_id: string;
          id: string;
          periode_id: string;
          prime_forfaitaire: number | null;
          prime_specifique: number | null;
          retenue_absences: number | null;
          retenue_avance: number | null;
          tenant_id: string;
        };
        Insert: {
          created_at?: string | null;
          employe_id: string;
          id?: string;
          periode_id: string;
          prime_forfaitaire?: number | null;
          prime_specifique?: number | null;
          retenue_absences?: number | null;
          retenue_avance?: number | null;
          tenant_id?: string;
        };
        Update: {
          created_at?: string | null;
          employe_id?: string;
          id?: string;
          periode_id?: string;
          prime_forfaitaire?: number | null;
          prime_specifique?: number | null;
          retenue_absences?: number | null;
          retenue_avance?: number | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'paie_elements_variables_employe_id_fkey';
            columns: ['employe_id'];
            isOneToOne: false;
            referencedRelation: 'paie_employes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'paie_elements_variables_periode_id_fkey';
            columns: ['periode_id'];
            isOneToOne: false;
            referencedRelation: 'paie_periodes';
            referencedColumns: ['id'];
          },
        ];
      };
      paie_employes: {
        Row: {
          created_at: string | null;
          fonction: string | null;
          id: string;
          nom_complet: string;
          prime_fonction_fixe: number | null;
          prime_logement_fixe: number | null;
          prime_responsabilite_fixe: number | null;
          prime_transport_fixe: number | null;
          retenue_waqf_fixe: number | null;
          salaire_base: number;
          tenant_id: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          fonction?: string | null;
          id?: string;
          nom_complet: string;
          prime_fonction_fixe?: number | null;
          prime_logement_fixe?: number | null;
          prime_responsabilite_fixe?: number | null;
          prime_transport_fixe?: number | null;
          retenue_waqf_fixe?: number | null;
          salaire_base?: number;
          tenant_id?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          fonction?: string | null;
          id?: string;
          nom_complet?: string;
          prime_fonction_fixe?: number | null;
          prime_logement_fixe?: number | null;
          prime_responsabilite_fixe?: number | null;
          prime_transport_fixe?: number | null;
          retenue_waqf_fixe?: number | null;
          salaire_base?: number;
          tenant_id?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      paie_periodes: {
        Row: {
          annee: number;
          created_at: string | null;
          est_cloture: boolean | null;
          id: string;
          mois: number;
          tenant_id: string;
        };
        Insert: {
          annee: number;
          created_at?: string | null;
          est_cloture?: boolean | null;
          id?: string;
          mois: number;
          tenant_id?: string;
        };
        Update: {
          annee?: number;
          created_at?: string | null;
          est_cloture?: boolean | null;
          id?: string;
          mois?: number;
          tenant_id?: string;
        };
        Relationships: [];
      };
      payroll_components: {
        Row: {
          amount: number;
          created_at: string;
          employee_id: string | null;
          id: string;
          is_percentage: boolean | null;
          is_taxable: boolean | null;
          name: string;
          payroll_id: string;
          tenant_id: string | null;
          type: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          employee_id?: string | null;
          id?: string;
          is_percentage?: boolean | null;
          is_taxable?: boolean | null;
          name: string;
          payroll_id: string;
          tenant_id?: string | null;
          type: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          employee_id?: string | null;
          id?: string;
          is_percentage?: boolean | null;
          is_taxable?: boolean | null;
          name?: string;
          payroll_id?: string;
          tenant_id?: string | null;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payroll_components_employee_id_fkey';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'payroll_components_payroll_id_fkey';
            columns: ['payroll_id'];
            isOneToOne: false;
            referencedRelation: 'employee_payrolls';
            referencedColumns: ['id'];
          },
        ];
      };
      payroll_periods: {
        Row: {
          created_at: string;
          id: string;
          lock_date: string | null;
          month: number;
          processed_date: string | null;
          status: string;
          tenant_id: string | null;
          total_charges: number | null;
          total_employees: number | null;
          total_gross: number | null;
          total_net: number | null;
          updated_at: string;
          year: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          lock_date?: string | null;
          month: number;
          processed_date?: string | null;
          status?: string;
          tenant_id?: string | null;
          total_charges?: number | null;
          total_employees?: number | null;
          total_gross?: number | null;
          total_net?: number | null;
          updated_at?: string;
          year: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          lock_date?: string | null;
          month?: number;
          processed_date?: string | null;
          status?: string;
          tenant_id?: string | null;
          total_charges?: number | null;
          total_employees?: number | null;
          total_gross?: number | null;
          total_net?: number | null;
          updated_at?: string;
          year?: number;
        };
        Relationships: [];
      };
      permissions: {
        Row: {
          action: string;
          context: string | null;
          created_at: string;
          description: string | null;
          display_name: string;
          id: string;
          name: string;
          resource: string;
        };
        Insert: {
          action: string;
          context?: string | null;
          created_at?: string;
          description?: string | null;
          display_name: string;
          id?: string;
          name: string;
          resource: string;
        };
        Update: {
          action?: string;
          context?: string | null;
          created_at?: string;
          description?: string | null;
          display_name?: string;
          id?: string;
          name?: string;
          resource?: string;
        };
        Relationships: [];
      };
      plan_skill_goals: {
        Row: {
          achieved_at: string | null;
          created_at: string | null;
          current_level: string;
          id: string;
          notes: string | null;
          plan_id: string;
          skill_id: string;
          status: string | null;
          target_level: string;
          updated_at: string | null;
        };
        Insert: {
          achieved_at?: string | null;
          created_at?: string | null;
          current_level: string;
          id?: string;
          notes?: string | null;
          plan_id: string;
          skill_id: string;
          status?: string | null;
          target_level: string;
          updated_at?: string | null;
        };
        Update: {
          achieved_at?: string | null;
          created_at?: string | null;
          current_level?: string;
          id?: string;
          notes?: string | null;
          plan_id?: string;
          skill_id?: string;
          status?: string | null;
          target_level?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'plan_skill_goals_plan_id_fkey';
            columns: ['plan_id'];
            isOneToOne: false;
            referencedRelation: 'development_plans';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'plan_skill_goals_skill_id_fkey';
            columns: ['skill_id'];
            isOneToOne: false;
            referencedRelation: 'skills';
            referencedColumns: ['id'];
          },
        ];
      };
      positions: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          requirements: string | null;
          salary_range_max: number | null;
          salary_range_min: number | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          requirements?: string | null;
          salary_range_max?: number | null;
          salary_range_min?: number | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          requirements?: string | null;
          salary_range_max?: number | null;
          salary_range_min?: number | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          contract_type: string | null;
          created_at: string;
          email: string;
          emergency_contact: Json | null;
          employee_id: string | null;
          full_name: string;
          hire_date: string | null;
          id: string;
          job_title: string | null;
          manager_id: string | null;
          phone: string | null;
          role: string;
          salary: number | null;
          tenant_id: string;
          updated_at: string;
          user_id: string;
          weekly_hours: number | null;
        };
        Insert: {
          avatar_url?: string | null;
          contract_type?: string | null;
          created_at?: string;
          email: string;
          emergency_contact?: Json | null;
          employee_id?: string | null;
          full_name: string;
          hire_date?: string | null;
          id?: string;
          job_title?: string | null;
          manager_id?: string | null;
          phone?: string | null;
          role?: string;
          salary?: number | null;
          tenant_id: string;
          updated_at?: string;
          user_id: string;
          weekly_hours?: number | null;
        };
        Update: {
          avatar_url?: string | null;
          contract_type?: string | null;
          created_at?: string;
          email?: string;
          emergency_contact?: Json | null;
          employee_id?: string | null;
          full_name?: string;
          hire_date?: string | null;
          id?: string;
          job_title?: string | null;
          manager_id?: string | null;
          phone?: string | null;
          role?: string;
          salary?: number | null;
          tenant_id?: string;
          updated_at?: string;
          user_id?: string;
          weekly_hours?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_manager_id_fkey';
            columns: ['manager_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'profiles_role_fkey';
            columns: ['role'];
            isOneToOne: false;
            referencedRelation: 'roles';
            referencedColumns: ['name'];
          },
          {
            foreignKeyName: 'profiles_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      project_comments: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          project_id: string;
          tenant_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          project_id: string;
          tenant_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          project_id?: string;
          tenant_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'project_comments_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'project_comments_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      projects: {
        Row: {
          actual_hours: number | null;
          budget: number | null;
          completion_date: string | null;
          created_at: string;
          department_id: string | null;
          description: string | null;
          end_date: string | null;
          estimated_hours: number | null;
          id: string;
          manager_id: string | null;
          name: string;
          priority: string;
          progress: number | null;
          skills_required: Json | null;
          start_date: string | null;
          status: string;
          team_members: Json | null;
          tenant_id: string | null;
          updated_at: string;
        };
        Insert: {
          actual_hours?: number | null;
          budget?: number | null;
          completion_date?: string | null;
          created_at?: string;
          department_id?: string | null;
          description?: string | null;
          end_date?: string | null;
          estimated_hours?: number | null;
          id?: string;
          manager_id?: string | null;
          name: string;
          priority?: string;
          progress?: number | null;
          skills_required?: Json | null;
          start_date?: string | null;
          status?: string;
          team_members?: Json | null;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Update: {
          actual_hours?: number | null;
          budget?: number | null;
          completion_date?: string | null;
          created_at?: string;
          department_id?: string | null;
          description?: string | null;
          end_date?: string | null;
          estimated_hours?: number | null;
          id?: string;
          manager_id?: string | null;
          name?: string;
          priority?: string;
          progress?: number | null;
          skills_required?: Json | null;
          start_date?: string | null;
          status?: string;
          team_members?: Json | null;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'projects_department_id_fkey';
            columns: ['department_id'];
            isOneToOne: false;
            referencedRelation: 'departments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'projects_manager_id_fkey';
            columns: ['manager_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'projects_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      ref_bareme_its: {
        Row: {
          created_at: string | null;
          ecart: number | null;
          id: string;
          montant_impot: number;
          montant_max: number;
          montant_min: number;
          tenant_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          ecart?: number | null;
          id?: string;
          montant_impot: number;
          montant_max: number;
          montant_min: number;
          tenant_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          ecart?: number | null;
          id?: string;
          montant_impot?: number;
          montant_max?: number;
          montant_min?: number;
          tenant_id?: string | null;
        };
        Relationships: [];
      };
      remote_work_requests: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          created_at: string | null;
          employee_id: string;
          end_date: string;
          frequency: string | null;
          id: string;
          reason: string | null;
          rejection_reason: string | null;
          request_date: string;
          start_date: string;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string | null;
          employee_id: string;
          end_date: string;
          frequency?: string | null;
          id?: string;
          reason?: string | null;
          rejection_reason?: string | null;
          request_date: string;
          start_date: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string | null;
          employee_id?: string;
          end_date?: string;
          frequency?: string | null;
          id?: string;
          reason?: string | null;
          rejection_reason?: string | null;
          request_date?: string;
          start_date?: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'remote_work_requests_approved_by_fkey';
            columns: ['approved_by'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'remote_work_requests_employee_id_fkey';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['id'];
          },
        ];
      };
      role_permissions: {
        Row: {
          created_at: string;
          id: string;
          permission_id: string;
          role_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          permission_id: string;
          role_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          permission_id?: string;
          role_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'role_permissions_permission_id_fkey';
            columns: ['permission_id'];
            isOneToOne: false;
            referencedRelation: 'permissions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'role_permissions_role_id_fkey';
            columns: ['role_id'];
            isOneToOne: false;
            referencedRelation: 'roles';
            referencedColumns: ['id'];
          },
        ];
      };
      roles: {
        Row: {
          created_at: string;
          description: string | null;
          display_name: string;
          hierarchy_level: number;
          id: string;
          is_system_role: boolean;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          display_name: string;
          hierarchy_level?: number;
          id?: string;
          is_system_role?: boolean;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          display_name?: string;
          hierarchy_level?: number;
          id?: string;
          is_system_role?: boolean;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      safety_documents: {
        Row: {
          category: string;
          created_at: string;
          download_url: string | null;
          expiry_date: string | null;
          id: string;
          published_date: string;
          status: string;
          tenant_id: string | null;
          title: string;
          type: string;
          updated_at: string;
          version: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          download_url?: string | null;
          expiry_date?: string | null;
          id?: string;
          published_date?: string;
          status?: string;
          tenant_id?: string | null;
          title: string;
          type: string;
          updated_at?: string;
          version: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          download_url?: string | null;
          expiry_date?: string | null;
          id?: string;
          published_date?: string;
          status?: string;
          tenant_id?: string | null;
          title?: string;
          type?: string;
          updated_at?: string;
          version?: string;
        };
        Relationships: [];
      };
      safety_incidents: {
        Row: {
          affected_employee: string | null;
          created_at: string;
          description: string;
          id: string;
          location: string;
          reported_by: string;
          reported_date: string;
          severity: string;
          status: string;
          tenant_id: string | null;
          title: string;
          type: string;
          updated_at: string;
        };
        Insert: {
          affected_employee?: string | null;
          created_at?: string;
          description: string;
          id?: string;
          location: string;
          reported_by: string;
          reported_date?: string;
          severity: string;
          status?: string;
          tenant_id?: string | null;
          title: string;
          type: string;
          updated_at?: string;
        };
        Update: {
          affected_employee?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          location?: string;
          reported_by?: string;
          reported_date?: string;
          severity?: string;
          status?: string;
          tenant_id?: string | null;
          title?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      skill_assessments: {
        Row: {
          assessor: string;
          created_at: string;
          current_level: number;
          department: string;
          employee_id: string;
          employee_name: string;
          id: string;
          last_assessed: string;
          position: string;
          skill_id: string;
          target_level: number;
          tenant_id: string | null;
          updated_at: string;
        };
        Insert: {
          assessor: string;
          created_at?: string;
          current_level: number;
          department: string;
          employee_id: string;
          employee_name: string;
          id?: string;
          last_assessed?: string;
          position: string;
          skill_id: string;
          target_level: number;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Update: {
          assessor?: string;
          created_at?: string;
          current_level?: number;
          department?: string;
          employee_id?: string;
          employee_name?: string;
          id?: string;
          last_assessed?: string;
          position?: string;
          skill_id?: string;
          target_level?: number;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_skill_assessments_employee';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['user_id'];
          },
        ];
      };
      skills: {
        Row: {
          category: string;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          id: string;
          is_critical: boolean | null;
          level_required: string | null;
          name: string;
          tenant_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_critical?: boolean | null;
          level_required?: string | null;
          name: string;
          tenant_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_critical?: boolean | null;
          level_required?: string | null;
          name?: string;
          tenant_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'skills_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      tardiness: {
        Row: {
          actual_time: string;
          created_at: string;
          date: string;
          delay_minutes: number;
          employee_id: string;
          id: string;
          justification: string | null;
          justified: boolean | null;
          reason: string | null;
          scheduled_time: string;
          tenant_id: string | null;
          updated_at: string;
        };
        Insert: {
          actual_time: string;
          created_at?: string;
          date: string;
          delay_minutes: number;
          employee_id: string;
          id?: string;
          justification?: string | null;
          justified?: boolean | null;
          reason?: string | null;
          scheduled_time: string;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Update: {
          actual_time?: string;
          created_at?: string;
          date?: string;
          delay_minutes?: number;
          employee_id?: string;
          id?: string;
          justification?: string | null;
          justified?: boolean | null;
          reason?: string | null;
          scheduled_time?: string;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_tardiness_employee';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['user_id'];
          },
        ];
      };
      task_action_attachments: {
        Row: {
          created_at: string | null;
          description: string | null;
          file_extension: string | null;
          file_name: string;
          file_size: number;
          file_type: string;
          id: string;
          mime_type: string | null;
          storage_bucket: string | null;
          storage_path: string;
          task_action_id: string;
          task_id: string;
          tenant_id: string;
          updated_at: string | null;
          uploaded_at: string | null;
          uploaded_by: string;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          file_extension?: string | null;
          file_name: string;
          file_size: number;
          file_type: string;
          id?: string;
          mime_type?: string | null;
          storage_bucket?: string | null;
          storage_path: string;
          task_action_id: string;
          task_id: string;
          tenant_id: string;
          updated_at?: string | null;
          uploaded_at?: string | null;
          uploaded_by: string;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          file_extension?: string | null;
          file_name?: string;
          file_size?: number;
          file_type?: string;
          id?: string;
          mime_type?: string | null;
          storage_bucket?: string | null;
          storage_path?: string;
          task_action_id?: string;
          task_id?: string;
          tenant_id?: string;
          updated_at?: string | null;
          uploaded_at?: string | null;
          uploaded_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'task_action_attachments_task_action_id_fkey';
            columns: ['task_action_id'];
            isOneToOne: false;
            referencedRelation: 'task_actions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'task_action_attachments_task_id_fkey';
            columns: ['task_id'];
            isOneToOne: false;
            referencedRelation: 'tasks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'task_action_attachments_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      task_actions: {
        Row: {
          created_at: string;
          due_date: string | null;
          id: string;
          is_done: boolean | null;
          notes: string | null;
          owner_id: string | null;
          position: number | null;
          task_id: string;
          tenant_id: string | null;
          title: string;
          updated_at: string;
          weight_percentage: number;
        };
        Insert: {
          created_at?: string;
          due_date?: string | null;
          id?: string;
          is_done?: boolean | null;
          notes?: string | null;
          owner_id?: string | null;
          position?: number | null;
          task_id: string;
          tenant_id?: string | null;
          title: string;
          updated_at?: string;
          weight_percentage?: number;
        };
        Update: {
          created_at?: string;
          due_date?: string | null;
          id?: string;
          is_done?: boolean | null;
          notes?: string | null;
          owner_id?: string | null;
          position?: number | null;
          task_id?: string;
          tenant_id?: string | null;
          title?: string;
          updated_at?: string;
          weight_percentage?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'task_actions_task_id_fkey';
            columns: ['task_id'];
            isOneToOne: false;
            referencedRelation: 'tasks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'task_actions_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      task_attachments: {
        Row: {
          created_at: string | null;
          description: string | null;
          file_extension: string | null;
          file_name: string;
          file_size: number;
          file_type: string;
          id: string;
          mime_type: string | null;
          storage_bucket: string | null;
          storage_path: string;
          task_id: string;
          tenant_id: string;
          updated_at: string | null;
          uploaded_at: string | null;
          uploaded_by: string;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          file_extension?: string | null;
          file_name: string;
          file_size: number;
          file_type: string;
          id?: string;
          mime_type?: string | null;
          storage_bucket?: string | null;
          storage_path: string;
          task_id: string;
          tenant_id: string;
          updated_at?: string | null;
          uploaded_at?: string | null;
          uploaded_by: string;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          file_extension?: string | null;
          file_name?: string;
          file_size?: number;
          file_type?: string;
          id?: string;
          mime_type?: string | null;
          storage_bucket?: string | null;
          storage_path?: string;
          task_id?: string;
          tenant_id?: string;
          updated_at?: string | null;
          uploaded_at?: string | null;
          uploaded_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'task_attachments_task_id_fkey';
            columns: ['task_id'];
            isOneToOne: false;
            referencedRelation: 'tasks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'task_attachments_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      task_audit_logs: {
        Row: {
          action_type: string;
          created_at: string;
          description: string;
          field_name: string | null;
          id: string;
          new_value: string | null;
          old_value: string | null;
          related_entity_id: string | null;
          related_entity_type: string | null;
          task_id: string;
          tenant_id: string | null;
          user_id: string | null;
          user_name: string | null;
        };
        Insert: {
          action_type: string;
          created_at?: string;
          description: string;
          field_name?: string | null;
          id?: string;
          new_value?: string | null;
          old_value?: string | null;
          related_entity_id?: string | null;
          related_entity_type?: string | null;
          task_id: string;
          tenant_id?: string | null;
          user_id?: string | null;
          user_name?: string | null;
        };
        Update: {
          action_type?: string;
          created_at?: string;
          description?: string;
          field_name?: string | null;
          id?: string;
          new_value?: string | null;
          old_value?: string | null;
          related_entity_id?: string | null;
          related_entity_type?: string | null;
          task_id?: string;
          tenant_id?: string | null;
          user_id?: string | null;
          user_name?: string | null;
        };
        Relationships: [];
      };
      task_comments: {
        Row: {
          author_id: string | null;
          comment_type: string | null;
          content: string;
          created_at: string;
          id: string;
          task_id: string;
          tenant_id: string | null;
          updated_at: string;
        };
        Insert: {
          author_id?: string | null;
          comment_type?: string | null;
          content: string;
          created_at?: string;
          id?: string;
          task_id: string;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Update: {
          author_id?: string | null;
          comment_type?: string | null;
          content?: string;
          created_at?: string;
          id?: string;
          task_id?: string;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'task_comments_task_id_fkey';
            columns: ['task_id'];
            isOneToOne: false;
            referencedRelation: 'tasks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'task_comments_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      task_dependencies: {
        Row: {
          created_at: string;
          dependency_type: string;
          depends_on_task_id: string;
          id: string;
          lag_days: number | null;
          task_id: string;
          tenant_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          dependency_type?: string;
          depends_on_task_id: string;
          id?: string;
          lag_days?: number | null;
          task_id: string;
          tenant_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          dependency_type?: string;
          depends_on_task_id?: string;
          id?: string;
          lag_days?: number | null;
          task_id?: string;
          tenant_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'task_dependencies_depends_on_task_id_fkey';
            columns: ['depends_on_task_id'];
            isOneToOne: false;
            referencedRelation: 'tasks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'task_dependencies_task_id_fkey';
            columns: ['task_id'];
            isOneToOne: false;
            referencedRelation: 'tasks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'task_dependencies_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      task_documents: {
        Row: {
          created_at: string;
          file_name: string;
          file_path: string;
          file_size: number | null;
          id: string;
          mime_type: string | null;
          project_id: string | null;
          subtask_id: string | null;
          task_id: string;
          tenant_id: string | null;
          updated_at: string;
          uploader_id: string | null;
        };
        Insert: {
          created_at?: string;
          file_name: string;
          file_path: string;
          file_size?: number | null;
          id?: string;
          mime_type?: string | null;
          project_id?: string | null;
          subtask_id?: string | null;
          task_id: string;
          tenant_id?: string | null;
          updated_at?: string;
          uploader_id?: string | null;
        };
        Update: {
          created_at?: string;
          file_name?: string;
          file_path?: string;
          file_size?: number | null;
          id?: string;
          mime_type?: string | null;
          project_id?: string | null;
          subtask_id?: string | null;
          task_id?: string;
          tenant_id?: string | null;
          updated_at?: string;
          uploader_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'task_documents_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'task_documents_task_id_fkey';
            columns: ['task_id'];
            isOneToOne: false;
            referencedRelation: 'tasks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'task_documents_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      task_history: {
        Row: {
          action_type: string;
          changed_at: string | null;
          changed_by: string | null;
          field_name: string | null;
          id: string;
          metadata: Json | null;
          new_value: string | null;
          old_value: string | null;
          task_id: string;
          tenant_id: string;
        };
        Insert: {
          action_type: string;
          changed_at?: string | null;
          changed_by?: string | null;
          field_name?: string | null;
          id?: string;
          metadata?: Json | null;
          new_value?: string | null;
          old_value?: string | null;
          task_id: string;
          tenant_id: string;
        };
        Update: {
          action_type?: string;
          changed_at?: string | null;
          changed_by?: string | null;
          field_name?: string | null;
          id?: string;
          metadata?: Json | null;
          new_value?: string | null;
          old_value?: string | null;
          task_id?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'task_history_task_id_fkey';
            columns: ['task_id'];
            isOneToOne: false;
            referencedRelation: 'tasks';
            referencedColumns: ['id'];
          },
        ];
      };
      task_risks: {
        Row: {
          created_at: string;
          id: string;
          impact: string;
          mitigation_plan: string | null;
          probability: string;
          risk_description: string;
          status: string;
          task_id: string;
          tenant_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          impact?: string;
          mitigation_plan?: string | null;
          probability?: string;
          risk_description: string;
          status?: string;
          task_id: string;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          impact?: string;
          mitigation_plan?: string | null;
          probability?: string;
          risk_description?: string;
          status?: string;
          task_id?: string;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'task_risks_task_id_fkey';
            columns: ['task_id'];
            isOneToOne: false;
            referencedRelation: 'tasks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'task_risks_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      task_templates: {
        Row: {
          category: string | null;
          created_at: string | null;
          created_by: string;
          description: string | null;
          id: string;
          is_public: boolean | null;
          name: string;
          template_data: Json;
          tenant_id: string;
          updated_at: string | null;
          usage_count: number | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          created_by: string;
          description?: string | null;
          id?: string;
          is_public?: boolean | null;
          name: string;
          template_data?: Json;
          tenant_id: string;
          updated_at?: string | null;
          usage_count?: number | null;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          created_by?: string;
          description?: string | null;
          id?: string;
          is_public?: boolean | null;
          name?: string;
          template_data?: Json;
          tenant_id?: string;
          updated_at?: string | null;
          usage_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'task_templates_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      tasks: {
        Row: {
          acceptance_criteria: string | null;
          activity_id: string | null;
          assigned_name: string;
          assignee_id: string | null;
          budget: number | null;
          created_at: string;
          department_id: string | null;
          department_name: string;
          description: string | null;
          display_order: string | null;
          due_date: string;
          effort_estimate_h: number | null;
          effort_spent_h: number | null;
          id: string;
          is_operational: boolean;
          linked_action_id: string | null;
          parent_id: string | null;
          priority: string;
          progress: number | null;
          project_id: string | null;
          project_name: string;
          start_date: string;
          status: string;
          task_level: number | null;
          tenant_id: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          acceptance_criteria?: string | null;
          activity_id?: string | null;
          assigned_name: string;
          assignee_id?: string | null;
          budget?: number | null;
          created_at?: string;
          department_id?: string | null;
          department_name: string;
          description?: string | null;
          display_order?: string | null;
          due_date: string;
          effort_estimate_h?: number | null;
          effort_spent_h?: number | null;
          id?: string;
          is_operational?: boolean;
          linked_action_id?: string | null;
          parent_id?: string | null;
          priority: string;
          progress?: number | null;
          project_id?: string | null;
          project_name: string;
          start_date: string;
          status?: string;
          task_level?: number | null;
          tenant_id?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          acceptance_criteria?: string | null;
          activity_id?: string | null;
          assigned_name?: string;
          assignee_id?: string | null;
          budget?: number | null;
          created_at?: string;
          department_id?: string | null;
          department_name?: string;
          description?: string | null;
          display_order?: string | null;
          due_date?: string;
          effort_estimate_h?: number | null;
          effort_spent_h?: number | null;
          id?: string;
          is_operational?: boolean;
          linked_action_id?: string | null;
          parent_id?: string | null;
          priority?: string;
          progress?: number | null;
          project_id?: string | null;
          project_name?: string;
          start_date?: string;
          status?: string;
          task_level?: number | null;
          tenant_id?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tasks_activity_id_fkey';
            columns: ['activity_id'];
            isOneToOne: false;
            referencedRelation: 'operational_activities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_assignee_id_fkey';
            columns: ['assignee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'tasks_department_id_fkey';
            columns: ['department_id'];
            isOneToOne: false;
            referencedRelation: 'departments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_linked_action_id_fkey';
            columns: ['linked_action_id'];
            isOneToOne: false;
            referencedRelation: 'task_actions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'tasks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      tenants: {
        Row: {
          created_at: string;
          description: string | null;
          domain: string | null;
          id: string;
          logo_url: string | null;
          max_projects: number | null;
          max_users: number | null;
          name: string;
          settings: Json | null;
          slug: string;
          status: string;
          subscription_expires_at: string | null;
          subscription_plan: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          domain?: string | null;
          id?: string;
          logo_url?: string | null;
          max_projects?: number | null;
          max_users?: number | null;
          name: string;
          settings?: Json | null;
          slug: string;
          status?: string;
          subscription_expires_at?: string | null;
          subscription_plan?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          domain?: string | null;
          id?: string;
          logo_url?: string | null;
          max_projects?: number | null;
          max_users?: number | null;
          name?: string;
          settings?: Json | null;
          slug?: string;
          status?: string;
          subscription_expires_at?: string | null;
          subscription_plan?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      timesheet_entries: {
        Row: {
          created_at: string | null;
          description: string | null;
          hours: number;
          id: string;
          is_overtime: boolean | null;
          project_id: string | null;
          task_id: string | null;
          timesheet_id: string;
          updated_at: string | null;
          work_date: string;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          hours: number;
          id?: string;
          is_overtime?: boolean | null;
          project_id?: string | null;
          task_id?: string | null;
          timesheet_id: string;
          updated_at?: string | null;
          work_date: string;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          hours?: number;
          id?: string;
          is_overtime?: boolean | null;
          project_id?: string | null;
          task_id?: string | null;
          timesheet_id?: string;
          updated_at?: string | null;
          work_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'timesheet_entries_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'timesheet_entries_task_id_fkey';
            columns: ['task_id'];
            isOneToOne: false;
            referencedRelation: 'tasks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'timesheet_entries_timesheet_id_fkey';
            columns: ['timesheet_id'];
            isOneToOne: false;
            referencedRelation: 'timesheets';
            referencedColumns: ['id'];
          },
        ];
      };
      timesheets: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          created_at: string | null;
          employee_id: string;
          id: string;
          notes: string | null;
          overtime_hours: number | null;
          regular_hours: number | null;
          rejection_reason: string | null;
          status: string | null;
          submitted_at: string | null;
          total_hours: number;
          updated_at: string | null;
          week_end_date: string;
          week_start_date: string;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string | null;
          employee_id: string;
          id?: string;
          notes?: string | null;
          overtime_hours?: number | null;
          regular_hours?: number | null;
          rejection_reason?: string | null;
          status?: string | null;
          submitted_at?: string | null;
          total_hours?: number;
          updated_at?: string | null;
          week_end_date: string;
          week_start_date: string;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string | null;
          employee_id?: string;
          id?: string;
          notes?: string | null;
          overtime_hours?: number | null;
          regular_hours?: number | null;
          rejection_reason?: string | null;
          status?: string | null;
          submitted_at?: string | null;
          total_hours?: number;
          updated_at?: string | null;
          week_end_date?: string;
          week_start_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'timesheets_approved_by_fkey';
            columns: ['approved_by'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'timesheets_employee_id_fkey';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['id'];
          },
        ];
      };
      training_enrollments: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          certificate_url: string | null;
          completion_date: string | null;
          created_at: string | null;
          employee_id: string;
          enrollment_date: string | null;
          feedback: string | null;
          id: string;
          passing_score: number | null;
          quiz_score: number | null;
          rating: number | null;
          rejection_reason: string | null;
          session_id: string | null;
          status: string | null;
          training_id: string;
          updated_at: string | null;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          certificate_url?: string | null;
          completion_date?: string | null;
          created_at?: string | null;
          employee_id: string;
          enrollment_date?: string | null;
          feedback?: string | null;
          id?: string;
          passing_score?: number | null;
          quiz_score?: number | null;
          rating?: number | null;
          rejection_reason?: string | null;
          session_id?: string | null;
          status?: string | null;
          training_id: string;
          updated_at?: string | null;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          certificate_url?: string | null;
          completion_date?: string | null;
          created_at?: string | null;
          employee_id?: string;
          enrollment_date?: string | null;
          feedback?: string | null;
          id?: string;
          passing_score?: number | null;
          quiz_score?: number | null;
          rating?: number | null;
          rejection_reason?: string | null;
          session_id?: string | null;
          status?: string | null;
          training_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'training_enrollments_approved_by_fkey';
            columns: ['approved_by'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'training_enrollments_employee_id_fkey';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'training_enrollments_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'training_sessions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'training_enrollments_training_id_fkey';
            columns: ['training_id'];
            isOneToOne: false;
            referencedRelation: 'trainings';
            referencedColumns: ['id'];
          },
        ];
      };
      training_programs: {
        Row: {
          category: string;
          created_at: string;
          description: string | null;
          duration_hours: number;
          end_date: string | null;
          format: string;
          id: string;
          max_participants: number | null;
          participants_count: number | null;
          provider: string;
          rating: number | null;
          start_date: string | null;
          status: string;
          tenant_id: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          description?: string | null;
          duration_hours: number;
          end_date?: string | null;
          format: string;
          id?: string;
          max_participants?: number | null;
          participants_count?: number | null;
          provider: string;
          rating?: number | null;
          start_date?: string | null;
          status?: string;
          tenant_id?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string | null;
          duration_hours?: number;
          end_date?: string | null;
          format?: string;
          id?: string;
          max_participants?: number | null;
          participants_count?: number | null;
          provider?: string;
          rating?: number | null;
          start_date?: string | null;
          status?: string;
          tenant_id?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      training_sessions: {
        Row: {
          created_at: string | null;
          current_participants: number | null;
          end_date: string;
          external_trainer: string | null;
          id: string;
          location: string | null;
          max_participants: number | null;
          notes: string | null;
          start_date: string;
          status: string | null;
          trainer_id: string | null;
          training_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          current_participants?: number | null;
          end_date: string;
          external_trainer?: string | null;
          id?: string;
          location?: string | null;
          max_participants?: number | null;
          notes?: string | null;
          start_date: string;
          status?: string | null;
          trainer_id?: string | null;
          training_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          current_participants?: number | null;
          end_date?: string;
          external_trainer?: string | null;
          id?: string;
          location?: string | null;
          max_participants?: number | null;
          notes?: string | null;
          start_date?: string;
          status?: string | null;
          trainer_id?: string | null;
          training_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'training_sessions_trainer_id_fkey';
            columns: ['trainer_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'training_sessions_training_id_fkey';
            columns: ['training_id'];
            isOneToOne: false;
            referencedRelation: 'trainings';
            referencedColumns: ['id'];
          },
        ];
      };
      training_skills: {
        Row: {
          created_at: string | null;
          id: string;
          skill_id: string;
          skill_level_target: string;
          training_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          skill_id: string;
          skill_level_target: string;
          training_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          skill_id?: string;
          skill_level_target?: string;
          training_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'training_skills_skill_id_fkey';
            columns: ['skill_id'];
            isOneToOne: false;
            referencedRelation: 'skills';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'training_skills_training_id_fkey';
            columns: ['training_id'];
            isOneToOne: false;
            referencedRelation: 'trainings';
            referencedColumns: ['id'];
          },
        ];
      };
      trainings: {
        Row: {
          category: string;
          cost: number | null;
          created_at: string | null;
          created_by: string | null;
          currency: string | null;
          description: string | null;
          duration_hours: number;
          id: string;
          is_active: boolean | null;
          is_mandatory: boolean | null;
          language: string | null;
          level: string | null;
          max_participants: number | null;
          objectives: string[] | null;
          prerequisites: string[] | null;
          provider: string | null;
          title: string;
          type: string;
          updated_at: string | null;
          url: string | null;
        };
        Insert: {
          category: string;
          cost?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          currency?: string | null;
          description?: string | null;
          duration_hours?: number;
          id?: string;
          is_active?: boolean | null;
          is_mandatory?: boolean | null;
          language?: string | null;
          level?: string | null;
          max_participants?: number | null;
          objectives?: string[] | null;
          prerequisites?: string[] | null;
          provider?: string | null;
          title: string;
          type?: string;
          updated_at?: string | null;
          url?: string | null;
        };
        Update: {
          category?: string;
          cost?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          currency?: string | null;
          description?: string | null;
          duration_hours?: number;
          id?: string;
          is_active?: boolean | null;
          is_mandatory?: boolean | null;
          language?: string | null;
          level?: string | null;
          max_participants?: number | null;
          objectives?: string[] | null;
          prerequisites?: string[] | null;
          provider?: string | null;
          title?: string;
          type?: string;
          updated_at?: string | null;
          url?: string | null;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          assigned_at: string;
          assigned_by: string | null;
          context_id: string | null;
          context_type: string | null;
          created_at: string;
          expires_at: string | null;
          id: string;
          is_active: boolean;
          role_id: string;
          tenant_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          assigned_at?: string;
          assigned_by?: string | null;
          context_id?: string | null;
          context_type?: string | null;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean;
          role_id: string;
          tenant_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          assigned_at?: string;
          assigned_by?: string | null;
          context_id?: string | null;
          context_type?: string | null;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean;
          role_id?: string;
          tenant_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_roles_role_id_fkey';
            columns: ['role_id'];
            isOneToOne: false;
            referencedRelation: 'roles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_roles_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      webhook_logs: {
        Row: {
          created_at: string | null;
          error_message: string | null;
          http_status_code: number | null;
          id: string;
          invitation_id: string | null;
          request_payload: Json | null;
          response_body: string | null;
          status: string | null;
          user_email: string | null;
          user_id: string | null;
          webhook_name: string;
        };
        Insert: {
          created_at?: string | null;
          error_message?: string | null;
          http_status_code?: number | null;
          id?: string;
          invitation_id?: string | null;
          request_payload?: Json | null;
          response_body?: string | null;
          status?: string | null;
          user_email?: string | null;
          user_id?: string | null;
          webhook_name: string;
        };
        Update: {
          created_at?: string | null;
          error_message?: string | null;
          http_status_code?: number | null;
          id?: string;
          invitation_id?: string | null;
          request_payload?: Json | null;
          response_body?: string | null;
          status?: string | null;
          user_email?: string | null;
          user_id?: string | null;
          webhook_name?: string;
        };
        Relationships: [];
      };
      work_locations: {
        Row: {
          check_in_time: string | null;
          check_out_time: string | null;
          created_at: string | null;
          employee_id: string;
          id: string;
          location_address: string | null;
          location_type: string;
          notes: string | null;
          total_hours: number | null;
          work_date: string;
        };
        Insert: {
          check_in_time?: string | null;
          check_out_time?: string | null;
          created_at?: string | null;
          employee_id: string;
          id?: string;
          location_address?: string | null;
          location_type: string;
          notes?: string | null;
          total_hours?: number | null;
          work_date: string;
        };
        Update: {
          check_in_time?: string | null;
          check_out_time?: string | null;
          created_at?: string | null;
          employee_id?: string;
          id?: string;
          location_address?: string | null;
          location_type?: string;
          notes?: string | null;
          total_hours?: number | null;
          work_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'work_locations_employee_id_fkey';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      current_alerts_view: {
        Row: {
          application_domain: string | null;
          category: string | null;
          code: string | null;
          context_data: Json | null;
          description: string | null;
          entity_id: string | null;
          entity_name: string | null;
          entity_type: string | null;
          id: string | null;
          severity: string | null;
          tenant_id: string | null;
          title: string | null;
          triggered_at: string | null;
          type: string | null;
        };
        Relationships: [];
      };
      invitation_status_summary: {
        Row: {
          count: number | null;
          last_30_days: number | null;
          last_7_days: number | null;
          status: string | null;
          tenant_id: string | null;
        };
        Relationships: [];
      };
      onboarding_metrics: {
        Row: {
          avg_completion_days: number | null;
          avg_progress: number | null;
          completed_processes: number | null;
          in_progress_processes: number | null;
          pending_processes: number | null;
          tenant_id: string | null;
          total_processes: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'onboarding_processes_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      v_task_dependencies_info: {
        Row: {
          created_at: string | null;
          dependency_type: string | null;
          depends_on_task_id: string | null;
          id: string | null;
          lag_days: number | null;
          predecessor_end: string | null;
          predecessor_start: string | null;
          predecessor_status: string | null;
          predecessor_title: string | null;
          successor_end: string | null;
          successor_start: string | null;
          successor_status: string | null;
          successor_title: string | null;
          task_id: string | null;
          updated_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'task_dependencies_depends_on_task_id_fkey';
            columns: ['depends_on_task_id'];
            isOneToOne: false;
            referencedRelation: 'tasks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'task_dependencies_task_id_fkey';
            columns: ['task_id'];
            isOneToOne: false;
            referencedRelation: 'tasks';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Functions: {
      auto_create_complete_tenant_owner_for_existing: {
        Args: { user_email: string; user_id: string; user_metadata: Json };
        Returns: undefined;
      };
      auto_create_tenant_owner_direct:
        | { Args: { user_record: unknown }; Returns: undefined }
        | {
            Args: { p_email: string; p_metadata?: Json; p_user_id: string };
            Returns: undefined;
          };
      calculate_alert_recommendations: {
        Args: { p_alert_instance_id: string };
        Returns: undefined;
      };
      calculate_project_progress: {
        Args: { p_project_id: string };
        Returns: number;
      };
      calculate_working_days: {
        Args: { end_date: string; start_date: string };
        Returns: number;
      };
      can_access_resource: {
        Args: {
          p_action?: string;
          p_resource_id: string;
          p_resource_type: string;
        };
        Returns: boolean;
      };
      can_invite_collaborators: { Args: { user_id?: string }; Returns: boolean };
      can_validate_action: {
        Args: { p_action_template_id: string; p_task_id?: string };
        Returns: boolean;
      };
      can_validate_task: { Args: { p_task_id: string }; Returns: boolean };
      check_dependency_cycle: {
        Args: { p_depends_on_id: string; p_task_id: string };
        Returns: boolean;
      };
      cleanup_debug_logs: { Args: never; Returns: number };
      cleanup_expired_invitations: { Args: never; Returns: number };
      cleanup_test_user: { Args: { test_email: string }; Returns: Json };
      clone_operational_actions_to_task: {
        Args: { p_activity_id: string; p_task_id: string };
        Returns: undefined;
      };
      compute_task_progress: { Args: { p_task_id: string }; Returns: number };
      compute_task_status: { Args: { p_task_id: string }; Returns: string };
      confirm_user_email: { Args: { user_id: string }; Returns: Json };
      create_leave_approval_workflow: {
        Args: { p_leave_request_id: string };
        Returns: undefined;
      };
      create_notification: {
        Args: {
          p_action_url?: string;
          p_message: string;
          p_metadata?: Json;
          p_tenant_id: string;
          p_title: string;
          p_type: string;
          p_user_id: string;
        };
        Returns: string;
      };
      create_smart_notification: {
        Args: {
          p_entity_id: string;
          p_entity_type: string;
          p_message: string;
          p_metadata?: Json;
          p_notification_type: string;
          p_priority?: string;
          p_sender_id?: string;
          p_title: string;
        };
        Returns: undefined;
      };
      create_tenant_and_owner_atomic: {
        Args: {
          p_company_name: string;
          p_invitation_token: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      create_tenant_for_existing_user: {
        Args: { user_email: string };
        Returns: Json;
      };
      create_tenant_owner_from_invitation: {
        Args: {
          company_name: string;
          invitation_token: string;
          user_password: string;
        };
        Returns: Json;
      };
      daily_maintenance: { Args: never; Returns: undefined };
      debug_tenant_creation: { Args: { user_email: string }; Returns: Json };
      delete_activity_with_future_occurrences: {
        Args: { p_activity_id: string; p_keep_completed?: boolean };
        Returns: Json;
      };
      diagnose_onboarding_system: { Args: never; Returns: Json };
      diagnose_user_access_v2: {
        Args: { p_user_id: string };
        Returns: {
          check_name: string;
          details: Json;
          status: string;
        }[];
      };
      distribute_equal_weights: {
        Args: { p_task_id: string };
        Returns: undefined;
      };
      fix_existing_user_roles: { Args: never; Returns: string };
      fix_existing_user_roles_corrected: { Args: never; Returns: string };
      force_create_tenant_owner: { Args: { user_email: string }; Returns: Json };
      generate_display_order: {
        Args: { p_parent_id: string; p_task_level: number };
        Returns: string;
      };
      generate_invitation_token: { Args: never; Returns: string };
      generate_next_employee_id: {
        Args: { p_tenant_id: string };
        Returns: string;
      };
      generate_unique_employee_id: {
        Args: { p_tenant_id: string };
        Returns: string;
      };
      generate_unique_tenant_slug: {
        Args: { base_name: string };
        Returns: string;
      };
      get_action_attachments_count: {
        Args: { p_action_template_id: string; p_task_id?: string };
        Returns: number;
      };
      get_action_dependencies_graph: {
        Args: { p_activity_id: string };
        Returns: {
          action_id: string;
          action_position: number;
          action_title: string;
          assigned_name: string;
          assignee_id: string;
          depends_on: string[];
          depends_on_titles: string[];
          estimated_hours: number;
        }[];
      };
      get_activity_statistics: {
        Args: { p_activity_id: string };
        Returns: Json;
      };
      get_basic_notification_recipients: {
        Args: { p_entity_id: string; p_notification_type: string };
        Returns: {
          recipient_id: string;
          should_notify: boolean;
        }[];
      };
      get_current_tenant_id: { Args: never; Returns: string };
      get_debug_stats: {
        Args: never;
        Returns: {
          count: number;
          last_occurrence: string;
          log_level: string;
          log_type: string;
        }[];
      };
      get_dependency_chain: {
        Args: { p_task_id: string };
        Returns: {
          level_depth: number;
          path: string[];
          task_id: string;
          task_title: string;
        }[];
      };
      get_employee_name: { Args: { p_user_id: string }; Returns: string };
      get_invitation_details: {
        Args: { p_invitation_token: string };
        Returns: Json;
      };
      get_invitation_info: { Args: { invitation_token: string }; Returns: Json };
      get_next_approver: {
        Args: { p_leave_request_id: string };
        Returns: {
          approver_id: string;
          approver_level: number;
          sequence_order: number;
        }[];
      };
      get_next_employee_id: { Args: never; Returns: string };
      get_projects_with_stats: {
        Args: { p_tenant_id: string };
        Returns: {
          department_name: string;
          manager_name: string;
          progress: number;
          project_id: string;
          project_name: string;
          status: string;
          task_count: number;
        }[];
      };
      get_recent_task_activities: {
        Args: { p_limit?: number };
        Returns: {
          action_type: string;
          changed_at: string;
          changed_by: string;
          field_name: string;
          new_value: string;
          old_value: string;
          task_id: string;
          task_title: string;
          user_email: string;
        }[];
      };
      get_role_id_by_name: {
        Args: { role_name: string; tenant_uuid: string };
        Returns: string;
      };
      get_task_attachments_count: {
        Args: { p_task_id: string };
        Returns: number;
      };
      get_task_dependencies: {
        Args: { p_task_id: string };
        Returns: {
          dependency_id: string;
          dependency_type: string;
          is_predecessor: boolean;
          lag_days: number;
          related_due_date: string;
          related_start_date: string;
          related_status: string;
          related_task_id: string;
          related_task_title: string;
        }[];
      };
      get_task_history: {
        Args: { p_task_id: string };
        Returns: {
          action_type: string;
          changed_at: string;
          changed_by: string;
          field_name: string;
          id: string;
          metadata: Json;
          new_value: string;
          old_value: string;
          user_email: string;
        }[];
      };
      get_user_actual_tenant_id: { Args: never; Returns: string };
      get_user_debug_logs: {
        Args: { p_limit?: number; p_user_id: string };
        Returns: {
          created_at: string;
          details: Json;
          log_level: string;
          log_type: string;
          message: string;
        }[];
      };
      get_user_invitation_info: { Args: { user_email: string }; Returns: Json };
      get_user_permissions_complete: {
        Args: { p_user_id: string };
        Returns: {
          permission_action: string;
          permission_description: string;
          permission_id: string;
          permission_name: string;
          permission_resource: string;
          role_id: string;
          role_name: string;
          tenant_id: string;
        }[];
      };
      get_user_roles:
        | {
            Args: { p_user_id?: string };
            Returns: {
              context_id: string;
              context_type: string;
              hierarchy_level: number;
              role_display_name: string;
              role_name: string;
            }[];
          }
        | {
            Args: never;
            Returns: {
              role_id: string;
              role_name: string;
              tenant_id: string;
            }[];
          };
      get_user_roles_complete: {
        Args: { p_user_id: string };
        Returns: {
          assigned_at: string;
          is_active: boolean;
          role_description: string;
          role_id: string;
          role_name: string;
          tenant_id: string;
          user_id: string;
          user_role_id: string;
        }[];
      };
      get_user_tenant_from_profile: {
        Args: { p_user_id: string };
        Returns: string;
      };
      get_user_tenant_id: { Args: { user_uuid?: string }; Returns: string };
      get_user_tenant_info: { Args: { user_id: string }; Returns: Json };
      has_global_access: { Args: { user_id?: string }; Returns: boolean };
      has_permission:
        | {
            Args: {
              p_action: string;
              p_context?: string;
              p_context_id?: string;
              p_resource: string;
            };
            Returns: boolean;
          }
        | {
            Args: { action_name: string; resource_name: string };
            Returns: boolean;
          };
      increment_template_usage: {
        Args: { template_id: string };
        Returns: undefined;
      };
      instantiate_one_off_activity: {
        Args: { p_activity_id: string; p_due_date: string; p_title?: string };
        Returns: string;
      };
      is_email_in_tenant: {
        Args: { email_param: string; tenant_id_param: string };
        Returns: boolean;
      };
      is_pending_tenant_owner: {
        Args: { user_email: string };
        Returns: boolean;
      };
      is_super_admin: { Args: { user_id?: string }; Returns: boolean };
      is_super_admin_optimized: { Args: never; Returns: boolean };
      is_tenant_admin: { Args: never; Returns: boolean };
      log_debug: {
        Args: {
          p_details?: Json;
          p_log_level: string;
          p_log_type: string;
          p_message: string;
          p_user_id: string;
        };
        Returns: undefined;
      };
      log_task_change: {
        Args: {
          p_action_type: string;
          p_field_name?: string;
          p_metadata?: Json;
          p_new_value?: string;
          p_old_value?: string;
          p_task_id: string;
        };
        Returns: string;
      };
      mark_notifications_read: {
        Args: { notification_ids: string[] };
        Returns: undefined;
      };
      next_employee_id: { Args: never; Returns: string };
      onboard_tenant_owner: {
        Args: {
          p_email: string;
          p_invite_code: string;
          p_slug: string;
          p_tenant_name: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      pause_activity: {
        Args: { p_activity_id: string; p_is_active: boolean };
        Returns: undefined;
      };
      process_leave_approval: {
        Args: { p_approval_id: string; p_notes?: string; p_status: string };
        Returns: Json;
      };
      refresh_all_stats: { Args: never; Returns: undefined };
      repair_all_existing_users: { Args: never; Returns: string };
      repair_display_order: { Args: never; Returns: undefined };
      repair_existing_tenant_owner: {
        Args: { p_user_email: string };
        Returns: string;
      };
      repair_incomplete_users:
        | { Args: { target_email?: string }; Returns: Json }
        | {
            Args: never;
            Returns: {
              email: string;
              status: string;
              user_id: string;
            }[];
          };
      repair_tenant_owner_complete: {
        Args: {
          p_email: string;
          p_full_name: string;
          p_tenant_id: string;
          p_token?: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      should_notify_user:
        | {
            Args: {
              p_entity_id: string;
              p_entity_type: string;
              p_notification_type: string;
              p_user_id: string;
            };
            Returns: boolean;
          }
        | {
            Args: { p_notification_type: string; p_user_id: string };
            Returns: boolean;
          };
      signup_tenant_owner: {
        Args: {
          company_name: string;
          invitation_token: string;
          user_email: string;
          user_full_name: string;
          user_password: string;
        };
        Returns: Json;
      };
      signup_tenant_owner_v2: {
        Args: {
          company_name: string;
          invitation_token: string;
          user_email: string;
          user_full_name: string;
          user_password: string;
        };
        Returns: Json;
      };
      signup_tenant_owner_v3: {
        Args: {
          company_name: string;
          invitation_token: string;
          user_email: string;
          user_full_name: string;
          user_id: string;
          user_password: string;
        };
        Returns: Json;
      };
      signup_tenant_owner_v4: {
        Args: {
          company_name: string;
          invitation_token: string;
          user_email: string;
          user_full_name: string;
        };
        Returns: Json;
      };
      signup_tenant_owner_v5: {
        Args: {
          company_name: string;
          invitation_token: string;
          user_email: string;
          user_full_name: string;
          user_id: string;
        };
        Returns: Json;
      };
      signup_tenant_owner_v6: {
        Args: {
          company_name: string;
          invitation_token: string;
          user_email: string;
          user_full_name: string;
          user_id: string;
        };
        Returns: Json;
      };
      test_edge_function_system: { Args: { test_email: string }; Returns: Json };
      test_edge_function_webhook: {
        Args: { user_email: string };
        Returns: Json;
      };
      user_has_permission: {
        Args: { p_permission_name: string; p_user_id: string };
        Returns: boolean;
      };
      user_has_role: { Args: { role_names: string[] }; Returns: boolean };
      user_has_role_any_tenant: {
        Args: { role_names: string[] };
        Returns: boolean;
      };
      user_has_role_corrected: {
        Args: { p_role_names: string[]; p_user_id: string };
        Returns: boolean;
      };
      validate_action_dependency_graph: {
        Args: { p_activity_id: string };
        Returns: {
          cycle_path: string[];
          has_cycles: boolean;
          is_valid: boolean;
        }[];
      };
      validate_collaborator_invitation: {
        Args: { token_input: string };
        Returns: {
          department: string;
          email: string;
          full_name: string;
          invitation_id: string;
          invited_by: string;
          job_position: string;
          metadata: Json;
          role_to_assign: string;
          tenant_id: string;
        }[];
      };
      validate_invitation: { Args: { invite_code: string }; Returns: Json };
      validate_invitation_token: {
        Args: { token_input: string };
        Returns: {
          email: string;
          full_name: string;
          invitation_id: string;
          invitation_type: string;
          tenant_id: string;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
