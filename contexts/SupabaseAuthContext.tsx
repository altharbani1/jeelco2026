import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../src/lib/supabase';

interface SupabaseUser {
  id: string;
  email: string;
  company_id?: string;
  role?: string;
}

interface SupabaseAuthContextType {
  user: SupabaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

export const SupabaseAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = supabase.auth.getSession();
    session.then(({ data }) => {
      if (data.session?.user) {
        fetchAppUser(data.session.user.id);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchAppUser(session.user.id);
      } else {
        setUser(null);
      }
    });
  }, []);

  const fetchAppUser = async (id: string) => {
    const { data, error } = await supabase.from('app_users').select('*').eq('id', id).single();
    if (data) {
      setUser({
        id: data.id,
        email: data.email,
        company_id: data.company_id,
        role: await fetchUserRole(id, data.company_id)
      });
    } else {
      setUser(null);
    }
  };

  const fetchUserRole = async (userId: string, companyId: string) => {
    const { data } = await supabase.from('user_roles').select('role_id, roles(name)').eq('user_id', userId).eq('company_id', companyId).single();
    if (!data || !data.roles) return null;
    if (Array.isArray(data.roles)) {
      return data.roles.length > 0 && data.roles[0] && typeof data.roles[0].name === 'string' ? data.roles[0].name : null;
    }
    if (typeof data.roles === 'object' && data.roles !== null && 'name' in data.roles) {
      return (data.roles as any).name;
    }
    return null;
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (data?.user) {
      await fetchAppUser(data.user.id);
      setLoading(false);
      return true;
    }
    setLoading(false);
    return false;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <SupabaseAuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};

export const useSupabaseAuth = () => {
  const ctx = useContext(SupabaseAuthContext);
  if (!ctx) throw new Error('useSupabaseAuth must be used within SupabaseAuthProvider');
  return ctx;
};
