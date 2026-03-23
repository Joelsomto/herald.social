import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { getActiveAds, clickAd } from '@/lib/api/ads';
import type { Ad } from '@/lib/api/ads';

interface RightSidebarWithAdsProps {
  children?: React.ReactNode;
}

export function RightSidebarWithAds({ children }: RightSidebarWithAdsProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  useEffect(() => {
    getActiveAds(6)
      .then(setAds)
      .catch(() => setAds([]));
  }, []);

  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % ads.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [ads.length]);

  const handleAdClick = async (ad: Ad) => {
    try {
      await clickAd(ad.id);
    } catch {
      // ignore click tracking errors
    }
    if (ad.target_url) {
      window.open(ad.target_url, '_blank', 'noopener,noreferrer');
    }
  };

  const currentAd = ads[currentAdIndex];

  return (
    <div className="space-y-4">
      {children}

      {currentAd && (
        <div className="relative">
          <Card className="bg-card border-border overflow-hidden">
            {currentAd.image_url && (
              <div className="aspect-[4/3] overflow-hidden bg-secondary">
                <img
                  src={currentAd.image_url}
                  alt={currentAd.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardContent className="p-3 space-y-2">
              {currentAd.sponsor_name && (
                <p className="text-xs text-muted-foreground">Sponsored · {currentAd.sponsor_name}</p>
              )}
              <p className="font-semibold text-sm text-foreground">{currentAd.title}</p>
              {currentAd.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{currentAd.description}</p>
              )}
              {currentAd.reward_points > 0 && (
                <p className="text-xs text-primary font-medium">
                  +{currentAd.reward_points} HTTN for viewing
                </p>
              )}
              <Button
                size="sm"
                className="w-full"
                onClick={() => handleAdClick(currentAd)}
              >
                {currentAd.cta_text || 'Learn More'}
                {currentAd.target_url && <ExternalLink className="w-3 h-3 ml-1" />}
              </Button>
            </CardContent>
          </Card>

          {ads.length > 1 && (
            <div className="flex justify-center gap-1 mt-2">
              {ads.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentAdIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentAdIndex ? 'bg-primary' : 'bg-secondary'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
