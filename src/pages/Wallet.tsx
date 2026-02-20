import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/herald/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet as WalletIcon, 
  ArrowUpRight, 
  ArrowDownLeft,
  Sparkles,
  RefreshCw,
  Send,
  History,
  TrendingUp,
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { VerticalAdBanner, verticalAds } from '@/components/herald/VerticalAdBanner';

interface WalletData {
  httn_points: number;
  httn_tokens: number;
  espees: number;
  pending_rewards: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  token_type: string;
  description: string | null;
  created_at: string;
}

const CONVERSION_RATE = 1000; // 1000 points = 1 token
const MIN_CONVERSION = 100;

export default function Wallet() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [convertAmount, setConvertAmount] = useState('');
  const [sendUsername, setSendUsername] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [converting, setConverting] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWallet();
      fetchTransactions();
    }
  }, [user]);

  const fetchWallet = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) setWallet(data);
  };

  const fetchTransactions = async () => {
    if (!user) return;
    setLoadingTransactions(true);
    const { data } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setTransactions(data);
    setLoadingTransactions(false);
  };

  const handleConvertPoints = async () => {
    if (!wallet || !user) return;
    const amount = parseInt(convertAmount);
    if (isNaN(amount) || amount < MIN_CONVERSION || amount > wallet.httn_points) {
      toast({
        title: 'Invalid Amount',
        description: `Please enter a valid amount between ${MIN_CONVERSION} and ${wallet.httn_points.toLocaleString()} points`,
        variant: 'destructive',
      });
      return;
    }

    setConverting(true);
    try {
      const tokensToAdd = amount / CONVERSION_RATE;
      const newPoints = wallet.httn_points - amount;
      const newTokens = Number(wallet.httn_tokens) + tokensToAdd;

      // Update wallet
      const { error: walletError } = await supabase
        .from('wallets')
        .update({
          httn_points: newPoints,
          httn_tokens: newTokens,
        })
        .eq('user_id', user.id);

      if (walletError) throw walletError;

      // Record transaction - points deducted
      await supabase.from('wallet_transactions').insert({
        user_id: user.id,
        type: 'convert_out',
        amount: -amount,
        token_type: 'points',
        description: `Converted to ${tokensToAdd.toFixed(3)} HTTN Tokens`,
      });

      // Record transaction - tokens added
      await supabase.from('wallet_transactions').insert({
        user_id: user.id,
        type: 'convert_in',
        amount: tokensToAdd,
        token_type: 'tokens',
        description: `Converted from ${amount.toLocaleString()} HTTN Points`,
      });

      toast({
        title: 'Conversion Successful',
        description: `Converted ${amount.toLocaleString()} Points to ${tokensToAdd.toFixed(3)} Tokens`,
      });

      setConvertAmount('');
      fetchWallet();
      fetchTransactions();
    } catch (error: any) {
      console.error('Conversion error:', error);
      toast({
        title: 'Conversion Failed',
        description: error.message || 'An error occurred during conversion',
        variant: 'destructive',
      });
    } finally {
      setConverting(false);
    }
  };

  const handleSendHTTN = async () => {
    if (!wallet || !user || !sendUsername || !sendAmount) return;

    const amount = parseInt(sendAmount);
    if (isNaN(amount) || amount <= 0 || amount > wallet.httn_points) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      // Find recipient by username
      const username = sendUsername.replace('@', '');
      const { data: recipientProfile, error: findError } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .eq('username', username)
        .maybeSingle();

      if (findError || !recipientProfile) {
        throw new Error('User not found');
      }

      if (recipientProfile.user_id === user.id) {
        throw new Error("You can't send HTTN to yourself");
      }

      // Get recipient's wallet
      const { data: recipientWallet } = await supabase
        .from('wallets')
        .select('httn_points')
        .eq('user_id', recipientProfile.user_id)
        .maybeSingle();

      if (!recipientWallet) {
        throw new Error('Recipient wallet not found');
      }

      // Deduct from sender
      await supabase
        .from('wallets')
        .update({ httn_points: wallet.httn_points - amount })
        .eq('user_id', user.id);

      // Add to recipient
      await supabase
        .from('wallets')
        .update({ httn_points: recipientWallet.httn_points + amount })
        .eq('user_id', recipientProfile.user_id);

      // Record sender transaction
      await supabase.from('wallet_transactions').insert({
        user_id: user.id,
        type: 'send',
        amount: -amount,
        token_type: 'points',
        description: `Sent to @${username}`,
      });

      // Create notification for recipient
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, is_verified')
        .eq('user_id', user.id)
        .maybeSingle();

      await supabase.from('notifications').insert({
        user_id: recipientProfile.user_id,
        type: 'tip',
        title: 'HTTN Received!',
        message: `sent you ${amount} HTTN Points!`,
        actor_id: user.id,
        actor_name: senderProfile?.display_name || 'Someone',
        actor_avatar: senderProfile?.avatar_url,
        actor_verified: senderProfile?.is_verified || false,
      });

      toast({
        title: 'HTTN Sent!',
        description: `Successfully sent ${amount} HTTN to @${username}`,
      });

      setSendUsername('');
      setSendAmount('');
      fetchWallet();
      fetchTransactions();
    } catch (error: any) {
      console.error('Send error:', error);
      toast({
        title: 'Transfer Failed',
        description: error.message || 'An error occurred during transfer',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'send':
        return <ArrowUpRight className="w-5 h-5 text-destructive" />;
      case 'receive':
        return <ArrowDownLeft className="w-5 h-5 text-success" />;
      case 'convert_out':
        return <RefreshCw className="w-5 h-5 text-primary" />;
      case 'convert_in':
        return <RefreshCw className="w-5 h-5 text-success" />;
      case 'earned':
        return <Sparkles className="w-5 h-5 text-primary" />;
      default:
        return <History className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const tokensPreview = convertAmount && parseInt(convertAmount) >= MIN_CONVERSION
    ? (parseInt(convertAmount) / CONVERSION_RATE).toFixed(3)
    : '0.000';

  const rightSidebar = (
    <div className="space-y-4">
      <VerticalAdBanner {...verticalAds[1]} />
    </div>
  );

  return (
    <MainLayout rightSidebar={rightSidebar}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Wallet</h1>
          <p className="text-muted-foreground">Manage your HTTN Points, Tokens, and Espees</p>
        </div>

        {/* Balance Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <Badge variant="outline" className="text-xs">Off-chain</Badge>
              </div>
              <p className="text-3xl font-display font-bold gold-text">
                {wallet?.httn_points.toLocaleString() || '0'}
              </p>
              <p className="text-sm text-muted-foreground">HTTN Points</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                  <WalletIcon className="w-6 h-6 text-primary" />
                </div>
                <Badge variant="outline" className="text-xs">On-chain</Badge>
              </div>
              <p className="text-3xl font-display font-bold text-foreground">
                {Number(wallet?.httn_tokens || 0).toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">HTTN Tokens</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
                <Badge variant="outline" className="text-xs">Redeemable</Badge>
              </div>
              <p className="text-3xl font-display font-bold text-foreground">
                ₦{Number(wallet?.espees || 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Espees</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Rewards */}
        {wallet && wallet.pending_rewards > 0 && (
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-display font-semibold text-foreground">
                    {wallet.pending_rewards} HTTN Points Pending
                  </p>
                  <p className="text-sm text-muted-foreground">Complete tasks to claim</p>
                </div>
              </div>
              <Button variant="gold" size="sm">
                View Tasks
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="convert" className="w-full">
          <TabsList>
            <TabsTrigger value="convert" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Convert
            </TabsTrigger>
            <TabsTrigger value="send" className="gap-2">
              <Send className="w-4 h-4" />
              Send
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="convert" className="mt-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-primary" />
                  Convert Points to Tokens
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-sm text-muted-foreground mb-2">Conversion Rate</p>
                  <p className="font-display font-semibold text-foreground">
                    {CONVERSION_RATE.toLocaleString()} HTTN Points = 1 HTTN Token
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Amount to Convert</label>
                  <Input
                    type="number"
                    placeholder="Enter points amount"
                    value={convertAmount}
                    onChange={(e) => setConvertAmount(e.target.value)}
                    className="bg-input"
                    min={MIN_CONVERSION}
                    max={wallet?.httn_points || 0}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum: {MIN_CONVERSION} points | Available: {wallet?.httn_points.toLocaleString() || 0} points
                  </p>
                </div>

                {convertAmount && parseInt(convertAmount) >= MIN_CONVERSION && (
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <p className="text-sm text-muted-foreground">You will receive</p>
                    </div>
                    <p className="font-display font-bold text-xl gold-text">
                      {tokensPreview} HTTN Tokens
                    </p>
                  </div>
                )}

                {convertAmount && parseInt(convertAmount) > (wallet?.httn_points || 0) && (
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-destructive" />
                      <p className="text-sm text-destructive">Insufficient points</p>
                    </div>
                  </div>
                )}

                <Button 
                  variant="gold" 
                  className="w-full"
                  onClick={handleConvertPoints}
                  disabled={
                    converting || 
                    !convertAmount || 
                    parseInt(convertAmount) < MIN_CONVERSION ||
                    parseInt(convertAmount) > (wallet?.httn_points || 0)
                  }
                >
                  {converting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    'Convert Points'
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="send" className="mt-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary" />
                  Send HTTN
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Recipient Username</label>
                  <Input
                    placeholder="@username"
                    value={sendUsername}
                    onChange={(e) => setSendUsername(e.target.value)}
                    className="bg-input"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Amount (HTTN Points)</label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    className="bg-input"
                    min={1}
                    max={wallet?.httn_points || 0}
                  />
                  <p className="text-xs text-muted-foreground">
                    Available: {wallet?.httn_points.toLocaleString() || 0} points
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-secondary/50 border border-border flex items-center gap-3">
                  <Shield className="w-5 h-5 text-success" />
                  <p className="text-sm text-muted-foreground">
                    Transactions are secured and verified on-chain
                  </p>
                </div>

                <Button 
                  variant="gold" 
                  className="w-full"
                  onClick={handleSendHTTN}
                  disabled={
                    sending || 
                    !sendUsername || 
                    !sendAmount ||
                    parseInt(sendAmount) <= 0 ||
                    parseInt(sendAmount) > (wallet?.httn_points || 0)
                  }
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send HTTN'
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  Transaction History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingTransactions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div 
                        key={tx.id} 
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            tx.amount > 0 ? 'bg-success/20' : 
                            tx.type === 'convert_out' ? 'bg-primary/20' : 'bg-destructive/20'
                          }`}>
                            {getTransactionIcon(tx.type)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{tx.description}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
                              <Badge variant="outline" className="text-xs">
                                {tx.token_type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <span className={`font-display font-semibold ${
                          tx.amount > 0 ? 'text-success' : 'text-foreground'
                        }`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} {tx.token_type === 'tokens' ? 'HTTN' : 'pts'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}