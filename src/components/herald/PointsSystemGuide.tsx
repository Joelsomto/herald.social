import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Sparkles, Wallet } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  balanceDefinitions,
  rewardSurfaces,
  starterRewardRules,
  trustAndSafetyRules,
} from '@/lib/pointsSystem';

export function PointsSystemGuide() {
  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            How Herald Rewards Work
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {balanceDefinitions.map((balance) => (
            <div key={balance.key} className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display font-semibold text-foreground">{balance.name}</h3>
                <Badge variant="outline" className="text-xs">
                  {balance.badge}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{balance.summary}</p>
              <p className="text-xs text-muted-foreground">{balance.usage}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Starter Reward Table
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {starterRewardRules.map((rule) => (
            <div
              key={rule.id}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-secondary/20 p-4 md:flex-row md:items-start md:justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {rule.surface}
                  </Badge>
                  <p className="font-medium text-foreground">{rule.action}</p>
                </div>
                <p className="text-sm text-muted-foreground">{rule.note}</p>
              </div>
              <div className="font-display font-semibold gold-text whitespace-nowrap">{rule.reward}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-primary" />
            Earning Surfaces Across Herald
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rewardSurfaces.map((surface) => (
            <Link
              key={surface.id}
              to={surface.path}
              className="rounded-2xl border border-border bg-secondary/20 p-4 transition-colors hover:border-primary/40 hover:bg-secondary/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display font-semibold text-foreground">{surface.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{surface.summary}</p>
                </div>
                <Badge variant="outline" className="text-xs whitespace-nowrap">
                  {surface.rewardRange}
                </Badge>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {surface.actions.map((action) => (
                  <li key={`${surface.id}-${action}`}>• {action}</li>
                ))}
              </ul>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Trust, Pending Rewards, and Abuse Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {trustAndSafetyRules.map((rule) => (
            <div key={rule} className="rounded-2xl border border-border bg-secondary/20 p-4 text-sm text-muted-foreground">
              {rule}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
