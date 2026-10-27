export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      academic_terms: {
        Row: {
          created_at: string;
          ends_on: string;
          id: string;
          institution_id: string;
          name: string;
          starts_on: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          ends_on: string;
          id?: string;
          institution_id: string;
          name: string;
          starts_on: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          ends_on?: string;
          id?: string;
          institution_id?: string;
          name?: string;
          starts_on?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "academic_terms_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
        ];
      };
      announcements: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          institution_id: string;
          offering_id: string | null;
          published: boolean;
          title: string;
          updated_at: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          institution_id: string;
          offering_id?: string | null;
          published?: boolean;
          title: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          institution_id?: string;
          offering_id?: string | null;
          published?: boolean;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "announcements_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "announcements_institution_id_offering_id_fkey";
            columns: ["institution_id", "offering_id"];
            isOneToOne: false;
            referencedRelation: "offerings";
            referencedColumns: ["institution_id", "id"];
          },
        ];
      };
      answer_keys: {
        Row: {
          created_at: string;
          expected_answer: string | null;
          id: string;
          institution_id: string;
          option_id: string | null;
          question_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          expected_answer?: string | null;
          id?: string;
          institution_id: string;
          option_id?: string | null;
          question_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          expected_answer?: string | null;
          id?: string;
          institution_id?: string;
          option_id?: string | null;
          question_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "answer_keys_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "answer_keys_institution_id_option_id_fkey";
            columns: ["institution_id", "option_id"];
            isOneToOne: false;
            referencedRelation: "answer_options";
            referencedColumns: ["institution_id", "id"];
          },
          {
            foreignKeyName: "answer_keys_institution_id_question_id_fkey";
            columns: ["institution_id", "question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["institution_id", "id"];
          },
          {
            foreignKeyName: "answer_option_question_fk";
            columns: ["institution_id", "question_id", "option_id"];
            isOneToOne: false;
            referencedRelation: "answer_options";
            referencedColumns: ["institution_id", "question_id", "id"];
          },
        ];
      };
      answer_options: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          institution_id: string;
          position: number;
          question_id: string;
          updated_at: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          institution_id: string;
          position?: number;
          question_id: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          institution_id?: string;
          position?: number;
          question_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "answer_options_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "answer_options_institution_id_question_id_fkey";
            columns: ["institution_id", "question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["institution_id", "id"];
          },
        ];
      };
      assessment_attempts: {
        Row: {
          assessment_id: string;
          created_at: string;
          expires_at: string;
          finished_at: string | null;
          id: string;
          institution_id: string;
          started_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          assessment_id: string;
          created_at?: string;
          expires_at: string;
          finished_at?: string | null;
          id?: string;
          institution_id: string;
          started_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          assessment_id?: string;
          created_at?: string;
          expires_at?: string;
          finished_at?: string | null;
          id?: string;
          institution_id?: string;
          started_at?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assessment_attempts_institution_id_assessment_id_fkey";
            columns: ["institution_id", "assessment_id"];
            isOneToOne: false;
            referencedRelation: "assessments";
            referencedColumns: ["institution_id", "id"];
          },
          {
            foreignKeyName: "assessment_attempts_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
        ];
      };
      assessment_responses: {
        Row: {
          attempt_id: string;
          created_at: string;
          feedback: string;
          id: string;
          institution_id: string;
          points: number | null;
          question_id: string;
          response: string | null;
          updated_at: string;
        };
        Insert: {
          attempt_id: string;
          created_at?: string;
          feedback?: string;
          id?: string;
          institution_id: string;
          points?: number | null;
          question_id: string;
          response?: string | null;
          updated_at?: string;
        };
        Update: {
          attempt_id?: string;
          created_at?: string;
          feedback?: string;
          id?: string;
          institution_id?: string;
          points?: number | null;
          question_id?: string;
          response?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assessment_responses_institution_id_attempt_id_fkey";
            columns: ["institution_id", "attempt_id"];
            isOneToOne: false;
            referencedRelation: "assessment_attempts";
            referencedColumns: ["institution_id", "id"];
          },
          {
            foreignKeyName: "assessment_responses_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessment_responses_institution_id_question_id_fkey";
            columns: ["institution_id", "question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["institution_id", "id"];
          },
          {
            foreignKeyName: "response_snapshot_fk";
            columns: ["institution_id", "attempt_id", "question_id"];
            isOneToOne: true;
            referencedRelation: "attempt_questions";
            referencedColumns: ["institution_id", "attempt_id", "question_id"];
          },
        ];
      };
      assessments: {
        Row: {
          attempt_limit: number;
          closes_at: string;
          created_at: string;
          id: string;
          institution_id: string;
          kind: string;
          offering_id: string;
          opens_at: string;
          published: boolean;
          randomized: boolean;
          results_published: boolean;
          time_limit_minutes: number | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          attempt_limit?: number;
          closes_at: string;
          created_at?: string;
          id?: string;
          institution_id: string;
          kind: string;
          offering_id: string;
          opens_at: string;
          published?: boolean;
          randomized?: boolean;
          results_published?: boolean;
          time_limit_minutes?: number | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          attempt_limit?: number;
          closes_at?: string;
          created_at?: string;
          id?: string;
          institution_id?: string;
          kind?: string;
          offering_id?: string;
          opens_at?: string;
          published?: boolean;
          randomized?: boolean;
          results_published?: boolean;
          time_limit_minutes?: number | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assessments_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessments_institution_id_offering_id_fkey";
            columns: ["institution_id", "offering_id"];
            isOneToOne: false;
            referencedRelation: "offerings";
            referencedColumns: ["institution_id", "id"];
          },
        ];
      };
      assignments: {
        Row: {
          created_at: string;
          due_at: string;
          id: string;
          institution_id: string;
          instructions: string;
          max_points: number;
          max_submissions: number;
          offering_id: string;
          published: boolean;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          due_at: string;
          id?: string;
          institution_id: string;
          instructions?: string;
          max_points: number;
          max_submissions?: number;
          offering_id: string;
          published?: boolean;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          due_at?: string;
          id?: string;
          institution_id?: string;
          instructions?: string;
          max_points?: number;
          max_submissions?: number;
          offering_id?: string;
          published?: boolean;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assignments_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assignments_institution_id_offering_id_fkey";
            columns: ["institution_id", "offering_id"];
            isOneToOne: false;
            referencedRelation: "offerings";
            referencedColumns: ["institution_id", "id"];
          },
        ];
      };
      attempt_questions: {
        Row: {
          attempt_id: string;
          created_at: string;
          id: string;
          institution_id: string;
          kind: string;
          marking_key: Json;
          max_points: number;
          options: Json;
          position: number;
          prompt: string;
          question_id: string;
          updated_at: string;
        };
        Insert: {
          attempt_id: string;
          created_at?: string;
          id?: string;
          institution_id: string;
          kind: string;
          marking_key?: Json;
          max_points: number;
          options?: Json;
          position: number;
          prompt: string;
          question_id: string;
          updated_at?: string;
        };
        Update: {
          attempt_id?: string;
          created_at?: string;
          id?: string;
          institution_id?: string;
          kind?: string;
          marking_key?: Json;
          max_points?: number;
          options?: Json;
          position?: number;
          prompt?: string;
          question_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attempt_questions_institution_id_attempt_id_fkey";
            columns: ["institution_id", "attempt_id"];
            isOneToOne: false;
            referencedRelation: "assessment_attempts";
            referencedColumns: ["institution_id", "id"];
          },
          {
            foreignKeyName: "attempt_questions_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attempt_questions_institution_id_question_id_fkey";
            columns: ["institution_id", "question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["institution_id", "id"];
          },
        ];
      };
      attendance: {
        Row: {
          created_at: string;
          id: string;
          institution_id: string;
          offering_id: string;
          session_date: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          institution_id: string;
          offering_id: string;
          session_date: string;
          status: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          institution_id?: string;
          offering_id?: string;
          session_date?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_institution_id_offering_id_fkey";
            columns: ["institution_id", "offering_id"];
            isOneToOne: false;
            referencedRelation: "offerings";
            referencedColumns: ["institution_id", "id"];
          },
          {
            foreignKeyName: "attendance_institution_id_user_id_fkey";
            columns: ["institution_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "memberships";
            referencedColumns: ["institution_id", "user_id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          actor_id: string | null;
          created_at: string;
          entity: string;
          id: string;
          institution_id: string;
          operation: string;
          record_id: string;
          updated_at: string;
        };
        Insert: {
          actor_id?: string | null;
          created_at?: string;
          entity: string;
          id?: string;
          institution_id: string;
          operation: string;
          record_id: string;
          updated_at?: string;
        };
        Update: {
          actor_id?: string | null;
          created_at?: string;
          entity?: string;
          id?: string;
          institution_id?: string;
          operation?: string;
          record_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
        ];
      };
      calendar_events: {
        Row: {
          created_at: string;
          ends_at: string;
          id: string;
          institution_id: string;
          offering_id: string | null;
          starts_at: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          ends_at: string;
          id?: string;
          institution_id: string;
          offering_id?: string | null;
          starts_at: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          ends_at?: string;
          id?: string;
          institution_id?: string;
          offering_id?: string | null;
          starts_at?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "calendar_events_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "calendar_events_institution_id_offering_id_fkey";
            columns: ["institution_id", "offering_id"];
            isOneToOne: false;
            referencedRelation: "offerings";
            referencedColumns: ["institution_id", "id"];
          },
        ];
      };
      course_grades: {
        Row: {
          created_at: string;
          feedback: string;
          id: string;
          institution_id: string;
          offering_id: string;
          percentage: number;
          published: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          feedback?: string;
          id?: string;
          institution_id: string;
          offering_id: string;
          percentage: number;
          published?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          feedback?: string;
          id?: string;
          institution_id?: string;
          offering_id?: string;
          percentage?: number;
          published?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "course_grades_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "course_grades_institution_id_offering_id_fkey";
            columns: ["institution_id", "offering_id"];
            isOneToOne: false;
            referencedRelation: "offerings";
            referencedColumns: ["institution_id", "id"];
          },
          {
            foreignKeyName: "course_grades_institution_id_user_id_fkey";
            columns: ["institution_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "memberships";
            referencedColumns: ["institution_id", "user_id"];
          },
        ];
      };
      courses: {
        Row: {
          code: string;
          created_at: string;
          credits: number;
          department_id: string;
          description: string;
          id: string;
          institution_id: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          credits: number;
          department_id: string;
          description?: string;
          id?: string;
          institution_id: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          credits?: number;
          department_id?: string;
          description?: string;
          id?: string;
          institution_id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "courses_institution_id_department_id_fkey";
            columns: ["institution_id", "department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["institution_id", "id"];
          },
          {
            foreignKeyName: "courses_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
        ];
      };
      departments: {
        Row: {
          code: string;
          created_at: string;
          id: string;
          institution_id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          id?: string;
          institution_id: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          id?: string;
          institution_id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "departments_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
        ];
      };
      enrollments: {
        Row: {
          created_at: string;
          id: string;
          institution_id: string;
          offering_id: string;
          passed: boolean;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          institution_id: string;
          offering_id: string;
          passed?: boolean;
          status: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          institution_id?: string;
          offering_id?: string;
          passed?: boolean;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "enrollments_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_institution_id_offering_id_fkey";
            columns: ["institution_id", "offering_id"];
            isOneToOne: false;
            referencedRelation: "offerings";
            referencedColumns: ["institution_id", "id"];
          },
        ];
      };
      faculty_assignments: {
        Row: {
          created_at: string;
          id: string;
          institution_id: string;
          offering_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          institution_id: string;
          offering_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          institution_id?: string;
          offering_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "faculty_assignments_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "faculty_assignments_institution_id_offering_id_fkey";
            columns: ["institution_id", "offering_id"];
            isOneToOne: false;
            referencedRelation: "offerings";
            referencedColumns: ["institution_id", "id"];
          },
        ];
      };
      grade_categories: {
        Row: {
          created_at: string;
          id: string;
          institution_id: string;
          name: string;
          offering_id: string;
          updated_at: string;
          weight: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          institution_id: string;
          name: string;
          offering_id: string;
          updated_at?: string;
          weight: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          institution_id?: string;
          name?: string;
          offering_id?: string;
          updated_at?: string;
          weight?: number;
        };
        Relationships: [
          {
            foreignKeyName: "grade_categories_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "grade_categories_institution_id_offering_id_fkey";
            columns: ["institution_id", "offering_id"];
            isOneToOne: false;
            referencedRelation: "offerings";
            referencedColumns: ["institution_id", "id"];
          },
        ];
      };
      grade_items: {
        Row: {
          assessment_id: string | null;
          assignment_id: string | null;
          category_id: string;
          created_at: string;
          id: string;
          institution_id: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          assessment_id?: string | null;
          assignment_id?: string | null;
          category_id: string;
          created_at?: string;
          id?: string;
          institution_id: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          assessment_id?: string | null;
          assignment_id?: string | null;
          category_id?: string;
          created_at?: string;
          id?: string;
          institution_id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "grade_items_institution_id_assessment_id_fkey";
            columns: ["institution_id", "assessment_id"];
            isOneToOne: false;
            referencedRelation: "assessments";
            referencedColumns: ["institution_id", "id"];
          },
          {
            foreignKeyName: "grade_items_institution_id_assignment_id_fkey";
            columns: ["institution_id", "assignment_id"];
            isOneToOne: false;
            referencedRelation: "assignments";
            referencedColumns: ["institution_id", "id"];
          },
          {
            foreignKeyName: "grade_items_institution_id_category_id_fkey";
            columns: ["institution_id", "category_id"];
            isOneToOne: false;
            referencedRelation: "grade_categories";
            referencedColumns: ["institution_id", "id"];
          },
          {
            foreignKeyName: "grade_items_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
        ];
      };
      grades: {
        Row: {
          created_at: string;
          feedback: string;
          id: string;
          institution_id: string;
          points: number;
          published: boolean;
          submission_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          feedback?: string;
          id?: string;
          institution_id: string;
          points: number;
          published?: boolean;
          submission_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          feedback?: string;
          id?: string;
          institution_id?: string;
          points?: number;
          published?: boolean;
          submission_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "grades_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "grades_institution_id_submission_id_fkey";
            columns: ["institution_id", "submission_id"];
            isOneToOne: true;
            referencedRelation: "submissions";
            referencedColumns: ["institution_id", "id"];
          },
        ];
      };
      institutions: {
        Row: {
          created_at: string;
          credit_system: string;
          id: string;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          credit_system?: string;
          id?: string;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          credit_system?: string;
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      materials: {
        Row: {
          created_at: string;
          external_url: string | null;
          id: string;
          institution_id: string;
          module_id: string | null;
          object_path: string | null;
          offering_id: string;
          published: boolean;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          external_url?: string | null;
          id?: string;
          institution_id: string;
          module_id?: string | null;
          object_path?: string | null;
          offering_id: string;
          published?: boolean;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          external_url?: string | null;
          id?: string;
          institution_id?: string;
          module_id?: string | null;
          object_path?: string | null;
          offering_id?: string;
          published?: boolean;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "material_module_offering_fk";
            columns: ["institution_id", "offering_id", "module_id"];
            isOneToOne: false;
            referencedRelation: "modules";
            referencedColumns: ["institution_id", "offering_id", "id"];
          },
          {
            foreignKeyName: "materials_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "materials_institution_id_module_id_fkey";
            columns: ["institution_id", "module_id"];
            isOneToOne: false;
            referencedRelation: "modules";
            referencedColumns: ["institution_id", "id"];
          },
          {
            foreignKeyName: "materials_institution_id_offering_id_fkey";
            columns: ["institution_id", "offering_id"];
            isOneToOne: false;
            referencedRelation: "offerings";
            referencedColumns: ["institution_id", "id"];
          },
        ];
      };
      memberships: {
        Row: {
          active: boolean;
          created_at: string;
          id: string;
          institution_id: string;
          role: Database["public"]["Enums"]["campus_role"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          id?: string;
          institution_id: string;
          role: Database["public"]["Enums"]["campus_role"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          id?: string;
          institution_id?: string;
          role?: Database["public"]["Enums"]["campus_role"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memberships_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
        ];
      };
      modules: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          institution_id: string;
          offering_id: string;
          position: number;
          published: boolean;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string;
          id?: string;
          institution_id: string;
          offering_id: string;
          position?: number;
          published?: boolean;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          institution_id?: string;
          offering_id?: string;
          position?: number;
          published?: boolean;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "modules_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "modules_institution_id_offering_id_fkey";
            columns: ["institution_id", "offering_id"];
            isOneToOne: false;
            referencedRelation: "offerings";
            referencedColumns: ["institution_id", "id"];
          },
        ];
      };
      offerings: {
        Row: {
          capacity: number;
          course_id: string;
          created_at: string;
          id: string;
          institution_id: string;
          published: boolean;
          section: string;
          syllabus: string;
          term_id: string;
          updated_at: string;
          waitlist_enabled: boolean;
        };
        Insert: {
          capacity: number;
          course_id: string;
          created_at?: string;
          id?: string;
          institution_id: string;
          published?: boolean;
          section?: string;
          syllabus?: string;
          term_id: string;
          updated_at?: string;
          waitlist_enabled?: boolean;
        };
        Update: {
          capacity?: number;
          course_id?: string;
          created_at?: string;
          id?: string;
          institution_id?: string;
          published?: boolean;
          section?: string;
          syllabus?: string;
          term_id?: string;
          updated_at?: string;
          waitlist_enabled?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "offerings_institution_id_course_id_fkey";
            columns: ["institution_id", "course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["institution_id", "id"];
          },
          {
            foreignKeyName: "offerings_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "offerings_institution_id_term_id_fkey";
            columns: ["institution_id", "term_id"];
            isOneToOne: false;
            referencedRelation: "academic_terms";
            referencedColumns: ["institution_id", "id"];
          },
        ];
      };
      prerequisites: {
        Row: {
          course_id: string;
          created_at: string;
          id: string;
          institution_id: string;
          prerequisite_id: string;
          updated_at: string;
        };
        Insert: {
          course_id: string;
          created_at?: string;
          id?: string;
          institution_id: string;
          prerequisite_id: string;
          updated_at?: string;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          id?: string;
          institution_id?: string;
          prerequisite_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "prerequisites_institution_id_course_id_fkey";
            columns: ["institution_id", "course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["institution_id", "id"];
          },
          {
            foreignKeyName: "prerequisites_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prerequisites_institution_id_prerequisite_id_fkey";
            columns: ["institution_id", "prerequisite_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["institution_id", "id"];
          },
        ];
      };
      programs: {
        Row: {
          created_at: string;
          department_id: string;
          id: string;
          institution_id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          department_id: string;
          id?: string;
          institution_id: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          department_id?: string;
          id?: string;
          institution_id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "programs_institution_id_department_id_fkey";
            columns: ["institution_id", "department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["institution_id", "id"];
          },
          {
            foreignKeyName: "programs_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
        ];
      };
      questions: {
        Row: {
          assessment_id: string;
          created_at: string;
          id: string;
          institution_id: string;
          kind: string;
          points: number;
          position: number;
          prompt: string;
          updated_at: string;
        };
        Insert: {
          assessment_id: string;
          created_at?: string;
          id?: string;
          institution_id: string;
          kind: string;
          points: number;
          position?: number;
          prompt: string;
          updated_at?: string;
        };
        Update: {
          assessment_id?: string;
          created_at?: string;
          id?: string;
          institution_id?: string;
          kind?: string;
          points?: number;
          position?: number;
          prompt?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "questions_institution_id_assessment_id_fkey";
            columns: ["institution_id", "assessment_id"];
            isOneToOne: false;
            referencedRelation: "assessments";
            referencedColumns: ["institution_id", "id"];
          },
          {
            foreignKeyName: "questions_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
        ];
      };
      registration_windows: {
        Row: {
          closes_at: string;
          created_at: string;
          id: string;
          institution_id: string;
          opens_at: string;
          term_id: string;
          updated_at: string;
          withdrawal_closes_at: string;
        };
        Insert: {
          closes_at: string;
          created_at?: string;
          id?: string;
          institution_id: string;
          opens_at: string;
          term_id: string;
          updated_at?: string;
          withdrawal_closes_at: string;
        };
        Update: {
          closes_at?: string;
          created_at?: string;
          id?: string;
          institution_id?: string;
          opens_at?: string;
          term_id?: string;
          updated_at?: string;
          withdrawal_closes_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "registration_windows_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "registration_windows_institution_id_term_id_fkey";
            columns: ["institution_id", "term_id"];
            isOneToOne: false;
            referencedRelation: "academic_terms";
            referencedColumns: ["institution_id", "id"];
          },
        ];
      };
      submissions: {
        Row: {
          assignment_id: string;
          body: string;
          created_at: string;
          id: string;
          institution_id: string;
          object_path: string | null;
          revision: number;
          status: string;
          submitted_at: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          assignment_id: string;
          body?: string;
          created_at?: string;
          id?: string;
          institution_id: string;
          object_path?: string | null;
          revision?: number;
          status?: string;
          submitted_at?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          assignment_id?: string;
          body?: string;
          created_at?: string;
          id?: string;
          institution_id?: string;
          object_path?: string | null;
          revision?: number;
          status?: string;
          submitted_at?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "submissions_institution_id_assignment_id_fkey";
            columns: ["institution_id", "assignment_id"];
            isOneToOne: false;
            referencedRelation: "assignments";
            referencedColumns: ["institution_id", "id"];
          },
          {
            foreignKeyName: "submissions_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      author_question: {
        Args: { assessment: string; content: Json; tenant: string };
        Returns: string;
      };
      calculate_course_grade: {
        Args: {
          comments?: string;
          offering: string;
          publish?: boolean;
          student: string;
          tenant: string;
        };
        Returns: number;
      };
      grade_submission: {
        Args: {
          comments: string;
          publish?: boolean;
          score: number;
          submission: string;
          tenant: string;
        };
        Returns: string;
      };
      mark_response: {
        Args: {
          attempt: string;
          comments: string;
          question: string;
          score: number;
          tenant: string;
        };
        Returns: undefined;
      };
      my_attempts: {
        Args: { assessment: string; tenant: string };
        Returns: {
          expires_at: string;
          finished_at: string;
          id: string;
          started_at: string;
        }[];
      };
      read_attempt: {
        Args: { attempt: string; tenant: string };
        Returns: Json;
      };
      register_course: {
        Args: { offering: string; tenant: string; withdraw?: boolean };
        Returns: string;
      };
      save_attempt: {
        Args: {
          answers: Json;
          attempt: string;
          finalize?: boolean;
          tenant: string;
        };
        Returns: undefined;
      };
      set_membership: {
        Args: {
          enabled?: boolean;
          member: string;
          new_role: Database["public"]["Enums"]["campus_role"];
          tenant: string;
        };
        Returns: undefined;
      };
      start_assessment: {
        Args: { assessment: string; tenant: string };
        Returns: string;
      };
      submit_assignment: {
        Args: {
          assignment: string;
          body_text: string;
          finalize?: boolean;
          tenant: string;
        };
        Returns: string;
      };
    };
    Enums: {
      campus_role: "student" | "faculty" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
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
      campus_role: ["student", "faculty", "admin"],
    },
  },
} as const;
