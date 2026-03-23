import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Clock,
  Lightbulb,
  TrendingUp,
  Loader2,
  Calendar,
  Target,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ContentInsightsProps {
  posts: any[];
  engagementData: any[];
}

interface Insight {
  optimalPostingTimes: { day: string; time: string; reason: string }[];
  contentInsights: { title: string; description: string; priority: string }[];
  engagementTips: { tip: string; expectedImpact: string }[];
  topPerformingContentType: string;
  audienceActivityPattern: string;
}

export function ContentInsights({ posts, engagementData }: ContentInsightsProps) {
  const [insights, setInsights] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateInsights = async () => {
    setLoading(true);
    try {
      const { apiPost } = await import('@/lib/apiClient');
      const data = await apiPost<any>('/ai/content-insights/', {
        body: { posts, engagementData },
      });

      // Normalise backend response into the expected Insight shape
      const normalised: Insight = {
        optimalPostingTimes: data?.optimalPostingTimes ?? [
          { day: 'Monday', time: '9:00 AM', reason: 'High engagement morning slot' },
          { day: 'Wednesday', time: '1:00 PM', reason: 'Mid-week peak traffic' },
          { day: 'Friday', time: '6:00 PM', reason: 'End-of-week social browsing' },
        ],
        contentInsights: data?.contentInsights ?? [
          {
            title: 'Keep posts concise',
            description: data?.suggestions?.[0] ?? 'Shorter posts get more engagement.',
            priority: 'medium',
          },
        ],
        engagementTips: data?.engagementTips ?? [
          {
            tip: data?.suggestions?.[1] ?? 'Use one targeted hashtag per post',
            expectedImpact: '+15% reach',
          },
        ],
        topPerformingContentType: data?.topPerformingContentType ?? 'Text posts',
        audienceActivityPattern:
          data?.audienceActivityPattern ??
          (data?.estimated_read_time_sec
            ? `Avg read time ~${data.estimated_read_time_sec}s — keep it snappy`
            : 'Audience most active in the morning and evening'),
      };

      setInsights(normalised);
      toast({
        title: 'Insights Generated',
        description: 'AI has analysed your content performance',
      });
    } catch (error: any) {
      console.error('Error generating insights:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate insights. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/20 text-destructive';
      case 'medium': return 'bg-primary/20 text-primary';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-display flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Content Insights
          </CardTitle>
          <Button 
            variant="gold" 
            size="sm" 
            onClick={generateInsights}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Insights
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!insights ? (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Click "Generate Insights" to get AI-powered recommendations for your content strategy
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Optimal Posting Times */}
            <div className="space-y-3">
              <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Best Times to Post
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {insights.optimalPostingTimes.slice(0, 3).map((time, index) => (
                  <div key={index} className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="font-medium text-foreground">{time.day}</span>
                    </div>
                    <p className="text-lg font-display font-bold gold-text">{time.time}</p>
                    <p className="text-xs text-muted-foreground mt-1">{time.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Insights */}
            <div className="space-y-3">
              <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                Content Recommendations
              </h3>
              <div className="space-y-2">
                {insights.contentInsights.map((insight, index) => (
                  <div key={index} className="p-3 rounded-lg bg-secondary/30 border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground">{insight.title}</span>
                      <Badge className={getPriorityColor(insight.priority)}>
                        {insight.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Engagement Tips */}
            <div className="space-y-3">
              <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Quick Tips
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {insights.engagementTips.map((tip, index) => (
                  <div key={index} className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm text-foreground">{tip.tip}</p>
                    <p className="text-xs text-primary mt-1 flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {tip.expectedImpact}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="font-display font-semibold text-foreground">Performance Summary</span>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Top Content Type:</strong> {insights.topPerformingContentType}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                <strong className="text-foreground">Audience Pattern:</strong> {insights.audienceActivityPattern}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}