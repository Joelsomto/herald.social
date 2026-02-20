export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  tier: 'herald' | 'creator' | 'participant' | 'partner';
  httnPoints: number;
  httnTokens: number;
  espees: number;
  reputation: number;
  badges: Badge[];
  joinedAt: Date;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Post {
  id: string;
  author: User;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
  likes: number;
  comments: number;
  shares: number;
  httnEarned: number;
  createdAt: Date;
  isLiked: boolean;
  isShared: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  type: 'daily' | 'weekly' | 'campaign';
  progress: number;
  target: number;
  completed: boolean;
  expiresAt?: Date;
}

export interface WalletBalance {
  httnPoints: number;
  httnTokens: number;
  espees: number;
  pendingRewards: number;
}
