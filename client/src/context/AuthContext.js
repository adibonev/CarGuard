import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabaseAuth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize Supabase session
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
        setIsInitialized(true);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (authUserId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single();

      if (error) throw error;
      
      setUser(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUser(null);
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  };

  const register = async (name, email, password) => {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });

      if (authError) throw authError;

      // Create user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          name,
          email: email.toLowerCase(),
          auth_user_id: authData.user.id,
          reminder_days: 30,
          reminder_enabled: true,
          email_verified: false
        })
        .select()
        .single();

      if (userError) throw userError;

      // Create account record
      await supabase.from('accounts').insert({
        user_id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: null
      });

      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      await loadUserProfile(data.user.id);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const updateReminderDays = async (reminderDays) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ reminder_days: reminderDays })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setUser(data);
      return { success: true, reminderDays: data.reminder_days };
    } catch (error) {
      console.error('Error updating reminder days:', error);
      throw error;
    }
  };

  const updateReminderEnabled = async (reminderEnabled) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ reminder_enabled: reminderEnabled })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setUser(data);
      return { success: true, reminderEnabled: data.reminder_enabled };
    } catch (error) {
      console.error('Error updating reminder enabled:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        token: session?.access_token,
        login,
        register,
        logout,
        updateReminderDays,
        updateReminderEnabled,
        isInitialized,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
