import { Sparkles, ExternalLink, Star, Zap, Gift } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface VerticalAdProps {
  title: string;
  description: string;
  sponsor: string;
  imageUrl?: string;
  ctaText?: string;
  reward?: number;
  featured?: boolean;
}

export function VerticalAdBanner({ 
  title, 
  description, 
  sponsor, 
  imageUrl, 
  ctaText = 'Learn More',
  reward = 5,
  featured = false
}: VerticalAdProps) {
  return (
    <article className={`herald-card overflow-hidden animate-fade-in ${featured ? 'border-primary/50 border-2' : ''}`}>
      {featured && (
        <div className="bg-primary/10 px-3 py-1.5 flex items-center gap-2">
          <Star className="w-3 h-3 text-primary fill-primary" />
          <span className="text-xs font-medium text-primary">Featured</span>
        </div>
      )}
      
      {imageUrl && (
        <div className="relative aspect-[4/5] bg-secondary">
          <img 
            src={imageUrl} 
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur-sm">
              Sponsored
            </Badge>
          </div>
        </div>
      )}
      
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Zap className="w-3 h-3 text-primary" />
          <span>{sponsor}</span>
        </div>
        
        <div>
          <h3 className="font-display font-bold text-foreground text-lg leading-tight">{title}</h3>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{description}</p>
        </div>
        
        <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-primary/10 border border-primary/20">
          <Gift className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium gold-text">Earn {reward} HTTN for engaging</span>
        </div>
        
        <Button variant="gold" className="w-full gap-2">
          {ctaText}
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>
    </article>
  );
}

export const verticalAds = [
  {
    title: 'Herald Pro Membership',
    description: 'Unlock 2x HTTN rewards, exclusive creator tools, priority support, and early access to new features.',
    sponsor: 'Herald Pro',
    imageUrl: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=500&fit=crop',
    ctaText: 'Upgrade Now',
    reward: 10,
    featured: true,
  },
  {
    title: 'Web3 Creator Masterclass',
    description: 'Learn to monetize your content in the decentralized economy. Join 10,000+ creators.',
    sponsor: 'CreatorDAO Academy',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=500&fit=crop',
    ctaText: 'Enroll Free',
    reward: 15,
    featured: false,
  },
  {
    title: 'Exclusive NFT Badges',
    description: 'Claim your limited edition Herald member badge. Only for top creators.',
    sponsor: 'Herald NFTs',
    imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=500&fit=crop',
    ctaText: 'View Collection',
    reward: 20,
    featured: false,
  },
  {
    title: 'Decentralized Social',
    description: 'The future of social media is here. Own your content, earn from your creativity.',
    sponsor: 'Herald Social',
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=500&fit=crop',
    ctaText: 'Learn More',
    reward: 5,
    featured: false,
  },
];