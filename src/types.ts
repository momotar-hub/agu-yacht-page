export interface Profile {
  user_id: string;
  name: string;
  avatar: string;
  role: "Captain" | "Vice Captain" | "Member" | "Admin";
  role_display: string;
  grade?: string;
  sailing_days?: number;
  badges?: string[];
  is_admin?: boolean;
}

export interface User {
  id: string;
  email: string;
  profile: Profile;
}

export interface WeatherInfo {
  windSpeed: number; // m/s
  windDirection: string;
  waveHeight: number; // meters
  condition: string;
  temp: number; // °C
}

export interface Reflection {
  id: string;
  date: string;
  author_id: string;
  author_name: string;
  author_avatar: string;
  text: string;
  photos: string[];
  weather: WeatherInfo;
  participating_members: string[]; // User IDs
  created_at: string;
  badgeAwarded?: string;
  comments_count?: number;
}

export interface Comment {
  id: string;
  reflection_id: string;
  author_id: string;
  author_name: string;
  author_avatar: string;
  text: string;
  parent_id: string | null;
  created_at: string;
  badgeAwarded?: string;
}

export interface MaintenanceRecord {
  id: string;
  date_found: string;
  reporter_id: string;
  reporter_name: string;
  boat: string;
  location: string;
  cost: number;
  photos: string[];
  notes: string;
  status: "Pending" | "In Progress" | "Completed";
  created_at: string;
}

export interface PurchaseRecord {
  id: string;
  name: string;
  cost: number;
  category: string;
  buyer_id: string;
  buyer_name: string;
  date: string;
  created_at: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: "practice_reminder" | "comment" | "reply";
  message: string;
  linked_reflection_id?: string;
  is_read: boolean;
  created_at: string;
}
