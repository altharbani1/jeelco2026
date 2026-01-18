import React from 'react';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useSupabaseAuth();
  if (loading) return <div>جاري التحقق من الجلسة...</div>;
  if (!user) return <div>يجب تسجيل الدخول أولاً.</div>;
  return <>{children}</>;
};
