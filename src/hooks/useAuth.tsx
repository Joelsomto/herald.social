// src/hooks/useAuth.tsx   ← or wherever this file lives
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to auth state changes - this handles initial session + future changes
    let mounted = true;
    let initialLoadComplete = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, 'Session:', session?.user?.id);

        if (!mounted) return;

        // On first load (INITIAL_SESSION or first SIGNED_IN), set user and mark as loaded
        if (!initialLoadComplete) {
          console.log('Initial auth state received, setting user and loading=false');
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          initialLoadComplete = true;
          
          if (session?.user) {
            // Verify profile exists for signed-in users
            try {
              const { data: userProfile, error: profileError } = await supabase
                .from('users')
                .select('user_id, username, display_name')
                .eq('user_id', session.user.id)
                .maybeSingle();
              
              if (profileError) {
                console.error('Error checking user profile:', profileError);
                return;
              }
              
              if (!userProfile) {
                console.error('User authenticated but profile does not exist');
                // Sign them out
                setTimeout(() => {
                  supabase.auth.signOut().catch(console.error);
                }, 100);
                return;
              }
              
              console.log('User profile verified:', userProfile);
            } catch (error) {
              console.error('Exception checking profile:', error);
            }
          }
          return;
        }

        // Handle subsequent state changes
        setSession(session);
        setUser(session?.user ?? null);

        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const { data: userProfile, error: profileError } = await supabase
              .from('users')
              .select('user_id, username, display_name')
              .eq('user_id', session.user.id)
              .maybeSingle();
            
            if (profileError) {
              console.error('Error checking user profile:', profileError);
              return;
            }
            
            if (!userProfile) {
              console.error('User authenticated but profile does not exist');
              setTimeout(() => {
                supabase.auth.signOut().catch(console.error);
              }, 100);
              return;
            }
          } catch (error) {
            console.error('Exception in SIGNED_IN handler:', error);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [toast]);

  const signUp = async (email: string, password: string, fullName: string, username: string) => {
    setLoading(true);
    try {
      const normalizedFullName = fullName.trim();
      const normalizedUsername = username.trim().toLowerCase();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: normalizedFullName || undefined,
            username: normalizedUsername || undefined,
          },
          emailRedirectTo: `${window.location.origin}/`, // or /welcome, /verify-email, etc.
        },
      });

      if (error) {
        console.error('Sign up error:', error);
        // Handle specific error cases
        if (error.code === 'over_email_send_rate_limit') {
          toast({
            title: 'Email Rate Limit Exceeded',
            description: 'Too many signups. Please wait a few minutes.',
            variant: 'destructive',
          });
          throw error;
        }
        if (error.status === 422) {
          toast({
            title: 'Sign Up Failed',
            description: error.message || 'User already exists or invalid data. Try signing in instead.',
            variant: 'destructive',
          });
          throw error;
        }
        throw error;
      }

      // Check if user was created (even if email confirmation is pending)
      if (data.user) {
        // Wait a moment for trigger to create profile
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verify profile was created
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('user_id')
          .eq('user_id', data.user.id)
          .maybeSingle();
        
        if (profileError) {
          console.error('Profile check error:', profileError);
          toast({
            title: 'Account Created with Warning',
            description: `Account created but profile setup may have failed: ${profileError.message}`,
            variant: 'destructive',
          });
        } else if (!profile) {
          toast({
            title: 'Account Setup Issue',
            description: 'Account created but profile was not initialized. Please contact support.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Account created!',
            description: data.user.email_confirmed_at 
              ? 'Welcome! Your account is ready. Welcome bonus: 100 HTTN Points added.'
              : 'Check your email to confirm your account. Welcome bonus: 100 HTTN Points added.',
          });
        }
      } else {
        toast({
          title: 'Sign Up Failed',
          description: 'Unable to create account. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      // Only show generic error if not already handled above
      if (error?.code !== 'over_email_send_rate_limit' && error?.status !== 422) {
        toast({
          title: 'Sign Up Failed',
          description: error?.message || 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Success toast is now handled in onAuthStateChange → cleaner
    } catch (error: any) {
      const msg = error?.message || '';
      const description =
        msg.includes('Invalid login') || msg.includes('invalid') || error?.status === 400
          ? 'Wrong email or password. If you just signed up, check your email to confirm your account.'
          : msg || 'Something went wrong. Please try again.';
      toast({
        title: 'Sign In Failed',
        description,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Success toast also handled in listener
    } catch (error: any) {
      toast({
        title: 'Sign Out Failed',
        description: error?.message || 'Could not sign out. Try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}