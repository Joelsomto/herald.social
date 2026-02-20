import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type EventType = 
  | 'page_view'
  | 'post_view'
  | 'post_like'
  | 'post_share'
  | 'post_comment'
  | 'post_create'
  | 'profile_view'
  | 'follow'
  | 'unfollow'
  | 'wallet_view'
  | 'task_complete'
  | 'reward_claim'
  | 'ad_impression'
  | 'ad_click'
  | 'search'
  | 'session_start'
  | 'session_end';

interface EventData {
  [key: string]: string | number | boolean | null | undefined;
}

export function useAnalytics() {
  const { user } = useAuth();

  const getSessionId = useCallback(() => {
    let sessionId = sessionStorage.getItem('herald_session_id');
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('herald_session_id', sessionId);
    }
    return sessionId;
  }, []);

  const trackEvent = useCallback(async (
    eventType: EventType,
    eventData: EventData = {}
  ) => {
    if (!user) return;

    try {
      await supabase.from('user_analytics').insert({
        user_id: user.id,
        event_type: eventType,
        event_data: {
          ...eventData,
          url: window.location.pathname,
          referrer: document.referrer,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        },
        session_id: getSessionId(),
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }, [user, getSessionId]);

  const trackPageView = useCallback((pageName: string, additionalData?: EventData) => {
    trackEvent('page_view', { page: pageName, ...additionalData });
  }, [trackEvent]);

  const trackPostEngagement = useCallback((
    action: 'view' | 'like' | 'share' | 'comment' | 'create',
    postId: string,
    additionalData?: EventData
  ) => {
    const eventMap: Record<string, EventType> = {
      view: 'post_view',
      like: 'post_like',
      share: 'post_share',
      comment: 'post_comment',
      create: 'post_create',
    };
    trackEvent(eventMap[action], { post_id: postId, ...additionalData });
  }, [trackEvent]);

  const trackProfileView = useCallback((profileUserId: string) => {
    trackEvent('profile_view', { profile_user_id: profileUserId });
  }, [trackEvent]);

  const trackFollow = useCallback((targetUserId: string, isFollow: boolean) => {
    trackEvent(isFollow ? 'follow' : 'unfollow', { target_user_id: targetUserId });
  }, [trackEvent]);

  const trackTaskComplete = useCallback((taskId: string, reward: number) => {
    trackEvent('task_complete', { task_id: taskId, reward });
  }, [trackEvent]);

  const trackAdInteraction = useCallback((
    action: 'impression' | 'click',
    campaignId: string,
    additionalData?: EventData
  ) => {
    trackEvent(action === 'impression' ? 'ad_impression' : 'ad_click', {
      campaign_id: campaignId,
      ...additionalData,
    });
  }, [trackEvent]);

  const trackSearch = useCallback((query: string, resultsCount: number) => {
    trackEvent('search', { query, results_count: resultsCount });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackPostEngagement,
    trackProfileView,
    trackFollow,
    trackTaskComplete,
    trackAdInteraction,
    trackSearch,
  };
}
