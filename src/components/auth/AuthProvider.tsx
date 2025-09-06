import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const fetchProfile = async (userId: string, userEmail?: string) => {
    console.log('👤 [AuthProvider] fetchProfile called for user:', userId);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('❌ [AuthProvider] Error fetching profile:', error);
        return null;
      }

      // Add email from user object to profile
      const profileData = {
        ...data,
        email: userEmail || null
      } as Profile;

      console.log('✅ [AuthProvider] Profile fetched successfully:', profileData.display_name);
      return profileData;
    } catch (error) {
      console.error('❌ [AuthProvider] Unexpected error in fetchProfile:', error);
      return null;
    }
  };

  useEffect(() => {
    const getSession = async () => {
      console.log('🔍 [AuthProvider] Starting getSession...');
      try {
        // Timeout reduzido para 5 segundos
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 5000)
        );
        
        console.log('🔍 [AuthProvider] Calling supabase.auth.getSession()...');
        const sessionPromise = supabase.auth.getSession();
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        console.log('🔍 [AuthProvider] Session result:', session ? 'Found' : 'Not found', session?.user?.id);
        
        if (session?.user) {
          console.log('🔍 [AuthProvider] Setting user and session...');
          setUser(session.user);
          setSession(session);
          try {
            console.log('🔍 [AuthProvider] Fetching profile for user:', session.user.id);
            const profileData = await fetchProfile(session.user.id, session.user.email);
            console.log('🔍 [AuthProvider] Profile fetched:', profileData ? 'Success' : 'Failed');
            setProfile(profileData);
          } catch (profileError) {
            console.warn('⚠️ [AuthProvider] Error fetching profile, continuing without profile:', profileError);
            setProfile(null);
          }
        } else {
          console.log('🔍 [AuthProvider] No session found, clearing state...');
          // Sem sessão ativa, continua normalmente
          setUser(null);
          setSession(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('❌ [AuthProvider] Error in getSession:', error);
        // Log apenas em desenvolvimento, não em produção
        if (process.env.NODE_ENV === 'development') {
          console.warn('Session check failed, continuing without authentication:', error);
        }
        // Continua sem usuário em caso de erro (modo offline ou problemas de conectividade)
        setUser(null);
        setSession(null);
        setProfile(null);
      } finally {
        console.log('🔍 [AuthProvider] getSession completed, setting loading to false and initialLoadComplete to true');
        setLoading(false);
        setInitialLoadComplete(true);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 [AuthProvider] onAuthStateChange triggered:', event, session?.user?.id);
        
        // Evitar processamento desnecessário para eventos irrelevantes
        if (event === 'INITIAL_SESSION') {
          console.log('🔄 [AuthProvider] Skipping INITIAL_SESSION event (handled by getSession)');
          return;
        }
        
        try {
          if (session?.user) {
            console.log('🔄 [AuthProvider] Setting user and session from auth state change...');
            setUser(session.user);
            setSession(session);
            try {
              console.log('🔄 [AuthProvider] Fetching profile from auth state change...');
              const profileData = await fetchProfile(session.user.id, session.user.email);
              console.log('🔄 [AuthProvider] Profile fetched from auth state change:', profileData ? 'Success' : 'Failed');
              setProfile(profileData);
            } catch (profileError) {
              console.warn('⚠️ [AuthProvider] Error fetching profile in auth state change:', profileError);
              setProfile(null);
            }
          } else {
            console.log('🔄 [AuthProvider] No session in auth state change, clearing state...');
            setUser(null);
            setSession(null);
            setProfile(null);
          }
        } catch (error) {
          console.error('❌ [AuthProvider] Error in auth state change:', error);
          // Log apenas em desenvolvimento
          if (process.env.NODE_ENV === 'development') {
            console.warn('Error in auth state change:', error);
          }
          // Em caso de erro, limpa o estado
          setUser(null);
          setSession(null);
          setProfile(null);
        } finally {
          // Só resetar loading se ainda não foi completado o carregamento inicial
          if (!initialLoadComplete) {
            console.log('🔄 [AuthProvider] onAuthStateChange completed, setting loading to false (initial load)');
            setLoading(false);
            setInitialLoadComplete(true);
          } else {
            console.log('🔄 [AuthProvider] onAuthStateChange completed, initial load already done, keeping loading state');
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
      
      // Clear local state immediately
      setUser(null);
      setSession(null);
      setProfile(null);
      
      // Redirect to home page after logout
      window.location.href = '/';
      
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if there's an error, clear the local state
      setUser(null);
      setSession(null);
      setProfile(null);
      // Still redirect to home page
      window.location.href = '/';
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });
    return { error };
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};