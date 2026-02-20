import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/herald/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  Search,
  Plus,
  MessageSquare,
  Heart,
  Star,
  Lock,
  Globe,
  TrendingUp,
  Sparkles,
  Church,
  BookOpen,
  Music,
  Lightbulb,
  HandHeart
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { VerticalAdBanner, verticalAds } from '@/components/herald/VerticalAdBanner';
import { WalletPreview } from '@/components/herald/WalletPreview';
import { walletBalance } from '@/data/mockData';

interface Community {
  id: string;
  name: string;
  description: string | null;
  category: string;
  image_url: string | null;
  member_count: number;
  is_private: boolean;
  created_by: string;
}

const categoryIcons: Record<string, React.ElementType> = {
  general: Users,
  faith: Church,
  worship: Music,
  bible_study: BookOpen,
  inspiration: Lightbulb,
  outreach: HandHeart,
};

const categoryLabels: Record<string, string> = {
  general: 'General',
  faith: 'Faith & Prayer',
  worship: 'Worship & Praise',
  bible_study: 'Bible Study',
  inspiration: 'Inspiration',
  outreach: 'Outreach & Ministry',
};

const demoCommunities: Community[] = [
  { id: '1', name: 'Herald Creators Hub', description: 'Connect with fellow content creators and share strategies for building your audience.', category: 'general', image_url: null, member_count: 2450, is_private: false, created_by: '' },
  { id: '2', name: 'Prayer Warriors', description: 'A dedicated community for prayer requests and intercession.', category: 'faith', image_url: null, member_count: 1890, is_private: false, created_by: '' },
  { id: '3', name: 'Rhapsody of Realities Study', description: 'Daily study and discussion of Rhapsody of Realities devotional.', category: 'bible_study', image_url: null, member_count: 3200, is_private: false, created_by: '' },
  { id: '4', name: 'Worship Leaders Network', description: 'For worship leaders and musicians to share resources and collaborate.', category: 'worship', image_url: null, member_count: 980, is_private: false, created_by: '' },
  { id: '5', name: 'Healing School Testimonies', description: 'Share and celebrate healing testimonies from around the world.', category: 'faith', image_url: null, member_count: 4500, is_private: false, created_by: '' },
  { id: '6', name: 'Youth Ministry Leaders', description: 'Resources and discussions for youth ministry leaders.', category: 'outreach', image_url: null, member_count: 1250, is_private: false, created_by: '' },
  { id: '7', name: 'Daily Inspiration', description: 'Start your day with uplifting messages and encouragement.', category: 'inspiration', image_url: null, member_count: 5670, is_private: false, created_by: '' },
  { id: '8', name: 'Partner Churches', description: 'Private community for partner church leaders.', category: 'general', image_url: null, member_count: 340, is_private: true, created_by: '' },
];

export default function Communities() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [communities, setCommunities] = useState<Community[]>(demoCommunities);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [joinedCommunities, setJoinedCommunities] = useState<string[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCommunity, setNewCommunity] = useState({
    name: '',
    description: '',
    category: 'general',
    is_private: false,
  });

  useEffect(() => {
    fetchCommunities();
    if (user) fetchJoinedCommunities();
  }, [user]);

  const fetchCommunities = async () => {
    const { data } = await supabase
      .from('communities')
      .select('*')
      .order('member_count', { ascending: false });
    
    if (data && data.length > 0) {
      setCommunities(data);
    }
  };

  const fetchJoinedCommunities = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', user.id);
    
    if (data) {
      setJoinedCommunities(data.map(m => m.community_id));
    }
  };

  const handleJoinCommunity = async (communityId: string) => {
    if (!user) {
      toast({ title: 'Please sign in', description: 'You need to be signed in to join communities.' });
      return;
    }

    if (joinedCommunities.includes(communityId)) {
      // Leave community
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', user.id);

      if (!error) {
        setJoinedCommunities(prev => prev.filter(id => id !== communityId));
        toast({ title: 'Left community', description: 'You have left this community.' });
      }
    } else {
      // Join community
      const { error } = await supabase
        .from('community_members')
        .insert({ community_id: communityId, user_id: user.id });

      if (!error) {
        setJoinedCommunities(prev => [...prev, communityId]);
        toast({ title: 'Joined!', description: 'Welcome to the community!' });
      }
    }
  };

  const handleCreateCommunity = async () => {
    if (!user) return;
    if (!newCommunity.name.trim()) {
      toast({ title: 'Error', description: 'Please enter a community name.' });
      return;
    }

    const { data, error } = await supabase
      .from('communities')
      .insert({
        name: newCommunity.name,
        description: newCommunity.description,
        category: newCommunity.category,
        is_private: newCommunity.is_private,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: 'Failed to create community.' });
    } else if (data) {
      setCommunities(prev => [data, ...prev]);
      setCreateDialogOpen(false);
      setNewCommunity({ name: '', description: '', category: 'general', is_private: false });
      toast({ title: 'Success!', description: 'Community created successfully.' });
    }
  };

  const filteredCommunities = communities.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const rightSidebar = (
    <>
      <WalletPreview balance={walletBalance} />
      <VerticalAdBanner {...verticalAds[0]} />
    </>
  );

  const CommunityCard = ({ community }: { community: Community }) => {
    const Icon = categoryIcons[community.category] || Users;
    const isJoined = joinedCommunities.includes(community.id);

    return (
      <Card className="bg-card border-border hover:border-primary/30 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-semibold text-foreground truncate">
                  {community.name}
                </h3>
                {community.is_private && <Lock className="w-3 h-3 text-muted-foreground" />}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {community.description}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="outline" className="text-xs">
                  {categoryLabels[community.category]}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {community.member_count.toLocaleString()}
                </span>
              </div>
            </div>
            <Button
              variant={isJoined ? 'outline' : 'gold'}
              size="sm"
              onClick={() => handleJoinCommunity(community.id)}
            >
              {isJoined ? 'Joined' : 'Join'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <MainLayout rightSidebar={rightSidebar}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Herald Communities
              </h1>
              <p className="text-sm text-muted-foreground">Discussion & Inspiration Groups</p>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gold" size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display">Create Community</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Community Name</Label>
                    <Input
                      value={newCommunity.name}
                      onChange={(e) => setNewCommunity(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter community name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={newCommunity.description}
                      onChange={(e) => setNewCommunity(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="What is this community about?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={newCommunity.category}
                      onValueChange={(v) => setNewCommunity(prev => ({ ...prev, category: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="gold" className="w-full" onClick={handleCreateCommunity}>
                    Create Community
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Search & Filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="discover" className="w-full">
          <TabsList>
            <TabsTrigger value="discover" className="gap-2">
              <Globe className="w-4 h-4" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="joined" className="gap-2">
              <Star className="w-4 h-4" />
              Joined
            </TabsTrigger>
            <TabsTrigger value="trending" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Trending
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="mt-6 space-y-4">
            {filteredCommunities.map((community) => (
              <CommunityCard key={community.id} community={community} />
            ))}
          </TabsContent>

          <TabsContent value="joined" className="mt-6 space-y-4">
            {filteredCommunities
              .filter(c => joinedCommunities.includes(c.id))
              .map((community) => (
                <CommunityCard key={community.id} community={community} />
              ))}
            {joinedCommunities.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>You haven't joined any communities yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="trending" className="mt-6 space-y-4">
            {filteredCommunities
              .sort((a, b) => b.member_count - a.member_count)
              .slice(0, 5)
              .map((community, index) => (
                <div key={community.id} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-display font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <CommunityCard community={community} />
                  </div>
                </div>
              ))}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
