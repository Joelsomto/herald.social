import { Coins, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import { WalletBalance } from '@/types/herald';

interface WalletPreviewProps {
  balance: WalletBalance;
}

export function WalletPreview({ balance }: WalletPreviewProps) {
  return (
    <div className="herald-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-foreground">Your Wallet</h3>
        <button className="text-xs text-primary hover:underline flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-3">
        {/* HTTN Points */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary glow-gold-sm" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">HTTN Points</p>
              <p className="font-display font-semibold text-foreground">
                {balance.httnPoints.toLocaleString()}
              </p>
            </div>
          </div>
          {balance.pendingRewards > 0 && (
            <span className="text-xs text-primary animate-pulse">
              +{balance.pendingRewards} pending
            </span>
          )}
        </div>

        {/* HTTN Token */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-herald-ember/20 flex items-center justify-center">
              <Coins className="w-4 h-4 text-herald-ember" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">HTTN Token</p>
              <p className="font-display font-semibold text-foreground">
                {balance.httnTokens.toFixed(2)}
              </p>
            </div>
          </div>
          <TrendingUp className="w-4 h-4 text-success" />
        </div>

        {/* Espees */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center gold-glow">
              <span className="text-primary font-bold text-sm">E</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Espees Value</p>
              <p className="font-display font-semibold gold-text">
                {balance.espees.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conversion hint */}
      <p className="text-xs text-center text-muted-foreground">
        1000 HTTN Points = 1 Espees
      </p>
    </div>
  );
}
