import React, { createContext, useContext, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface User {
  id: string;
  fullName: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  updatePreferences: (prefs: { avatar_url?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  updatePreferences: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const updatePreferences = async (prefs: { avatar_url?: string }) => {
    if (!user?.id) return;
    await supabase.from('users').update(prefs).eq('id', user.id);
    setUser(prev => prev ? { ...prev, avatarUrl: prefs.avatar_url } : null);
  };

  return (
    <AuthContext.Provider value={{ user, updatePreferences }}>
      {children}
    </AuthContext.Provider>
  );
}; 