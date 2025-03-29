import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { Alert } from 'react-native';

// Import or reference the supabaseUrl from the supabase file
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://zafiiboppuqoihzlncii.supabase.co';

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and subscribe to auth changes
    console.log("Checking for existing session...");
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Session found:", session ? "Yes" : "No");
      setSession(session);
      setLoading(false);
    }).catch(error => {
      console.error('Auth session error:', error);
      setSession(null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event);
      setSession(session);
      setLoading(false);
      
      // Handle session token refresh errors
      if (_event === 'TOKEN_REFRESHED' && !session) {
        console.log('Session token refresh failed, redirecting to login');
        signOut(); // Force sign out if token refresh fails
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // تسجيل البيانات للتشخيص
      console.log(`Attempting to sign in with: ${email}`);
      console.log(`Supabase URL: ${supabaseUrl}`);
      
      // محاولة تسجيل الدخول
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      // إذا كان هناك خطأ واضح من Supabase
      if (error) {
        console.error('Supabase auth error:', error.message);
        console.error('Full error details:', JSON.stringify(error));
        return { error };
      }
      
      // التحقق من البيانات المستلمة
      console.log('Sign in successful, data received:', data ? 'Yes' : 'No');
      
      if (!data) {
        console.error('No data returned from Supabase');
        return { error: new Error('لم يتم استلام بيانات من الخادم') };
      }
      
      if (!data.session) {
        console.error('No session in data returned from Supabase', JSON.stringify(data));
        return { error: new Error('لم يتم إنشاء جلسة للمستخدم') };
      }
      
      // تسجيل معلومات الجلسة الناجحة
      console.log('Session created successfully for user:', data.user?.id);
      
      // ضبط الجلسة يدويًا للتأكد من تحديثها
      setSession(data.session);
      
      return { error: null };
    } catch (error: any) {
      // تسجيل الأخطاء غير المتوقعة
      console.error('Unexpected sign in error:', typeof error);
      console.error('Error message:', error.message);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      // إنشاء رسالة خطأ محسنة
      const errorMessage = 
        error.message?.includes('network') || error.message?.includes('fetch') 
          ? 'مشكلة في الاتصال بالشبكة. يرجى التحقق من اتصالك بالإنترنت.'
          : 'حدث خطأ غير متوقع أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.';
      
      return { error: new Error(errorMessage) };
    }
  };

  const signOut = async () => {
    try {
      console.log("Signing out user...");
      await supabase.auth.signOut();
      console.log("Sign out completed, clearing session");
      setSession(null);
    } catch (error) {
      console.error('Sign out error:', error);
      // Clear session anyway even if signOut fails
      setSession(null);
    }
  };

  const value = {
    session,
    loading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 