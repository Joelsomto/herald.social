import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  History,
  Info,
  Loader2,
  RefreshCw,
  Send,
  Shield,
  Sparkles,
  TrendingUp,
  Wallet as WalletIcon,
} from 'lucide-react';

import { MainLayout } from '@/components/herald/MainLayout';
import { PointsSystemGuide } from '@/components/herald/PointsSystemGuide';
import { VerticalAdBanner, verticalAds } from '@/components/herald/VerticalAdBanner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import {
  getCurrentUserWallet,
  getWalletTransactions,
  normalizeWalletTransactions,
  transferWallet,
  convertPointsToTokens,
} from '@/lib/api/wallets';
import { searchUsers } from '@/lib/api/users';
import { ApiError } from '@/lib/apiClient';
import {
  balanceDefinitions,
  MIN_POINTS_CONVERSION,
  POINTS_TO_TOKEN_RATE,
} from '@/lib/pointsSystem';
import { useToast } from '@/hooks/use-toast';

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
  token_type?: string;
  currency?: string;
  description: string | null;
  created_at: string;
}

type SendCurrency = 'httn_points' | 'httn_tokens' | 'espees';

const sendCurrencyMeta: Record<
  SendCurrency,
  {
    label: string;
    unit: string;
    buttonLabel: string;
    balanceKey: keyof WalletData;
  }
> = {
  httn_points: {
    label: 'HTTN Points',
    unit: 'points',
    buttonLabel: 'Send Points',
    balanceKey: 'httn_points',
  },
  httn_tokens: {
    label: 'HTTN Tokens',
    unit: 'HTTN',
    buttonLabel: 'Send Tokens',
    balanceKey: 'httn_tokens',
  },
  espees: {
    label: 'Espees',
    unit: 'ESP',
    buttonLabel: 'Send Espees',
    balanceKey: 'espees',
  },
};

export default function Wallet() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [convertAmount, setConvertAmount] = useState('');
  const [sendUsername, setSendUsername] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendCurrency, setSendCurrency] = useState<SendCurrency>('httn_points');
  const [converting, setConverting] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  useEffect(() => {
    if (!user) return;
    void fetchWallet();
    void fetchTransactions();
  }, [user]);

  const fetchWallet = async () => {
    if (!user) return;

    try {
      const data = await getCurrentUserWallet();
      if (data) {
        setWallet({
          httn_points: data.httn_points,
          httn_tokens: Number(data.httn_tokens),
          espees: Number(data.espees),
          pending_rewards: data.pending_rewards,
        });
      }
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
    }
  };

  const fetchTransactions = async () => {
    if (!user) return;

    setLoadingTransactions(true);
    try {
      const data = await getWalletTransactions();
      setTransactions(normalizeWalletTransactions(data) as Transaction[]);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleConvertPoints = async () => {
    if (!wallet || !user) return;

    const amount = parseInt(convertAmount, 10);
    if (Number.isNaN(amount) || amount < MIN_POINTS_CONVERSION || amount > wallet.httn_points) {
      toast({
        title: 'Invalid Amount',
        description: `Please enter a valid amount between ${MIN_POINTS_CONVERSION} and ${wallet.httn_points.toLocaleString()} points`,
        variant: 'destructive',
      });
      return;
    }

    setConverting(true);
    try {
      const result = await convertPointsToTokens({ amount });
      if (result.success) {
        toast({
          title: 'Conversion complete',
          description: `Converted ${amount.toLocaleString()} points into HTTN Tokens.`,
        });
        setConvertAmount('');
        await fetchWallet();
        await fetchTransactions();
      }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'An error occurred during conversion';
      toast({
        title: 'Conversion Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setConverting(false);
    }
  };

  const handleSendHTTN = async () => {
    if (!wallet || !user || !sendUsername || !sendAmount) return;

    const amount = sendCurrency === 'httn_points' ? parseInt(sendAmount, 10) : parseFloat(sendAmount);
    const availableBalance = Number(wallet[sendCurrencyMeta[sendCurrency].balanceKey] || 0);

    if (Number.isNaN(amount) || amount <= 0 || amount > availableBalance) {
      toast({
        title: 'Invalid Amount',
        description: `Please enter a valid amount up to ${availableBalance.toLocaleString()} ${sendCurrencyMeta[sendCurrency].unit}`,
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      const usernameClean = sendUsername.replace(/^@/, '').trim();
      const searchResults = await searchUsers({ q: usernameClean, limit: 5 });
      const recipient = searchResults.find(
        (candidate: any) => candidate.username?.toLowerCase() === usernameClean.toLowerCase()
      );

      if (!recipient) {
        toast({
          title: 'User Not Found',
          description: `No user found with username @${usernameClean}`,
          variant: 'destructive',
        });
        return;
      }

      const result = await transferWallet({
        recipient_id: recipient.id,
        amount,
        currency: sendCurrency,
      });

      if (result.success) {
        toast({
          title: 'Transfer complete',
          description: `Transferred ${amount.toLocaleString()} ${sendCurrencyMeta[sendCurrency].label} to @${usernameClean}`,
        });
        setSendUsername('');
        setSendAmount('');
        await fetchWallet();
        await fetchTransactions();
      }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'An error occurred during transfer';
      toast({
        title: 'Transfer Failed',
        description: message,
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
      case 'convert_in':
        return <RefreshCw className="w-5 h-5 text-primary" />;
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

  const tokensPreview =
    convertAmount && parseInt(convertAmount, 10) >= MIN_POINTS_CONVERSION
      ? (parseInt(convertAmount, 10) / POINTS_TO_TOKEN_RATE).toFixed(3)
      : '0.000';

  const balancesByKey = useMemo(
    () => ({
      httn_points: wallet?.httn_points || 0,
      httn_tokens: Number(wallet?.httn_tokens || 0),
      espees: Number(wallet?.espees || 0),
    }),
    [wallet]
  );
  const selectedSendMeta = sendCurrencyMeta[sendCurrency];
  const selectedSendBalance = Number(wallet?.[selectedSendMeta.balanceKey] || 0);

  const availablePoints = Math.max((wallet?.httn_points || 0) - (wallet?.pending_rewards || 0), 0);
  const rewardHealth = wallet
    ? Math.min((availablePoints / Math.max(wallet.httn_points || 1, 1)) * 100, 100)
    : 0;

  const rightSidebar = (
    <div className="space-y-4">
      <VerticalAdBanner {...verticalAds[1]} />
    </div>
  );

  return (
    <MainLayout rightSidebar={rightSidebar}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Wallet & Rewards</h1>
          <p className="text-muted-foreground">
            Track what you have earned, what is still pending review, and how Herald turns healthy participation into value.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {balanceDefinitions.map((definition) => {
            const value = balancesByKey[definition.key];
            const formattedValue =
              definition.key === 'httn_points'
                ? Number(value).toLocaleString()
                : definition.key === 'httn_tokens'
                  ? Number(value).toFixed(2)
                  : `₦${Number(value).toLocaleString()}`;
            const Icon =
              definition.key === 'httn_points'
                ? Sparkles
                : definition.key === 'httn_tokens'
                  ? WalletIcon
                  : TrendingUp;

            return (
              <Card
                key={definition.key}
                className={
                  definition.key === 'httn_points'
                    ? 'bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20'
                    : 'bg-card border-border'
                }
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        definition.key === 'httn_points' ? 'bg-primary/20' : 'bg-secondary'
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${
                          definition.key === 'espees' ? 'text-success' : 'text-primary'
                        }`}
                      />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {definition.badge}
                    </Badge>
                  </div>

                  <div>
                    <p
                      className={`text-3xl font-display font-bold ${
                        definition.key === 'httn_points' ? 'gold-text' : 'text-foreground'
                      }`}
                    >
                      {formattedValue}
                    </p>
                    <p className="text-sm text-muted-foreground">{definition.name}</p>
                  </div>

                  <p className="text-xs text-muted-foreground">{definition.summary}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Reward Settlement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-border bg-secondary/20 p-4">
                  <p className="text-sm text-muted-foreground">Available points</p>
                  <p className="mt-2 font-display text-2xl font-bold text-foreground">
                    {availablePoints.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/20 p-4">
                  <p className="text-sm text-muted-foreground">Pending review</p>
                  <p className="mt-2 font-display text-2xl font-bold gold-text">
                    {(wallet?.pending_rewards || 0).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/20 p-4">
                  <p className="text-sm text-muted-foreground">Reward health</p>
                  <p className="mt-2 font-display text-2xl font-bold text-foreground">
                    {rewardHealth.toFixed(0)}%
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm text-muted-foreground">
                Pending rewards are Herald&apos;s safety buffer. We award points for good participation, but we do not
                release everything instantly. That gives us room to filter spam, repeated actions, suspicious loops,
                and reversed activity before rewards become fully spendable.
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                Wallet Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-2xl border border-border bg-secondary/20 p-4">
                Points are your earned participation balance. Herald should reward contribution quality, not raw tapping.
              </div>
              <div className="rounded-2xl border border-border bg-secondary/20 p-4">
                {POINTS_TO_TOKEN_RATE.toLocaleString()} HTTN Points = 1 HTTN Token. Smaller conversions are blocked to
                reduce micro-farming and noisy ledger activity.
              </div>
              <div className="rounded-2xl border border-border bg-secondary/20 p-4">
                Espees are your commerce balance for store and cause flows, not the default reward for everyday social actions.
              </div>
            </CardContent>
          </Card>
        </div>

        {wallet && wallet.pending_rewards > 0 && (
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-display font-semibold text-foreground">
                    {wallet.pending_rewards} HTTN Points Pending
                  </p>
                  <p className="text-sm text-muted-foreground">
                    These rewards are waiting on quality, trust, or settlement checks.
                  </p>
                </div>
              </div>
              <Button
                variant="gold"
                size="sm"
                onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
              >
                Review Rules
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="earn" className="w-full">
          <TabsList>
            <TabsTrigger value="earn" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Earn
            </TabsTrigger>
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

          <TabsContent value="earn" className="mt-6">
            <PointsSystemGuide />
          </TabsContent>

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
                    {POINTS_TO_TOKEN_RATE.toLocaleString()} HTTN Points = 1 HTTN Token
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
                    min={MIN_POINTS_CONVERSION}
                    max={wallet?.httn_points || 0}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum: {MIN_POINTS_CONVERSION} points | Available: {wallet?.httn_points.toLocaleString() || 0} points
                  </p>
                </div>

                {convertAmount && parseInt(convertAmount, 10) >= MIN_POINTS_CONVERSION && (
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <p className="text-sm text-muted-foreground">You will receive</p>
                    </div>
                    <p className="font-display font-bold text-xl gold-text">{tokensPreview} HTTN Tokens</p>
                  </div>
                )}

                {convertAmount && parseInt(convertAmount, 10) > (wallet?.httn_points || 0) && (
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
                    parseInt(convertAmount, 10) < MIN_POINTS_CONVERSION ||
                    parseInt(convertAmount, 10) > (wallet?.httn_points || 0)
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
                  Send HTTN Points
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Currency</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(sendCurrencyMeta) as SendCurrency[]).map((currency) => {
                      const meta = sendCurrencyMeta[currency];
                      const active = sendCurrency === currency;
                      return (
                        <Button
                          key={currency}
                          type="button"
                          variant={active ? 'gold' : 'outline'}
                          className="justify-center"
                          onClick={() => setSendCurrency(currency)}
                        >
                          {meta.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

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
                  <label className="text-sm text-muted-foreground">Amount ({selectedSendMeta.unit})</label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    className="bg-input"
                    min={1}
                    max={selectedSendBalance}
                    step={sendCurrency === 'httn_points' ? 1 : '0.001'}
                  />
                  <p className="text-xs text-muted-foreground">
                    Available: {selectedSendBalance.toLocaleString()} {selectedSendMeta.unit}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-secondary/50 border border-border flex items-center gap-3">
                  <Shield className="w-5 h-5 text-success" />
                  <p className="text-sm text-muted-foreground">
                    Transfers are recorded in your Herald wallet history. Use Points for community value, Tokens for transferable utility, and Espees for commerce-related movement.
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
                    Number(sendAmount) <= 0 ||
                    Number(sendAmount) > selectedSendBalance
                  }
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    selectedSendMeta.buttonLabel
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
                    {transactions.map((tx) => {
                      const tokenType = tx.token_type || tx.currency || 'points';
                      return (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                tx.amount > 0
                                  ? 'bg-success/20'
                                  : tx.type === 'convert_out'
                                    ? 'bg-primary/20'
                                    : 'bg-destructive/20'
                              }`}
                            >
                              {getTransactionIcon(tx.type)}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{tx.description || 'Wallet activity'}</p>
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
                                <Badge variant="outline" className="text-xs">
                                  {tokenType}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <span
                            className={`font-display font-semibold ${
                              tx.amount > 0 ? 'text-success' : 'text-foreground'
                            }`}
                          >
                            {tx.amount > 0 ? '+' : ''}
                            {tx.amount.toLocaleString()} {tokenType === 'tokens' ? 'HTTN' : 'pts'}
                          </span>
                        </div>
                      );
                    })}
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
