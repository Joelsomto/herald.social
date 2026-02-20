import { User } from '@/types/herald';
import { Crown, Shield, Sparkles, Star } from 'lucide-react';

interface CreatorProfileCardProps {
  user: User;
  compact?: boolean;
}

const tierConfig = {
  herald: {
    label: 'Herald',
    icon: Crown,
    color: 'text-primary',
    bg: 'bg-primary/20',
  },
  partner: {
    label: 'Partner',
    icon: Shield,
    color: 'text-herald-violet',
    bg: 'bg-herald-violet/20',
  },
  creator: {
    label: 'Creator',
    icon: Sparkles,
    color: 'text-herald-ember',
    bg: 'bg-herald-ember/20',
  },
  participant: {
    label: 'Participant',
    icon: Star,
    color: 'text-muted-foreground',
    bg: 'bg-muted',
  },
};

export function CreatorProfileCard({ user, compact = false }: CreatorProfileCardProps) {
  const tier = tierConfig[user.tier];
  const TierIcon = tier.icon;

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg font-display font-bold text-foreground">
            {user.displayName[0]}
          </div>
          {user.tier === 'herald' && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
              <Crown className="w-2.5 h-2.5 text-primary-foreground" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-medium text-foreground truncate">{user.displayName}</p>
            {user.badges.slice(0, 1).map((badge) => (
              <span key={badge.id} title={badge.name}>
                {badge.icon}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">@{user.username}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="herald-card p-5 space-y-4">
      <div className="flex items-start gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-2xl font-display font-bold text-foreground">
            {user.displayName[0]}
          </div>
          <div
            className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${tier.bg} flex items-center justify-center`}
          >
            <TierIcon className={`w-3.5 h-3.5 ${tier.color}`} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold text-lg text-foreground truncate">
              {user.displayName}
            </h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${tier.bg} ${tier.color}`}
            >
              {tier.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">@{user.username}</p>

          <div className="flex items-center gap-2 mt-2">
            {user.badges.map((badge) => (
              <span
                key={badge.id}
                title={badge.name}
                className={`text-sm px-2 py-0.5 rounded-full ${
                  badge.rarity === 'legendary'
                    ? 'bg-primary/20'
                    : badge.rarity === 'epic'
                    ? 'bg-herald-violet/20'
                    : badge.rarity === 'rare'
                    ? 'bg-blue-500/20'
                    : 'bg-muted'
                }`}
              >
                {badge.icon} {badge.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
        <div className="text-center">
          <p className="font-display font-semibold text-foreground">
            {user.httnTokens.toFixed(1)}
          </p>
          <p className="text-xs text-muted-foreground">HTTN Tokens</p>
        </div>
        <div className="text-center">
          <p className="font-display font-semibold gold-text">{user.reputation}</p>
          <p className="text-xs text-muted-foreground">Reputation</p>
        </div>
        <div className="text-center">
          <p className="font-display font-semibold text-foreground">
            {user.httnPoints.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">Points</p>
        </div>
      </div>
    </div>
  );
}
