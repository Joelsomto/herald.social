export const POINTS_TO_TOKEN_RATE = 1000;
export const MIN_POINTS_CONVERSION = 100;

export type HeraldBalanceKey = 'httn_points' | 'httn_tokens' | 'espees';

export type BalanceDefinition = {
  key: HeraldBalanceKey;
  name: string;
  badge: string;
  summary: string;
  usage: string;
};

export type RewardSurface = {
  id: string;
  title: string;
  path: string;
  summary: string;
  rewardRange: string;
  actions: string[];
};

export type RewardRule = {
  id: string;
  surface: string;
  action: string;
  reward: string;
  note: string;
};

export const balanceDefinitions: BalanceDefinition[] = [
  {
    key: 'httn_points',
    name: 'HTTN Points',
    badge: 'Earned',
    summary: 'Your core participation balance. Points are earned for healthy contribution across Herald.',
    usage: 'Used for leaderboards, creator milestones, verification progress, ad budgets, and conversion into HTTN Tokens.',
  },
  {
    key: 'httn_tokens',
    name: 'HTTN Tokens',
    badge: 'Spendable',
    summary: 'Your transferable utility balance for support, premium actions, and wallet-to-wallet movement.',
    usage: 'Best used for transfers, creator support, premium features, and future paid network actions.',
  },
  {
    key: 'espees',
    name: 'Espees',
    badge: 'Commerce',
    summary: 'Your commerce balance for store and cause flows rather than general engagement rewards.',
    usage: 'Used for checkouts, cause support, promotions, and campaign-driven commerce actions.',
  },
];

export const rewardSurfaces: RewardSurface[] = [
  {
    id: 'feed',
    title: 'Feed',
    path: '/feed',
    summary: 'Reward quality posts, thoughtful replies, reposts, saves, and real engagement from other users.',
    rewardRange: '1-15 pts',
    actions: ['First quality post of the day', 'Meaningful replies', 'Bookmarks and reposts earned', 'Posts that attract conversation'],
  },
  {
    id: 'profile',
    title: 'Profile',
    path: '/profile',
    summary: 'Reward profile completion, creator trust, streak consistency, and verification readiness.',
    rewardRange: '10-40 pts',
    actions: ['Complete avatar, banner, bio, location, website', 'Maintain healthy creator streaks', 'Hit trust and verification milestones'],
  },
  {
    id: 'communities',
    title: 'Communities',
    path: '/communities',
    summary: 'Reward joining, contributing, moderating, and building healthy community activity.',
    rewardRange: '3-20 pts',
    actions: ['Join a community', 'Create useful community posts', 'Participate in community events', 'Moderate quality discussions'],
  },
  {
    id: 'live',
    title: 'Live',
    path: '/live',
    summary: 'Reward attendance, hosting, audience retention, and support received during streams.',
    rewardRange: '5-25 pts',
    actions: ['Attend a live session', 'Host a live stream', 'Finish meaningful live sessions', 'Earn support and live engagement'],
  },
  {
    id: 'news',
    title: 'News',
    path: '/news',
    summary: 'Reward valuable article sharing and meaningful discussion, not passive reading.',
    rewardRange: '2-12 pts',
    actions: ['Share articles people engage with', 'Add useful article discussion', 'Earn saves and reposts on news commentary'],
  },
  {
    id: 'causes',
    title: 'Causes',
    path: '/causes',
    summary: 'Reward real cause participation, donations, and verified referral impact.',
    rewardRange: '5-20 pts',
    actions: ['Donate to a cause', 'Bring verified supporters', 'Drive real cause participation'],
  },
  {
    id: 'store',
    title: 'Store',
    path: '/store',
    summary: 'Reward verified purchases and high-quality commerce activity, not browsing.',
    rewardRange: '5-15 pts',
    actions: ['Complete verified purchases', 'Leave useful post-purchase reviews', 'Participate in trusted campaigns'],
  },
];

export const starterRewardRules: RewardRule[] = [
  {
    id: 'profile-complete',
    surface: 'Profile',
    action: 'Complete your profile',
    reward: '+40 pts once',
    note: 'Requires avatar, banner, bio, location, and website or equivalent setup.',
  },
  {
    id: 'first-post',
    surface: 'Feed',
    action: 'Publish your first quality post of the day',
    reward: '+15 pts',
    note: 'Daily-capped and only for posts that pass quality checks.',
  },
  {
    id: 'reply',
    surface: 'Feed',
    action: 'Write a meaningful reply',
    reward: '+6 pts',
    note: 'Low-effort or duplicate replies should not qualify.',
  },
  {
    id: 'bookmark-earned',
    surface: 'Feed',
    action: 'Your post is bookmarked by another user',
    reward: '+3 pts',
    note: 'Higher weight than a like because it signals stronger value.',
  },
  {
    id: 'repost-earned',
    surface: 'Feed',
    action: 'Your post is reposted by another user',
    reward: '+4 pts',
    note: 'Use unique-user caps to prevent farming.',
  },
  {
    id: 'community-join',
    surface: 'Communities',
    action: 'Join a community',
    reward: '+5 pts',
    note: 'One-time per community with anti-spam checks.',
  },
  {
    id: 'live-attend',
    surface: 'Live',
    action: 'Attend a live session',
    reward: '+5 pts',
    note: 'Should require a minimum watch time to count.',
  },
  {
    id: 'live-host',
    surface: 'Live',
    action: 'Host a live stream',
    reward: '+25 pts',
    note: 'Should settle only after a minimum stream duration and trust checks.',
  },
  {
    id: 'cause-donation',
    surface: 'Causes',
    action: 'Donate to a cause',
    reward: '+20 pts',
    note: 'Higher-value reward because it reflects real contribution.',
  },
  {
    id: 'store-purchase',
    surface: 'Store',
    action: 'Complete a verified store purchase',
    reward: '+10 pts',
    note: 'Reward only after payment clears and refund window risk is low.',
  },
];

export const trustAndSafetyRules: string[] = [
  'Rewards should settle into pending rewards first, then move into available points after trust checks or settlement windows.',
  'Only count unique-user interactions. Repeat likes, saves, or repost loops from the same account should not stack freely.',
  'No self-rewarding actions. Users should never earn points from self-likes, self-reposts, or linked low-trust account farms.',
  'Cap each reward source daily so volume alone cannot outrun quality.',
  'Reduce or delay rewards for very new, low-trust, or suspicious accounts until they build healthy usage history.',
  'Reward browsing lightly or not at all. Herald should reward contribution, support, trust, and retained attention.',
];
