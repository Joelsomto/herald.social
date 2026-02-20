import { Sparkles, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AdCardProps {
  title: string;
  description: string;
  sponsor: string;
  imageUrl?: string;
  ctaText?: string;
}

export function AdCard({ title, description, sponsor, imageUrl, ctaText = 'Learn More' }: AdCardProps) {
  return (
    <article className="herald-card p-4 space-y-3 animate-fade-in border-l-2 border-primary/50">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs text-muted-foreground">
          Sponsored
        </Badge>
        <span className="text-xs text-muted-foreground">{sponsor}</span>
      </div>
      
      {imageUrl && (
        <div className="relative aspect-video rounded-lg overflow-hidden bg-secondary">
          <img 
            src={imageUrl} 
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div>
        <h3 className="font-display font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-primary">
          <Sparkles className="w-3 h-3" />
          <span>Earn 5 HTTN for engaging</span>
        </div>
        <Button variant="outline" size="sm" className="gap-1">
          {ctaText}
          <ExternalLink className="w-3 h-3" />
        </Button>
      </div>
    </article>
  );
}

export const dummyAds = [
  {
    title: 'Unlock Premium Features',
    description: 'Get 2x HTTN rewards and exclusive creator tools with Herald Pro.',
    sponsor: 'Herald Pro',
    imageUrl: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400',
    ctaText: 'Upgrade Now',
  },
  {
    title: 'Web3 Creator Course',
    description: 'Learn to monetize your content in the decentralized economy.',
    sponsor: 'CreatorDAO',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400',
    ctaText: 'Enroll Free',
  },
  {
    title: 'NFT Collection Drop',
    description: 'Exclusive Herald member badges available for top creators.',
    sponsor: 'Herald NFTs',
    imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400',
    ctaText: 'View Collection',
  },
];
