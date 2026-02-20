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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ad_campaigns: {
        Row: {
          budget_points: number
          clicks: number
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          impressions: number
          spent_points: number
          start_date: string | null
          status: string
          target_audience: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_points?: number
          clicks?: number
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          impressions?: number
          spent_points?: number
          start_date?: string | null
          status?: string
          target_audience?: Json | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_points?: number
          clicks?: number
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          impressions?: number
          spent_points?: number
          start_date?: string | null
          status?: string
          target_audience?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cause_donations: {
        Row: {
          amount: number
          anonymous: boolean | null
          cause_id: string
          created_at: string
          donor_id: string
          id: string
          message: string | null
        }
        Insert: {
          amount: number
          anonymous?: boolean | null
          cause_id: string
          created_at?: string
          donor_id: string
          id?: string
          message?: string | null
        }
        Update: {
          amount?: number
          anonymous?: boolean | null
          cause_id?: string
          created_at?: string
          donor_id?: string
          id?: string
          message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cause_donations_cause_id_fkey"
            columns: ["cause_id"]
            isOneToOne: false
            referencedRelation: "causes"
            referencedColumns: ["id"]
          },
        ]
      }
      causes: {
        Row: {
          category: string
          created_at: string
          created_by: string
          description: string
          end_date: string | null
          goal_amount: number
          id: string
          image_url: string | null
          raised_amount: number | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by: string
          description: string
          end_date?: string | null
          goal_amount?: number
          id?: string
          image_url?: string | null
          raised_amount?: number | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          description?: string
          end_date?: string | null
          goal_amount?: number
          id?: string
          image_url?: string | null
          raised_amount?: number | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          likes_count: number
          parent_comment_id: string | null
          post_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          parent_comment_id?: string | null
          post_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          parent_comment_id?: string | null
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          category: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          image_url: string | null
          is_private: boolean | null
          member_count: number | null
          name: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_private?: boolean | null
          member_count?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_private?: boolean | null
          member_count?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_members: {
        Row: {
          community_id: string
          id: string
          joined_at: string
          role: string | null
          user_id: string
        }
        Insert: {
          community_id: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id: string
        }
        Update: {
          community_id?: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      earnings_history: {
        Row: {
          amount: number
          created_at: string
          id: string
          source: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          source: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      followers: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      live_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          stream_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          stream_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          stream_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_chat_messages_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      live_streams: {
        Row: {
          created_at: string
          description: string | null
          ended_at: string | null
          id: string
          scheduled_for: string | null
          started_at: string | null
          status: string
          stream_url: string | null
          thumbnail_url: string | null
          title: string
          user_id: string
          viewer_count: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          ended_at?: string | null
          id?: string
          scheduled_for?: string | null
          started_at?: string | null
          status?: string
          stream_url?: string | null
          thumbnail_url?: string | null
          title: string
          user_id: string
          viewer_count?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          ended_at?: string | null
          id?: string
          scheduled_for?: string | null
          started_at?: string | null
          status?: string
          stream_url?: string | null
          thumbnail_url?: string | null
          title?: string
          user_id?: string
          viewer_count?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      news_articles: {
        Row: {
          content: string | null
          created_at: string
          external_url: string | null
          id: string
          image_url: string | null
          published_at: string
          source: string
          source_type: string
          summary: string | null
          title: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          external_url?: string | null
          id?: string
          image_url?: string | null
          published_at?: string
          source: string
          source_type: string
          summary?: string | null
          title: string
        }
        Update: {
          content?: string | null
          created_at?: string
          external_url?: string | null
          id?: string
          image_url?: string | null
          published_at?: string
          source?: string
          source_type?: string
          summary?: string | null
          title?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_avatar: string | null
          actor_id: string | null
          actor_name: string | null
          actor_verified: boolean | null
          created_at: string
          id: string
          message: string
          read: boolean | null
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_avatar?: string | null
          actor_id?: string | null
          actor_name?: string | null
          actor_verified?: boolean | null
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_avatar?: string | null
          actor_id?: string | null
          actor_name?: string | null
          actor_verified?: boolean | null
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          items: Json
          payment_type: string
          status: string
          total_amount: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          items?: Json
          payment_type: string
          status?: string
          total_amount: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          items?: Json
          payment_type?: string
          status?: string
          total_amount?: number
          user_id?: string
        }
        Relationships: []
      }
      post_interactions: {
        Row: {
          content: string | null
          created_at: string
          id: string
          interaction_type: string
          post_id: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          interaction_type: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          interaction_type?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_interactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          comments_count: number
          content: string
          created_at: string
          httn_earned: number
          id: string
          likes_count: number
          media_type: string | null
          media_url: string | null
          shares_count: number
        }
        Insert: {
          author_id: string
          comments_count?: number
          content: string
          created_at?: string
          httn_earned?: number
          id?: string
          likes_count?: number
          media_type?: string | null
          media_url?: string | null
          shares_count?: number
        }
        Update: {
          author_id?: string
          comments_count?: number
          content?: string
          created_at?: string
          httn_earned?: number
          id?: string
          likes_count?: number
          media_type?: string | null
          media_url?: string | null
          shares_count?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string | null
          avatar_url: string | null
          bio: string | null
          business_category: string | null
          created_at: string
          display_name: string | null
          followers_count: number | null
          following_count: number | null
          id: string
          is_creator: boolean | null
          is_verified: boolean | null
          organization_name: string | null
          reputation: number | null
          tier: string | null
          total_engagement: number | null
          updated_at: string
          user_id: string
          username: string | null
          verification_points_threshold: number | null
        }
        Insert: {
          account_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          business_category?: string | null
          created_at?: string
          display_name?: string | null
          followers_count?: number | null
          following_count?: number | null
          id?: string
          is_creator?: boolean | null
          is_verified?: boolean | null
          organization_name?: string | null
          reputation?: number | null
          tier?: string | null
          total_engagement?: number | null
          updated_at?: string
          user_id: string
          username?: string | null
          verification_points_threshold?: number | null
        }
        Update: {
          account_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          business_category?: string | null
          created_at?: string
          display_name?: string | null
          followers_count?: number | null
          following_count?: number | null
          id?: string
          is_creator?: boolean | null
          is_verified?: boolean | null
          organization_name?: string | null
          reputation?: number | null
          tier?: string | null
          total_engagement?: number | null
          updated_at?: string
          user_id?: string
          username?: string | null
          verification_points_threshold?: number | null
        }
        Relationships: []
      }
      scheduled_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          media_type: string | null
          media_url: string | null
          scheduled_for: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          scheduled_for: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          scheduled_for?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stream_donations: {
        Row: {
          amount: number
          created_at: string
          donor_id: string
          id: string
          message: string | null
          stream_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          donor_id: string
          id?: string
          message?: string | null
          stream_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          donor_id?: string
          id?: string
          message?: string | null
          stream_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_donations_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      user_analytics: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_interests: {
        Row: {
          created_at: string
          id: string
          interests: string[] | null
          onboarding_completed: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interests?: string[] | null
          onboarding_completed?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interests?: string[] | null
          onboarding_completed?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      user_settings: {
        Row: {
          created_at: string
          dark_mode: boolean | null
          email_notifications: boolean | null
          id: string
          language: string | null
          notifications_enabled: boolean | null
          privacy_level: string | null
          push_notifications: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dark_mode?: boolean | null
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          notifications_enabled?: boolean | null
          privacy_level?: string | null
          push_notifications?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dark_mode?: boolean | null
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          notifications_enabled?: boolean | null
          privacy_level?: string | null
          push_notifications?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_tasks: {
        Row: {
          completed: boolean
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          progress: number
          reward: number
          target: number
          task_type: string
          title: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          progress?: number
          reward?: number
          target?: number
          task_type: string
          title: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          progress?: number
          reward?: number
          target?: number
          task_type?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          token_type: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          token_type?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          token_type?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          created_at: string
          espees: number
          httn_points: number
          httn_tokens: number
          id: string
          pending_rewards: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          espees?: number
          httn_points?: number
          httn_tokens?: number
          id?: string
          pending_rewards?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          espees?: number
          httn_points?: number
          httn_tokens?: number
          id?: string
          pending_rewards?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      app_role: "admin" | "moderator" | "creator" | "participant"
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
      app_role: ["admin", "moderator", "creator", "participant"],
    },
  },
} as const
