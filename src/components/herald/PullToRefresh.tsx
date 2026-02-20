import { useState, useRef, useEffect, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
}

export function PullToRefresh({ onRefresh, children, className = '' }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const pullDistance = useMotionValue(0);
  const rotation = useTransform(pullDistance, [0, 80], [0, 360]);
  const opacity = useTransform(pullDistance, [0, 40, 80], [0, 0.5, 1]);

  const THRESHOLD = 80;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isRefreshing) return;
      if (container.scrollTop !== 0) return;

      currentY.current = e.touches[0].clientY;
      const diff = currentY.current - startY.current;

      if (diff > 0) {
        e.preventDefault();
        const dampedDiff = Math.min(diff * 0.5, 120);
        pullDistance.set(dampedDiff);
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance.get() >= THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        await onRefresh();
        setIsRefreshing(false);
      }
      animate(pullDistance, 0, { duration: 0.3 });
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isRefreshing, onRefresh, pullDistance]);

  return (
    <div ref={containerRef} className={`relative overflow-auto ${className}`}>
      {/* Pull indicator */}
      <motion.div 
        className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none z-10"
        style={{ 
          top: useTransform(pullDistance, v => Math.max(v - 40, 0)),
          opacity 
        }}
      >
        <motion.div
          className={`w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center ${
            isRefreshing ? 'animate-spin' : ''
          }`}
          style={{ rotate: isRefreshing ? undefined : rotation }}
        >
          <RefreshCw className="w-5 h-5 text-primary" />
        </motion.div>
      </motion.div>

      {/* Content with pull offset */}
      <motion.div style={{ y: useTransform(pullDistance, v => Math.min(v, 80)) }}>
        {children}
      </motion.div>
    </div>
  );
}
