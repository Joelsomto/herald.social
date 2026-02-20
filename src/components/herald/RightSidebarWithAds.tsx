import { useState, useEffect } from 'react';
import { VerticalAdBanner, verticalAds } from './VerticalAdBanner';

interface RightSidebarWithAdsProps {
  children?: React.ReactNode;
}

export function RightSidebarWithAds({ children }: RightSidebarWithAdsProps) {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % verticalAds.length);
    }, 15000); // Rotate ads every 15 seconds

    return () => clearInterval(interval);
  }, []);

  const currentAd = verticalAds[currentAdIndex];

  return (
    <div className="space-y-4">
      {children}
      
      {/* Rotating Ad Banner */}
      <div className="relative">
        <VerticalAdBanner
          key={currentAdIndex}
          {...currentAd}
        />
        
        {/* Ad rotation indicator */}
        <div className="flex justify-center gap-1 mt-2">
          {verticalAds.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentAdIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentAdIndex ? 'bg-primary' : 'bg-secondary'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
