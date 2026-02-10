import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

let supabase = null;
let supabaseConfigured = false;

// Only initialize Supabase if both URL and key are provided
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabaseConfigured = true;
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
} else {
  console.warn('⚠️  Supabase not configured. Google OAuth will not be available.');
  console.warn('Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in .env.local');
}

// Google OAuth sign-in
export const signInWithGoogle = async () => {
  if (!supabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Please set up Google OAuth first.');
  }

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error('Error signing in with Google:', err);
    throw err;
  }
};

// Send verification email
export const sendVerificationEmail = async (email) => {
  try {
    // This should be handled by your backend after user registration
    const response = await fetch('/api/auth/send-verification-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      throw new Error('Failed to send verification email');
    }

    return await response.json();
  } catch (err) {
    console.error('Error sending verification email:', err);
    throw err;
  }
};

// Verify email token
export const verifyEmail = async (token) => {
  try {
    const response = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    if (!response.ok) {
      throw new Error('Failed to verify email');
    }

    return await response.json();
  } catch (err) {
    console.error('Error verifying email:', err);
    throw err;
  }
};

// Get current session
export const getSession = async () => {
  if (!supabaseConfigured || !supabase) {
    return null;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (err) {
    console.error('Error getting session:', err);
    return null;
  }
};

// Sign out
export const signOut = async () => {
  if (!supabaseConfigured || !supabase) {
    return;
  }

  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (err) {
    console.error('Error signing out:', err);
    throw err;
  }
};

export { supabase, supabaseConfigured };
