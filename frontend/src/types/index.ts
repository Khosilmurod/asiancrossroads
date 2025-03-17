export interface Event {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date?: string;
  venue: string;
  registration_link?: string;
  cover_image?: string;
  category: 'SEMINAR' | 'SOCIAL' | 'WORKSHOP' | 'CONFERENCE' | 'CULTURAL' | 'OTHER';
  capacity?: number;
  current_registrations: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: {
    id: number;
    username: string;
  };
  is_full: boolean;
  spots_left?: number;
  has_ended: boolean;
} 