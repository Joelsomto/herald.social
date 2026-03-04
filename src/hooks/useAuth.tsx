import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/apiClient';
import { authGetCurrentUser, authSignIn, authSignOut, authSignUp } from '@/lib/api/auth';
import type { ApiUser, AuthSession } from '@/lib/api/types';

interface AuthContextType {
  user: ApiUser | null;
  session: AuthSession | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const loadCurrentUser = async () => {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        if (mounted) {
          setUser(null);
          setSession(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const currentUser = await authGetCurrentUser();
        if (!mounted) return;
        setUser(currentUser);
        setSession(null);
      } catch (error) {
        if (!mounted) return;
        if (error instanceof ApiError && error.status === 401) {
          setUser(null);
          setSession(null);
        } else {
          console.error('Error loading current user:', error);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadCurrentUser();

    return () => {
      mounted = false;
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, username: string) => {
    setLoading(true);
    try {
      const normalizedFullName = fullName.trim();
      const normalizedUsername = username.trim().toLowerCase();
      const response = await authSignUp({
        email,
        password,
        full_name: normalizedFullName || undefined,
        username: normalizedUsername,
        display_name: normalizedFullName || normalizedUsername,
      });

      setUser(response.user);
      const nextSession = response.session
        ? response.session
        : response.access_token
          ? {
              access_token: response.access_token,
              token_type: response.token_type || 'Bearer',
              expires_in: response.expires_in || 3600,
            }
          : null;

      setSession(nextSession);
      if (nextSession?.access_token) {
        localStorage.setItem('access_token', nextSession.access_token);
      }

      toast({
        title: 'Account created!',
        description: 'Welcome! Your account is ready. Welcome bonus: 100 HTTN Points added.',
      });
    } catch (error: any) {
      const message = error?.message || 'Something went wrong. Please try again.';
      toast({
        title: 'Sign Up Failed',
        description: message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await authSignIn({ email, password });
      setUser(response.user);
      
      const nextSession = response.session
        ? response.session
        : response.access_token
          ? {
              access_token: response.access_token,
              token_type: response.token_type || 'Bearer',
              expires_in: response.expires_in || 3600,
            }
          : null;

      if (nextSession) {
        setSession(nextSession);
        localStorage.setItem('access_token', nextSession.access_token);
      }
      
      toast({
        title: 'Welcome back!',
        description: 'Successfully signed in',
      });
    } catch (error: any) {
      const msg = error?.message || '';
      const description =
        msg.includes('Invalid login') || msg.includes('invalid') || msg.includes('credentials')
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
      await authSignOut();
      setUser(null);
      setSession(null);
      localStorage.removeItem('access_token');
      
      toast({
        title: 'Signed out',
        description: 'You have been successfully signed out',
      });
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