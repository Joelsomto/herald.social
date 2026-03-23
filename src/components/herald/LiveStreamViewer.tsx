import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getStreamChat,
  sendStreamChat,
  sendStreamDonation,
  joinStream,
  leaveStream,
  getStream,
  type StreamChatMessage,
  type StreamDonation,
} from '@/lib/api/streams';
import { getCurrentUserWallet } from '@/lib/api/wallets';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  X, Send, Heart, Gift, Users, BadgeCheck, Sparkles, 
  Volume2, VolumeX, Maximize, Minimize, Share2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface LiveStreamViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  streamId: string;
  streamTitle: string;
  host: {
    id: string;
    name: string;
    username: string;
    avatar?: string | null;
    verified: boolean;
  };
}

interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: {
    display_name: string;
    username: string;
    avatar_url: string | null;
    is_verified: boolean;
  };
}

interface Donation {
  id: string;
  donor_id: string;
  amount: number;
  message: string | null;
  created_at: string;
  profile?: {
    display_name: string;
    avatar_url: string | null;
  };
}

const DONATION_PRESETS = [50, 100, 250, 500, 1000];

export function LiveStreamViewer({ 
  open, 
  onOpenChange, 
  streamId,
  streamTitle,
  host 
}: LiveStreamViewerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const chatScrollRef = useRef<HTMLDivElement>(null);
  
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDonation, setShowDonation] = useState(false);
  const [donationAmount, setDonationAmount] = useState(100);
  const [donationMessage, setDonationMessage] = useState('');
  const [wallet, setWallet] = useState<{ httn_points: number } | null>(null);
  const [recentDonation, setRecentDonation] = useState<Donation | null>(null);

  const refreshChat = useCallback(async () => {
    if (!streamId) return;
    try {
      const result = await getStreamChat(streamId, { limit: 100 });
      const items: StreamChatMessage[] = (result as any)?.data ?? [];
      setMessages(
        items.map((m) => ({
          id: m.id,
          user_id: m.user.id,
          content: m.message,
          created_at: m.created_at,
          profile: {
            display_name: m.user.display_name,
            username: m.user.username,
            avatar_url: m.user.avatar_url,
            is_verified: false,
          },
        }))
      );
    } catch { /* ignore */ }
  }, [streamId]);

  useEffect(() => {
    if (!open || !streamId) return;

    // Initial data fetch
    const fetchData = async () => {
      await refreshChat();

      try {
        const streamData = await getStream(streamId);
        setViewerCount(streamData?.viewer_count ?? 0);
      } catch { /* ignore */ }

      if (user) {
        try {
          const walletData = await getCurrentUserWallet();
          if (walletData) setWallet({ httn_points: walletData.httn_points });
        } catch { /* ignore */ }
      }
    };

    fetchData();

    // Notify backend that user joined
    if (user) joinStream(streamId).catch(() => null);

    // Poll chat every 5 seconds
    pollRef.current = setInterval(refreshChat, 5_000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      // Notify backend on leave
      if (user) leaveStream(streamId).catch(() => null);
    };
  }, [open, streamId, user, refreshChat]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!user || !newMessage.trim()) return;
    const content = newMessage.trim();
    setNewMessage('');
    try {
      const msg = await sendStreamChat(streamId, content);
      // Optimistic update
      setMessages((prev) => [
        ...prev,
        {
          id: msg.id,
          user_id: msg.user.id,
          content: msg.message,
          created_at: msg.created_at,
          profile: {
            display_name: msg.user.display_name,
            username: msg.user.username,
            avatar_url: msg.user.avatar_url,
            is_verified: false,
          },
        },
      ]);
    } catch {
      setNewMessage(content); // restore on error
    }
  };

  const sendDonation = async () => {
    if (!user || !wallet || wallet.httn_points < donationAmount) {
      toast({
        title: 'Insufficient Points',
        description: "You don't have enough HTTN Points for this donation.",
        variant: 'destructive',
      });
      return;
    }

    try {
      const donation = await sendStreamDonation(streamId, {
        amount: donationAmount,
        currency: 'points',
        message: donationMessage || undefined,
      });

      const donationWithProfile: Donation = {
        id: donation.id,
        donor_id: user.id,
        amount: Number(donation.amount),
        message: donation.message ?? null,
        created_at: donation.created_at,
        profile: { display_name: user.display_name || 'You', avatar_url: null },
      };

      setDonations((prev) => [...prev, donationWithProfile]);
      setRecentDonation(donationWithProfile);
      setTimeout(() => setRecentDonation(null), 5000);

      setWallet({ httn_points: wallet.httn_points - donationAmount });
      setShowDonation(false);
      setDonationAmount(100);
      setDonationMessage('');

      toast({
        title: 'Donation Sent!',
        description: `You sent ${donationAmount} HTTN Points to ${host.name}`,
      });
    } catch {
      toast({
        title: 'Donation Failed',
        description: 'Unable to process your donation. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${isFullscreen ? 'max-w-full h-screen' : 'max-w-4xl'} p-0 bg-background border-border overflow-hidden`}>
        <div className="flex flex-col md:flex-row h-[80vh]">
          {/* Video Area */}
          <div className="flex-1 relative bg-black flex items-center justify-center">
            {/* Placeholder for video */}
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
              <div className="text-center text-white/50">
                <div className="w-20 h-20 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-4">
                  <Users className="w-10 h-10" />
                </div>
                <p className="text-lg font-medium">Live Stream</p>
                <p className="text-sm">Video content would appear here</p>
              </div>
            </div>

            {/* Top overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border-2 border-red-500">
                    <AvatarImage src={host.avatar || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary font-bold">
                      {host.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white font-semibold flex items-center gap-1">
                      {host.name}
                      {host.verified && <BadgeCheck className="w-4 h-4 text-primary fill-primary/20" />}
                    </p>
                    <p className="text-white/70 text-sm">@{host.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-500 text-white">
                    LIVE
                  </Badge>
                  <Badge variant="secondary" className="bg-black/50 text-white">
                    <Users className="w-3 h-3 mr-1" />
                    {viewerCount.toLocaleString()}
                  </Badge>
                </div>
              </div>
              <p className="text-white font-medium mt-2 line-clamp-1">{streamTitle}</p>
            </div>

            {/* Donation alert */}
            <AnimatePresence>
              {recentDonation && (
                <motion.div
                  initial={{ opacity: 0, y: -50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -50, scale: 0.9 }}
                  className="absolute top-24 left-1/2 -translate-x-1/2 z-10"
                >
                  <div className="bg-gradient-to-r from-primary to-yellow-400 rounded-xl px-6 py-3 shadow-lg">
                    <div className="flex items-center gap-3">
                      <Gift className="w-6 h-6 text-white" />
                      <div>
                        <p className="text-white font-bold">
                          {recentDonation.profile?.display_name || 'Anonymous'} donated!
                        </p>
                        <p className="text-white/80 text-sm flex items-center gap-1">
                          <Sparkles className="w-4 h-4" />
                          {recentDonation.amount} HTTN Points
                        </p>
                      </div>
                    </div>
                    {recentDonation.message && (
                      <p className="text-white/90 text-sm mt-1 italic">"{recentDonation.message}"</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                  >
                    {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 gap-1"
                  >
                    <Heart className="w-4 h-4" />
                    Like
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 gap-1"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                  <Button
                    variant="gold"
                    size="sm"
                    className="gap-1"
                    onClick={() => setShowDonation(true)}
                  >
                    <Gift className="w-4 h-4" />
                    Donate
                  </Button>
                </div>
              </div>
            </div>

            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Chat Panel */}
          <div className="w-full md:w-80 flex flex-col border-l border-border bg-card">
            <div className="p-3 border-b border-border">
              <h3 className="font-semibold text-foreground">Live Chat</h3>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-3" ref={chatScrollRef}>
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex gap-2">
                    <Avatar className="w-6 h-6 flex-shrink-0">
                      <AvatarImage src={msg.profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-secondary">
                        {msg.profile?.display_name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-foreground">
                        {msg.profile?.display_name || 'Anonymous'}
                        {msg.profile?.is_verified && (
                          <BadgeCheck className="w-3 h-3 inline ml-0.5 text-primary fill-primary/20" />
                        )}
                      </span>
                      <p className="text-sm text-muted-foreground break-words">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Chat input */}
            {user ? (
              <div className="p-3 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    placeholder="Send a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1 bg-input"
                  />
                  <Button 
                    variant="gold" 
                    size="icon"
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-3 border-t border-border text-center text-sm text-muted-foreground">
                Sign in to chat
              </div>
            )}
          </div>
        </div>

        {/* Donation Modal */}
        <AnimatePresence>
          {showDonation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 flex items-center justify-center z-20"
              onClick={() => setShowDonation(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-card rounded-xl p-6 w-full max-w-sm mx-4 border border-border"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  Send Donation
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Your balance:</span>
                    <span className="gold-text font-semibold flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-primary" />
                      {wallet?.httn_points.toLocaleString() || 0} HTTN
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    {DONATION_PRESETS.map((amount) => (
                      <Button
                        key={amount}
                        variant={donationAmount === amount ? 'gold' : 'outline'}
                        size="sm"
                        onClick={() => setDonationAmount(amount)}
                        className="text-xs"
                      >
                        {amount}
                      </Button>
                    ))}
                  </div>

                  <Input
                    type="number"
                    placeholder="Custom amount"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(Number(e.target.value))}
                    className="bg-input"
                  />

                  <Input
                    placeholder="Add a message (optional)"
                    value={donationMessage}
                    onChange={(e) => setDonationMessage(e.target.value)}
                    className="bg-input"
                  />

                  <Button
                    variant="gold"
                    className="w-full gap-2"
                    onClick={sendDonation}
                    disabled={!wallet || wallet.httn_points < donationAmount || donationAmount <= 0}
                  >
                    <Gift className="w-4 h-4" />
                    Send {donationAmount} HTTN Points
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setShowDonation(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
