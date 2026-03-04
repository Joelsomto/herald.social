import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
// Supabase removed
import { MessagesPopup } from './MessagesPopup';

export function FloatingMessageButton() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // TODO: Integrate unread message count and real-time updates with new backend
    setUnreadCount(0);
  }, [user]);

  // TODO: Implement subscribeToMessages and fetchUnreadCount with new backend

  const handleOpen = () => {
    setIsOpen(true);
    setUnreadCount(0);
  };

  return (
    <>
      <Button
        variant="gold"
        size="icon"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-elevated gold-glow"
        onClick={handleOpen}
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      <MessagesPopup isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
