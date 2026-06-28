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
      ai_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string
          id: string
          instructor: string | null
          notes: string | null
          platform: string | null
          progress: number
          rating: number | null
          status: string
          title: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructor?: string | null
          notes?: string | null
          platform?: string | null
          progress?: number
          rating?: number | null
          status?: string
          title: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          instructor?: string | null
          notes?: string | null
          platform?: string | null
          progress?: number
          rating?: number | null
          status?: string
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          all_day: boolean
          category: string | null
          color: string | null
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          location: string | null
          starts_at: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          all_day?: boolean
          category?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          location?: string | null
          starts_at: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          all_day?: boolean
          category?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          location?: string | null
          starts_at?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      freelancers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          rate: number | null
          rating: number | null
          specialty: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          rate?: number | null
          rating?: number | null
          specialty?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          rate?: number | null
          rating?: number | null
          specialty?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          progress: number
          status: string
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          progress?: number
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          progress?: number
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          created_at: string
          habit_id: string
          id: string
          log_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          habit_id: string
          id?: string
          log_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          habit_id?: string
          id?: string
          log_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          archived: boolean
          color: string | null
          created_at: string
          description: string | null
          frequency: string
          icon: string | null
          id: string
          name: string
          target_per_period: number
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          color?: string | null
          created_at?: string
          description?: string | null
          frequency?: string
          icon?: string | null
          id?: string
          name: string
          target_per_period?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          color?: string | null
          created_at?: string
          description?: string | null
          frequency?: string
          icon?: string | null
          id?: string
          name?: string
          target_per_period?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meals: {
        Row: {
          calories: number | null
          carbs: number | null
          consumed_on: string
          created_at: string
          description: string
          fat: number | null
          id: string
          meal_type: string
          protein: number | null
          user_id: string
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          consumed_on?: string
          created_at?: string
          description: string
          fat?: number | null
          id?: string
          meal_type: string
          protein?: number | null
          user_id: string
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          consumed_on?: string
          created_at?: string
          description?: string
          fat?: number | null
          id?: string
          meal_type?: string
          protein?: number | null
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string | null
          created_at: string
          favorite: boolean
          folder: string | null
          id: string
          pinned: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          favorite?: boolean
          folder?: string | null
          id?: string
          pinned?: boolean
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          favorite?: boolean
          folder?: string | null
          id?: string
          pinned?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          company: string | null
          created_at: string
          full_name: string | null
          id: string
          role: string | null
          updated_at: string
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          client_id: string | null
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          progress: number
          status: string
          title: string
          updated_at: string
          user_id: string
          value: number | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          progress?: number
          status?: string
          title: string
          updated_at?: string
          user_id: string
          value?: number | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          progress?: number
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          created_at: string
          id: string
          minutes: number
          notes: string | null
          studied_on: string
          subject: string
          topic: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          minutes?: number
          notes?: string | null
          studied_on?: string
          subject: string
          topic?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          minutes?: number
          notes?: string | null
          studied_on?: string
          subject?: string
          topic?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          category: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          position: number
          priority: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          priority?: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          priority?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          description: string | null
          id: string
          kind: string
          occurred_on: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind: string
          occurred_on?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          occurred_on?: string
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          created_at: string
          current_streak: number
          last_activity_date: string | null
          level: number
          longest_streak: number
          total_habits_completed: number
          total_tasks_completed: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          current_streak?: number
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          total_habits_completed?: number
          total_tasks_completed?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          current_streak?: number
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          total_habits_completed?: number
          total_tasks_completed?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      workouts: {
        Row: {
          category: string | null
          created_at: string
          duration_min: number | null
          exercises: Json
          id: string
          intensity: string | null
          name: string
          notes: string | null
          performed_on: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          duration_min?: number | null
          exercises?: Json
          id?: string
          intensity?: string | null
          name: string
          notes?: string | null
          performed_on?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          duration_min?: number | null
          exercises?: Json
          id?: string
          intensity?: string | null
          name?: string
          notes?: string | null
          performed_on?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
