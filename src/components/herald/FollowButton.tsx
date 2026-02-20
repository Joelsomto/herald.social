import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface FollowButtonProps {
  targetUserId: string;
  onFollowChange?: (isFollowing: boolean) => void;
  variant?: 'default' | 'outline';
  size?: 'sm' | 'default';
}

export function FollowButton({ targetUserId, onFollowChange, variant = 'outline', size = 'sm' }: FollowButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && targetUserId) {
      checkFollowStatus();
    }
  }, [user, targetUserId]);

  const checkFollowStatus = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .maybeSingle();

    setIsFollowing(!!data);
  };

  const handleToggleFollow = async () => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to follow users', variant: 'destructive' });
      return;
    }

    if (user.id === targetUserId) return;

    setIsLoading(true);

    if (isFollowing) {
      // Unfollow
      const { error } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

      if (!error) {
        // Decrement counts
        await Promise.all([
          supabase.from('profiles').update({ 
            following_count: Math.max(0, (await supabase.from('profiles').select('following_count').eq('user_id', user.id).single()).data?.following_count || 1 - 1)
          }).eq('user_id', user.id),
          supabase.from('profiles').update({
            followers_count: Math.max(0, (await supabase.from('profiles').select('followers_count').eq('user_id', targetUserId).single()).data?.followers_count || 1 - 1)
          }).eq('user_id', targetUserId),
        ]);
        
        setIsFollowing(false);
        onFollowChange?.(false);
        toast({ title: 'Unfollowed', description: 'You unfollowed this user' });
      }
    } else {
      // Follow
      const { error } = await supabase
        .from('followers')
        .insert({ follower_id: user.id, following_id: targetUserId });

      if (!error) {
        // Increment counts
        await Promise.all([
          supabase.from('profiles').update({ 
            following_count: ((await supabase.from('profiles').select('following_count').eq('user_id', user.id).single()).data?.following_count || 0) + 1
          }).eq('user_id', user.id),
          supabase.from('profiles').update({
            followers_count: ((await supabase.from('profiles').select('followers_count').eq('user_id', targetUserId).single()).data?.followers_count || 0) + 1
          }).eq('user_id', targetUserId),
        ]);

        setIsFollowing(true);
        onFollowChange?.(true);
        toast({ title: 'Following!', description: 'You are now following this user' });

        // Create notification
        await supabase.from('notifications').insert({
          user_id: targetUserId,
          type: 'follow',
          title: 'New Follower',
          message: 'Someone started following you!',
          actor_id: user.id,
        });
      }
    }

    setIsLoading(false);
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
      {isLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
    </Button>
  );
}