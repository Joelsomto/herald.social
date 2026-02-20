import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/herald/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Megaphone,
  Plus,
  TrendingUp,
  Eye,
  MousePointer,
  Sparkles,
  Target,
  Calendar,
  Play,
  Pause,
  Trash2,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdCampaign {
  id: string;
  title: string;
  description: string | null;
  budget_points: number;
  spent_points: number;
  impressions: number;
  clicks: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

interface WalletData {
  httn_points: number;
}

export default function Ads() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    description: '',
    budget_points: 100,
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const [campaignsRes, walletRes] = await Promise.all([
      supabase
        .from('ad_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('wallets')
        .select('httn_points')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    if (campaignsRes.data) setCampaigns(campaignsRes.data);
    if (walletRes.data) setWallet(walletRes.data);
  };

  const handleCreateCampaign = async () => {
    if (!user || !wallet) return;

    if (newCampaign.budget_points > wallet.httn_points) {
      toast({
        title: 'Insufficient Points',
        description: 'You don\'t have enough HTTN points for this campaign',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase.from('ad_campaigns').insert({
      user_id: user.id,
      title: newCampaign.title,
      description: newCampaign.description,
      budget_points: newCampaign.budget_points,
      status: 'draft',
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create campaign',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Campaign Created',
        description: 'Your ad campaign has been created',
      });
      setDialogOpen(false);
      setNewCampaign({ title: '', description: '', budget_points: 100 });
      fetchData();
    }
  };

  const handleToggleStatus = async (campaignId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    const { error } = await supabase
      .from('ad_campaigns')
      .update({ status: newStatus })
      .eq('id', campaignId);

    if (!error) {
      fetchData();
      toast({
        title: `Campaign ${newStatus === 'active' ? 'Activated' : 'Paused'}`,
        description: `Your campaign is now ${newStatus}`,
      });
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    const { error } = await supabase
      .from('ad_campaigns')
      .delete()
      .eq('id', campaignId);

    if (!error) {
      fetchData();
      toast({
        title: 'Campaign Deleted',
        description: 'Your campaign has been deleted',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success text-success-foreground';
      case 'paused':
        return 'bg-secondary text-secondary-foreground';
      case 'completed':
        return 'bg-primary text-primary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const totalSpent = campaigns.reduce((acc, c) => acc + c.spent_points, 0);
  const totalImpressions = campaigns.reduce((acc, c) => acc + c.impressions, 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + c.clicks, 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0';

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-primary" />
              Ad Campaigns
            </h1>
            <p className="text-muted-foreground">Promote your content using HTTN Points</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold" className="gap-2">
                <Plus className="w-4 h-4" />
                New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">Create Ad Campaign</DialogTitle>
                <DialogDescription>
                  Use your HTTN Points to promote your content to the Herald community
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Campaign Title</Label>
                  <Input
                    value={newCampaign.title}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter campaign title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newCampaign.description}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your campaign"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center justify-between">
                    <span>Budget (HTTN Points)</span>
                    <span className="text-sm text-muted-foreground">
                      Available: {wallet?.httn_points.toLocaleString() || 0}
                    </span>
                  </Label>
                  <Input
                    type="number"
                    value={newCampaign.budget_points}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, budget_points: parseInt(e.target.value) || 0 }))}
                    min={100}
                    max={wallet?.httn_points || 0}
                  />
                  <p className="text-xs text-muted-foreground">Minimum 100 HTTN Points</p>
                </div>
                <Button
                  variant="gold"
                  className="w-full"
                  onClick={handleCreateCampaign}
                  disabled={!newCampaign.title || newCampaign.budget_points < 100}
                >
                  Create Campaign
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold gold-text">{totalSpent.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Points Spent</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Eye className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-foreground">{totalImpressions.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Impressions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <MousePointer className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-foreground">{totalClicks.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Clicks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-foreground">{avgCtr}%</p>
                  <p className="text-sm text-muted-foreground">Avg. CTR</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns List */}
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Campaigns</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4 space-y-4">
            {campaigns.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="py-12 text-center">
                  <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No campaigns yet</p>
                  <Button variant="gold" onClick={() => setDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Campaign
                  </Button>
                </CardContent>
              </Card>
            ) : (
              campaigns.map((campaign) => (
                <Card key={campaign.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-semibold text-lg text-foreground">
                            {campaign.title}
                          </h3>
                          <Badge className={getStatusColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {campaign.description || 'No description'}
                        </p>
                        
                        {/* Budget Progress */}
                        <div className="mt-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Budget Used</span>
                            <span className="text-foreground">
                              {campaign.spent_points} / {campaign.budget_points} HTTN
                            </span>
                          </div>
                          <Progress 
                            value={(campaign.spent_points / campaign.budget_points) * 100} 
                            className="h-2" 
                          />
                        </div>

                        {/* Stats */}
                        <div className="flex gap-6 mt-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Eye className="w-4 h-4" />
                            {campaign.impressions.toLocaleString()} impressions
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MousePointer className="w-4 h-4" />
                            {campaign.clicks} clicks
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <TrendingUp className="w-4 h-4" />
                            {campaign.impressions > 0 
                              ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2)
                              : '0'}% CTR
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {campaign.status !== 'completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(campaign.id, campaign.status)}
                          >
                            {campaign.status === 'active' ? (
                              <>
                                <Pause className="w-4 h-4 mr-1" /> Pause
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-1" /> Activate
                              </>
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCampaign(campaign.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="active" className="mt-4 space-y-4">
            {campaigns.filter(c => c.status === 'active').length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No active campaigns
                </CardContent>
              </Card>
            ) : (
              campaigns
                .filter(c => c.status === 'active')
                .map((campaign) => (
                  <Card key={campaign.id} className="bg-card border-border">
                    <CardContent className="p-4">
                      <h3 className="font-display font-semibold text-foreground">{campaign.title}</h3>
                      <p className="text-sm text-muted-foreground">{campaign.description}</p>
                    </CardContent>
                  </Card>
                ))
            )}
          </TabsContent>

          <TabsContent value="draft" className="mt-4 space-y-4">
            {campaigns.filter(c => c.status === 'draft').length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No draft campaigns
                </CardContent>
              </Card>
            ) : (
              campaigns
                .filter(c => c.status === 'draft')
                .map((campaign) => (
                  <Card key={campaign.id} className="bg-card border-border">
                    <CardContent className="p-4">
                      <h3 className="font-display font-semibold text-foreground">{campaign.title}</h3>
                      <p className="text-sm text-muted-foreground">{campaign.description}</p>
                    </CardContent>
                  </Card>
                ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
