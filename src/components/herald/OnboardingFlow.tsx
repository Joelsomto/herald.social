import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sparkles, ArrowRight, Check, BadgeCheck, User, Church, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const ACCOUNT_TYPES = [
  { 
    id: 'normal', 
    label: 'Normal Account', 
    description: 'Personal account for individual users',
    icon: User 
  },
  { 
    id: 'church', 
    label: 'Church / Group', 
    description: 'For churches, ministries, and organizations',
    icon: Church 
  },
  { 
    id: 'business', 
    label: 'Business Account', 
    description: 'For businesses and commercial entities',
    icon: Briefcase 
  },
];

const INTERESTS = [
  { id: 'crypto', label: '🪙 Crypto & Web3', icon: '🪙' },
  { id: 'faith', label: '✝️ Faith & Inspiration', icon: '✝️' },
  { id: 'tech', label: '💻 Technology', icon: '💻' },
  { id: 'music', label: '🎵 Music', icon: '🎵' },
  { id: 'business', label: '💼 Business', icon: '💼' },
  { id: 'lifestyle', label: '🌟 Lifestyle', icon: '🌟' },
  { id: 'sports', label: '⚽ Sports', icon: '⚽' },
  { id: 'education', label: '📚 Education', icon: '📚' },
  { id: 'entertainment', label: '🎬 Entertainment', icon: '🎬' },
  { id: 'news', label: '📰 News & Current Affairs', icon: '📰' },
  { id: 'health', label: '💪 Health & Wellness', icon: '💪' },
  { id: 'art', label: '🎨 Art & Design', icon: '🎨' },
];

const SUGGESTED_USERS = [
  { id: 'herald', name: 'Herald Official', username: 'herald', verified: true, avatar: null, bio: 'Official Herald Social account' },
  { id: 'sarah', name: 'Sarah Chen', username: 'sarahcreates', verified: true, avatar: null, bio: 'Creator & Web3 enthusiast' },
  { id: 'alex', name: 'Alex Rivera', username: 'alexr', verified: true, avatar: null, bio: 'Tech blogger & investor' },
  { id: 'pastor', name: 'Pastor Chris', username: 'pastorchris', verified: true, avatar: null, bio: 'Inspiring millions worldwide' },
  { id: 'maya', name: 'Maya Johnson', username: 'mayaj', verified: false, avatar: null, bio: 'Lifestyle & wellness coach' },
];

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedAccountType, setSelectedAccountType] = useState<string>('normal');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [followedUsers, setFollowedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id) 
        : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const toggleFollow = (id: string) => {
    setFollowedUsers(prev => 
      prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    // Save account type to profile
    await supabase.from('profiles').update({
      account_type: selectedAccountType,
    }).eq('user_id', user.id);

    // Save interests
    await supabase.from('user_interests').upsert({
      user_id: user.id,
      interests: selectedInterests,
      onboarding_completed: true,
    });

    setIsLoading(false);
    onComplete();
  };

  const canProceed = step === 1 ? selectedAccountType : step === 2 ? selectedInterests.length >= 1 : true;
  const totalSteps = 4;

  return (
    <motion.div 
      className="fixed inset-0 z-50 bg-background flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Card className="w-full max-w-md border-border bg-card">
        <CardContent className="p-6">
          {/* Progress indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3, 4].map((s) => (
              <div 
                key={s} 
                className={`flex-1 h-1 rounded-full transition-colors ${
                  s <= step ? 'bg-primary' : 'bg-secondary'
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Account Type Selection */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center">
                  <h2 className="font-display text-2xl font-bold text-foreground">Choose your account type</h2>
                  <p className="text-muted-foreground text-sm mt-1">Select the type that best describes you</p>
                </div>

                <div className="space-y-3 py-4">
                  {ACCOUNT_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedAccountType === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setSelectedAccountType(type.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-primary/10 border-primary'
                            : 'bg-secondary/50 border-border hover:border-primary/50'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                        }`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                            {type.label}
                          </p>
                          <p className="text-xs text-muted-foreground">{type.description}</p>
                        </div>
                        {isSelected && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 2: Interests */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center">
                  <h2 className="font-display text-2xl font-bold text-foreground">Pick your interests</h2>
                  <p className="text-muted-foreground text-sm mt-1">Select up to 3 topics to personalize your feed</p>
                </div>

                <div className="flex flex-wrap gap-2 justify-center py-4">
                  {INTERESTS.map((interest) => (
                    <button
                      key={interest.id}
                      onClick={() => toggleInterest(interest.id)}
                      className={`px-4 py-2 rounded-full border transition-all text-sm font-medium ${
                        selectedInterests.includes(interest.id)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-secondary text-foreground border-border hover:border-primary/50'
                      }`}
                    >
                      {interest.label}
                    </button>
                  ))}
                </div>

                <p className="text-center text-xs text-muted-foreground">
                  {selectedInterests.length}/3 selected
                </p>
              </motion.div>
            )}

            {/* Step 3: Suggested users */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center">
                  <h2 className="font-display text-2xl font-bold text-foreground">People to follow</h2>
                  <p className="text-muted-foreground text-sm mt-1">Follow creators you're interested in</p>
                </div>

                <div className="space-y-3 py-4 max-h-[300px] overflow-y-auto">
                  {SUGGESTED_USERS.map((suggestedUser) => (
                    <div 
                      key={suggestedUser.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-secondary/50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={suggestedUser.avatar || undefined} />
                          <AvatarFallback className="bg-primary/20 text-primary font-display font-bold">
                            {suggestedUser.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-foreground flex items-center gap-1">
                            {suggestedUser.name}
                            {suggestedUser.verified && (
                              <BadgeCheck className="w-4 h-4 text-primary fill-primary/20" />
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">@{suggestedUser.username}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={followedUsers.includes(suggestedUser.id) ? 'outline' : 'gold'}
                        onClick={() => toggleFollow(suggestedUser.id)}
                        className="rounded-full"
                      >
                        {followedUsers.includes(suggestedUser.id) ? (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            Following
                          </>
                        ) : (
                          'Follow'
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 4: Welcome */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 text-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="w-20 h-20 mx-auto rounded-2xl bg-primary flex items-center justify-center gold-glow"
                >
                  <Sparkles className="w-10 h-10 text-primary-foreground" />
                </motion.div>

                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">You're all set!</h2>
                  <p className="text-muted-foreground text-sm mt-2">
                    Welcome to Herald Social. Start creating, engaging, and earning rewards.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span className="font-display font-bold gold-text text-lg">100 HTTN Points</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Welcome bonus added to your wallet!</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 1 && step < totalSteps && (
              <Button 
                variant="outline" 
                onClick={() => setStep(s => s - 1)}
                className="flex-1"
              >
                Back
              </Button>
            )}
            <Button 
              variant="gold" 
              onClick={() => step < totalSteps ? setStep(s => s + 1) : handleComplete()}
              disabled={!canProceed || isLoading}
              className="flex-1 gap-2"
            >
              {step === totalSteps ? (isLoading ? 'Loading...' : 'Get Started') : 'Continue'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {step < totalSteps && (
            <button 
              onClick={() => setStep(s => s + 1)}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-3 transition-colors"
            >
              Skip for now
            </button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
