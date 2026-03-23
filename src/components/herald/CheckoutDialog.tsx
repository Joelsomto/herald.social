import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Sparkles, Check, ShoppingBag, Loader2, BadgeCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface CartItem {
  id: string;
  name: string;
  price: number;
  priceType: 'httn' | 'espees';
}

interface CheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onSuccess: () => void;
}

export function CheckoutDialog({ isOpen, onClose, items, onSuccess }: CheckoutDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<'review' | 'processing' | 'success'>('review');
  const [walletBalance, setWalletBalance] = useState({ httn_points: 0, espees: 0 });

  // Calculate totals
  const httnTotal = items.filter(i => i.priceType === 'httn').reduce((sum, i) => sum + i.price, 0);
  const espeesTotal = items.filter(i => i.priceType === 'espees').reduce((sum, i) => sum + i.price, 0);

  // Fetch wallet on open
  useState(() => {
    if (isOpen && user) {
      import('@/lib/api/wallets').then(({ getCurrentUserWallet }) =>
        getCurrentUserWallet()
          .then((wallet) => {
            if (wallet) {
              setWalletBalance({
                httn_points: wallet.httn_points,
                espees: Number(wallet.espees),
              });
            }
          })
          .catch(() => null)
      );
    }
  });

  const hasEnoughFunds = walletBalance.httn_points >= httnTotal && walletBalance.espees >= espeesTotal;

  const handleCheckout = async () => {
    if (!user || !hasEnoughFunds) return;

    setStep('processing');

    try {
      const { storeCheckout } = await import('@/lib/api/store');
      // Build checkout payload — use product IDs from cart items
      await storeCheckout({
        items: items.map((i) => ({ product_id: i.id, quantity: 1 })),
        payment_type: httnTotal > 0 ? 'httn' : 'espees',
      });

      setStep('success');
      
      setTimeout(() => {
        onSuccess();
        onClose();
        setStep('review');
      }, 2000);

    } catch (error) {
      toast({
        title: 'Purchase Failed',
        description: 'There was an error processing your order',
        variant: 'destructive',
      });
      setStep('review');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Checkout
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Items */}
              <div className="space-y-3 max-h-[200px] overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{item.name}</span>
                    <span className="text-sm font-semibold gold-text">
                      {item.price.toLocaleString()} {item.priceType.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                {httnTotal > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">HTTN Total</span>
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="font-display font-bold gold-text">{httnTotal.toLocaleString()}</span>
                    </div>
                  </div>
                )}
                {espeesTotal > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Espees Total</span>
                    <span className="font-display font-bold text-foreground">{espeesTotal.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Wallet balance */}
              <Card className="p-3 bg-secondary/50">
                <p className="text-xs text-muted-foreground mb-2">Your balance</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-foreground">{walletBalance.httn_points.toLocaleString()} HTTN</span>
                  </div>
                  <span className="text-muted-foreground">{walletBalance.espees.toLocaleString()} Espees</span>
                </div>
                {!hasEnoughFunds && (
                  <p className="text-xs text-destructive mt-2">Insufficient balance</p>
                )}
              </Card>

              <Button 
                variant="gold" 
                className="w-full" 
                onClick={handleCheckout}
                disabled={!hasEnoughFunds || items.length === 0}
              >
                Complete Purchase
              </Button>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 flex flex-col items-center gap-4"
            >
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-muted-foreground">Processing your order...</p>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 flex flex-col items-center gap-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center"
              >
                <BadgeCheck className="w-8 h-8 text-green-500" />
              </motion.div>
              <h3 className="font-display text-xl font-bold text-foreground">Order Complete!</h3>
              <p className="text-muted-foreground text-sm text-center">
                Your items have been added to your account
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
