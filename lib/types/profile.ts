export type UserType = "tenant" | "landlord" | "admin";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  phone?: string | null;
  role: UserType;
  city?: string | null;
  address?: string | null;
  contact_method?: "email" | "phone" | "chat" | null;
  dob?: string | null; // ISO yyyy-mm-dd
  avatar_url?: string | null;
  prefs?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
};
