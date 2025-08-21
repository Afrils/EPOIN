
export type Database = {
  public: {
    Tables: {
      students: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          photo_url: string | null;
          points: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          photo_url?: string | null;
          points?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          photo_url?: string | null;
          points?: number;
        };
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
      };
      profiles: {
        Row: {
          id: string;
          app_name: string;
          logo_url: string | null;
          favicon_url: string | null;
          role: 'admin' | 'teacher';
        };
        Insert: {
          id: string;
          app_name?: string;
          logo_url?: string | null;
          favicon_url?: string | null;
          role?: 'admin' | 'teacher';
        };
        Update: {
          id?: string;
          app_name?: string;
          logo_url?: string | null;
          favicon_url?: string | null;
          role?: 'admin' | 'teacher';
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};


export type PointTransaction = Database['public']['Tables']['point_transactions']['Row'];
export type Student = Database['public']['Tables']['students']['Row'];
export type Rule = Database['public']['Tables']['rules']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];

export type ModalType = 'add' | 'subtract' | 'history';
export type ViewType = 'students' | 'rules' | 'settings' | 'data';