import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabaseAuth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const loadingProfileRef = React.useRef(false);
  const profileLoadedForRef = React.useRef(null); // tracks which auth user id was last loaded

  // Initialize Supabase session — use ONLY onAuthStateChange, not getSession()
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
        setIsInitialized(true);
        profileLoadedForRef.current = null;
        return;
      }

      if (session?.user) {
        // Only load profile on sign-in events or if it's a different user
        if (
          event === 'SIGNED_IN' ||
          event === 'INITIAL_SESSION' ||
          profileLoadedForRef.current !== session.user.id
        ) {
          loadUserProfile(session.user);
        } else {
          // TOKEN_REFRESHED or USER_UPDATED for same user — just update session, don't reload profile
          setLoading(false);
          setIsInitialized(true);
        }
      } else {
        setUser(null);
        setLoading(false);
        setIsInitialized(true);
        profileLoadedForRef.current = null;
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (authUser) => {
    // Prevent concurrent calls
    if (loadingProfileRef.current) return;
    loadingProfileRef.current = true;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading user profile:', error);
        setUser(null);
      } else if (data) {
        setUser(data);
        profileLoadedForRef.current = authUser.id;
      } else {
        // Profile doesn't exist by auth_user_id — try to find by email and link it
        const name = authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User';
        const email = authUser.email?.toLowerCase();

        // First try to link an existing profile that has a matching email but null auth_user_id
        const { data: existing } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .is('auth_user_id', null)
          .maybeSingle();

        if (existing) {
          // Link the existing profile to this auth user
          const { data: linked, error: linkError } = await supabase
            .from('users')
            .update({ auth_user_id: authUser.id, email_verified: true })
            .eq('id', existing.id)
            .select()
            .maybeSingle();
          if (!linkError && linked) { setUser(linked); profileLoadedForRef.current = authUser.id; }
          else { setUser(existing); profileLoadedForRef.current = authUser.id; }
        } else {
          // Create a brand new profile
          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
              name,
              email,
              auth_user_id: authUser.id,
              reminder_days: 30,
              reminder_enabled: true,
              email_verified: true,
            })
            .select()
            .maybeSingle();
          if (!insertError && newUser) { setUser(newUser); profileLoadedForRef.current = authUser.id; }
          else setUser(null);
        }
      }
    } catch (err) {
      console.error('loadUserProfile error:', err);
      setUser(null);
    } finally {
      setLoading(false);
      setIsInitialized(true);
      loadingProfileRef.current = false;
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
        .maybeSingle();

      if (userError) throw userError;

      // Create account record
      await supabase.from('accounts').insert({
        user_id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: null
      });

      setUser(userData);
      
      // Check if email confirmation is required
      const emailConfirmationRequired = authData.user && !authData.user.confirmed_at;
      
      return { 
        success: true, 
        user: userData,
        emailConfirmationRequired 
      };
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

      await loadUserProfile(data.user);
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
        .maybeSingle();

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
        .maybeSingle();

      if (error) throw error;

      setUser(data);
      return { success: true, reminderEnabled: data.reminder_enabled };
    } catch (error) {
      console.error('Error updating reminder enabled:', error);
      throw error;
    }
  };

  const updateReminderSettings = async (reminderSettings) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ reminder_settings: reminderSettings })
        .eq('id', user.id)
        .select()
        .maybeSingle();

      if (error) throw error;

      setUser(data);
      return { success: true, reminderSettings: data.reminder_settings };
    } catch (error) {
      console.error('Error updating reminder settings:', error);
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
        updateReminderSettings,
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
