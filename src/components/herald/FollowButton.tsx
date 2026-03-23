import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiDelete } from '@/lib/apiClient';

interface FollowButtonProps {
  targetUserId: string;
  onFollowChange?: (isFollowing: boolean) => void;
  variant?: 'default' | 'outline';
  size?: 'sm' | 'default';
}

export function FollowButton({
  targetUserId,
  onFollowChange,
  variant = 'outline',
  size = 'sm',
}: FollowButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && targetUserId) {
      checkFollowStatus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, targetUserId]);

  const checkFollowStatus = async () => {
    if (!user) return;
    try {
      const data = await apiGet<{ is_following: boolean }>(
        `/follow/check/?user_id=${targetUserId}`
      );
      setIsFollowing(data?.is_following ?? false);
    } catch {
      setIsFollowing(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to follow users',
        variant: 'destructive',
      });
      return;
    }

    if (user.id === targetUserId) return;

    setIsLoading(true);
    try {
      if (isFollowing) {
        await apiDelete(`/users/${targetUserId}/follow/`);
        setIsFollowing(false);
        onFollowChange?.(false);
        toast({ title: 'Unfollowed', description: 'You unfollowed this user' });
      } else {
        await apiPost(`/users/${targetUserId}/follow/`, {});
        setIsFollowing(true);
        onFollowChange?.(true);
        toast({ title: 'Following!', description: 'You are now following this user' });
      }
    } catch (err: any) {
      if (err?.status === 409) {
        setIsFollowing(true);
        onFollowChange?.(true);
      } else {
        toast({
          title: 'Error',
          description: 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.id === targetUserId) return null;

  return (
    <Button
      variant={isFollowing ? 'outline' : 'gold'}
      size={size}
      onClick={handleToggleFollow}
      disabled={isLoading}
      className="rounded-full font-semibold min-w-[80px]"
    >
      {isLoading ? '…' : isFollowing ? 'Following' : 'Follow'}
    </Button>
  );
}