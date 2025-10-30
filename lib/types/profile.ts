export type UserType = "tenant" | "landlord" | "both";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  user_type: UserType;
  city?: string | null;
  address?: string | null;
  contact_method?: "email" | "phone" | "chat" | null;
  dob?: string | null; // ISO yyyy-mm-dd
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
};
