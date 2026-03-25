import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiDelete } from '@/lib/apiClient';

interface FollowButtonProps {
  targetUserId: string;
  targetProfileId?: string;
  onFollowChange?: (isFollowing: boolean) => void;
  onCountsChange?: (counts: { followers_count?: number; following_count?: number }) => void;
  variant?: 'default' | 'outline';
  size?: 'sm' | 'default';
}

export function FollowButton({
  targetUserId,
  targetProfileId,
  onFollowChange,
  onCountsChange,
  variant = 'outline',
  size = 'sm',
}: FollowButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const followTargetId = targetProfileId || targetUserId;
  const isOwnProfile = !!user && user.id === targetUserId;

  useEffect(() => {
    if (user && followTargetId) {
      checkFollowStatus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, followTargetId]);

  const checkFollowStatus = async () => {
    if (!user) return;
    try {
      const data = await apiGet<{ is_following: boolean; followers_count?: number; following_count?: number }>(
        `/follows/status/${followTargetId}/`
      );
      setIsFollowing(data?.is_following ?? false);
      onCountsChange?.({ followers_count: data?.followers_count, following_count: data?.following_count });
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

    if (isOwnProfile) return;

    setIsLoading(true);
    try {
      if (isFollowing) {
        const data = await apiDelete<{ followers_count?: number; following_count?: number }>(`/users/${followTargetId}/follow/`);
        setIsFollowing(false);
        onFollowChange?.(false);
        onCountsChange?.(data ?? {});
        toast({ title: 'Unfollowed', description: 'You unfollowed this user' });
      } else {
        const data = await apiPost<{ followers_count?: number; following_count?: number }>(`/users/${followTargetId}/follow/`, {});
        setIsFollowing(true);
        onFollowChange?.(true);
        onCountsChange?.(data ?? {});
        toast({ title: 'Following!', description: 'You are now following this user' });
      }
    } catch (err: any) {
      if (err?.status === 409) {
        setIsFollowing(true);
        onFollowChange?.(true);
        onCountsChange?.(err?.details ?? {});
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

  if (!user || isOwnProfile) return null;

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
