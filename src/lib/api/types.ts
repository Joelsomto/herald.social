export type ApiUser = {
  id: string;
  user_id?: string;
  username: string;
  display_name: string;
  full_name?: string | null;
  email: string;
  avatar_url?: string | null;
  bio?: string | null;
  tier?: 'free' | 'creator' | 'premium';
  reputation?: number;
  is_verified?: boolean;
  is_creator?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type AuthSession = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

export type AuthResponse = {
  user: ApiUser;
  session?: AuthSession;
  access_token?: string;
  token_type?: string;
  expires_in?: number;
};

export type Wallet = {
  id: string;
  user_id: string;
  httn_points: number;
  httn_tokens: number;
  espees: number;
  pending_rewards: number;
  created_at?: string;
  updated_at?: string;
};
