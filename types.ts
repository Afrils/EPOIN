
export type Database = {
  public: {
    Tables: {
      students: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          photo_url: string;
          points: number;
          user_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          photo_url?: string;
          points?: number;
          user_id: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          photo_url?: string;
          points?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      rules: {
        Row: {
          id: string;
          created_at: string;
          description: string;
          points: number;
          type: 'achievement' | 'violation';
          user_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          description: string;
          points: number;
          type: 'achievement' | 'violation';
          user_id: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          description?: string;
          points?: number;
          type?: 'achievement' | 'violation';
          user_id?: string;
        };
        Relationships: [];
      };
      point_transactions: {
        Row: {
          id: string;
          created_at: string;
          student_id: string;
          points: number;
          reason: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          student_id: string;
          points: number;
          reason: string;
          user_id: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          student_id?: string;
          points?: number;
          reason?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          app_name: string;
          logo_url: string;
          favicon_url: string;
        };
        Insert: {
          id: string;
          app_name?: string;
          logo_url?: string;
          favicon_url?: string;
        };
        Update: {
          id?: string;
          app_name?: string;
          logo_url?: string;
          favicon_url?: string;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};


export type PointTransaction = Database['public']['Tables']['point_transactions']['Row'];
export type Student = Database['public']['Tables']['students']['Row'];
export type Rule = Database['public']['Tables']['rules']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];

export type ModalType = 'add' | 'subtract' | 'history';
export type ViewType = 'students' | 'rules' | 'settings' | 'data';