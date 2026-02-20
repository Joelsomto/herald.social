import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/herald/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Heart,
  Search,
  Sparkles,
  Globe,
  Users,
  Target,
  Gift,
  TrendingUp,
  Church,
  BookOpen,
  Stethoscope,
  GraduationCap,
  HandHeart
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { VerticalAdBanner, verticalAds } from '@/components/herald/VerticalAdBanner';
import { WalletPreview } from '@/components/herald/WalletPreview';
import { walletBalance } from '@/data/mockData';

interface Cause {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string | null;
  goal_amount: number;
  raised_amount: number;
  status: string;
  created_by: string;
}

const categoryIcons: Record<string, React.ElementType> = {
  general: HandHeart,
  healing_school: Stethoscope,
  education: GraduationCap,
  church_building: Church,
  outreach: Globe,
  scripture: BookOpen,
};

const categoryLabels: Record<string, string> = {
  general: 'General',
  healing_school: 'Healing School',
  education: 'Education',
  church_building: 'Church Building',
  outreach: 'Outreach',
  scripture: 'Scripture Distribution',
};

const demoCauses: Cause[] = [
  {
    id: '1',
    title: 'Healing School Campus Expansion',
    description: 'Support the expansion of the Healing School campus to accommodate more students from around the world seeking healing and training.',
    category: 'healing_school',
    image_url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400',
    goal_amount: 500000,
    raised_amount: 342500,
    status: 'active',
    created_by: '',
  },
  {
    id: '2',
    title: 'Rhapsody for Africa Initiative',
    description: 'Distribute 10 million copies of Rhapsody of Realities across African nations to reach more souls with the gospel.',
    category: 'scripture',
    image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
    goal_amount: 250000,
    raised_amount: 189000,
    status: 'active',
    created_by: '',
  },
  {
    id: '3',
    title: 'Build 100 Churches Campaign',
    description: 'Help establish 100 new churches in underserved communities to spread the message of hope and salvation.',
    category: 'church_building',
    image_url: 'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=400',
    goal_amount: 1000000,
    raised_amount: 456000,
    status: 'active',
    created_by: '',
  },
  {
    id: '4',
    title: 'Youth Education Scholarship Fund',
    description: 'Provide scholarships for young believers to pursue higher education and become leaders in their fields.',
    category: 'education',
    image_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400',
    goal_amount: 150000,
    raised_amount: 98000,
    status: 'active',
    created_by: '',
  },
  {
    id: '5',
    title: 'Global Outreach Mission 2026',
    description: 'Support missionaries in reaching unreached regions with the gospel message through various outreach programs.',
    category: 'outreach',
    image_url: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=400',
    goal_amount: 300000,
    raised_amount: 275000,
    status: 'active',
    created_by: '',
  },
];

export default function Causes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [causes, setCauses] = useState<Cause[]>(demoCauses);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [donateDialogOpen, setDonateDialogOpen] = useState(false);
  const [selectedCause, setSelectedCause] = useState<Cause | null>(null);
  const [donationAmount, setDonationAmount] = useState('');
  const [donationMessage, setDonationMessage] = useState('');

  useEffect(() => {
    fetchCauses();
  }, []);

  const fetchCauses = async () => {
    const { data } = await supabase
      .from('causes')
      .select('*')
      .eq('status', 'active')
      .order('raised_amount', { ascending: false });
    
    if (data && data.length > 0) {
      setCauses(data);
    }
  };

  const handleDonate = async () => {
    if (!user || !selectedCause) {
      toast({ title: 'Please sign in', description: 'You need to be signed in to donate.' });
      return;
    }

    const amount = parseInt(donationAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Invalid amount', description: 'Please enter a valid donation amount.' });
      return;
    }

    const { error } = await supabase
      .from('cause_donations')
      .insert({
        cause_id: selectedCause.id,
        donor_id: user.id,
        amount,
        message: donationMessage || null,
      });

    if (error) {
      toast({ title: 'Error', description: 'Failed to process donation.' });
    } else {
      toast({ 
        title: 'Thank you!', 
        description: `Your donation of ${amount} HTTN to "${selectedCause.title}" has been recorded.` 
      });
      setDonateDialogOpen(false);
      setDonationAmount('');
      setDonationMessage('');
      setSelectedCause(null);
      fetchCauses();
    }
  };

  const openDonateDialog = (cause: Cause) => {
    setSelectedCause(cause);
    setDonateDialogOpen(true);
  };

  const filteredCauses = causes.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalRaised = causes.reduce((sum, c) => sum + c.raised_amount, 0);
  const totalDonors = 12450; // Demo value

  const rightSidebar = (
    <>
      <WalletPreview balance={walletBalance} />
      
      {/* Impact Stats */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Community Impact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Raised</span>
            <span className="font-display font-bold gold-text">
              {totalRaised.toLocaleString()} HTTN
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Active Causes</span>
            <span className="font-semibold text-foreground">{causes.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Donors</span>
            <span className="font-semibold text-foreground">{totalDonors.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      <VerticalAdBanner {...verticalAds[1]} />
    </>
  );

  const CauseCard = ({ cause }: { cause: Cause }) => {
    const Icon = categoryIcons[cause.category] || HandHeart;
    const progress = (cause.raised_amount / cause.goal_amount) * 100;

    return (
      <Card className="bg-card border-border overflow-hidden hover:border-primary/30 transition-colors">
        {cause.image_url && (
          <div className="relative aspect-video bg-secondary">
            <img
              src={cause.image_url}
              alt={cause.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
            <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
              {categoryLabels[cause.category]}
            </Badge>
          </div>
        )}
        <CardContent className="p-4 space-y-4">
          <div>
            <h3 className="font-display font-semibold text-lg text-foreground">
              {cause.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {cause.description}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="gold-text font-semibold">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm">
              <span className="text-foreground font-medium">
                <Sparkles className="w-3 h-3 inline mr-1 text-primary" />
                {cause.raised_amount.toLocaleString()} HTTN
              </span>
              <span className="text-muted-foreground">
                of {cause.goal_amount.toLocaleString()} goal
              </span>
            </div>
          </div>

          <Button 
            variant="gold" 
            className="w-full gap-2"
            onClick={() => openDonateDialog(cause)}
          >
            <Heart className="w-4 h-4" />
            Sponsor This Cause
          </Button>
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
                <HandHeart className="w-5 h-5 text-primary" />
                Herald Causes
              </h1>
              <p className="text-sm text-muted-foreground">Sponsor HSCH Projects</p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Hero Banner */}
        <Card className="bg-gradient-to-r from-primary/20 via-primary/10 to-herald-violet/20 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Gift className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="font-display font-bold text-lg text-foreground">Make a Difference Today</h2>
                <p className="text-sm text-muted-foreground">
                  Your HTTN donations support life-changing projects around the world.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search causes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>

        {/* Category Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">All</TabsTrigger>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid md:grid-cols-2 gap-4">
              {filteredCauses.map((cause) => (
                <CauseCard key={cause.id} cause={cause} />
              ))}
            </div>
          </TabsContent>

          {Object.keys(categoryLabels).map((category) => (
            <TabsContent key={category} value={category} className="mt-6">
              <div className="grid md:grid-cols-2 gap-4">
                {filteredCauses
                  .filter(c => c.category === category)
                  .map((cause) => (
                    <CauseCard key={cause.id} cause={cause} />
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Donate Dialog */}
      <Dialog open={donateDialogOpen} onOpenChange={setDonateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Sponsor This Cause</DialogTitle>
            <DialogDescription>
              {selectedCause?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Donation Amount (HTTN)</Label>
              <Input
                type="number"
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                placeholder="Enter amount"
              />
              <div className="flex gap-2">
                {[100, 500, 1000, 5000].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setDonationAmount(amount.toString())}
                  >
                    {amount}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Message (Optional)</Label>
              <Textarea
                value={donationMessage}
                onChange={(e) => setDonationMessage(e.target.value)}
                placeholder="Add an encouraging message..."
              />
            </div>
            <Button variant="gold" className="w-full gap-2" onClick={handleDonate}>
              <Heart className="w-4 h-4" />
              Donate {donationAmount || '0'} HTTN
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
