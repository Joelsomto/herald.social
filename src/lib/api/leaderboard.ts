import { apiGet } from '../apiClient';

export type LeaderboardEntry = {
  user_id: string;
  id?: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  tier: string;
  reputation: number;
  is_verified: boolean;
  total_engagement: number;
  httn_points?: number;
  rank: number;
};

function normaliseEntries(raw: unknown): LeaderboardEntry[] {
  if (Array.isArray(raw)) return raw as LeaderboardEntry[];
  const r = raw as any;
  return r.results ?? r.data ?? [];
}

export const getReputationLeaderboard = async (limit = 50): Promise<LeaderboardEntry[]> => {
  const raw = await apiGet<unknown>(`/leaderboard/reputation/?limit=${limit}`);
  return normaliseEntries(raw);
};

export const getEngagementLeaderboard = async (limit = 50): Promise<LeaderboardEntry[]> => {
  const raw = await apiGet<unknown>(`/leaderboard/engagement/?limit=${limit}`);
  return normaliseEntries(raw);
};

export const getPointsLeaderboard = async (limit = 50): Promise<LeaderboardEntry[]> => {
  const raw = await apiGet<unknown>(`/leaderboard/points/?limit=${limit}`);
  return normaliseEntries(raw);
};

export const getMyLeaderboardRank = async (): Promise<{ rank: number; reputation: number; percentile: number; total_users: number } | null> => {
  try {
    return await apiGet(`/leaderboard/me/`);
  } catch {
    return null;
  }
};
