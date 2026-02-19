import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

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

// Send verification email via Supabase Auth
export const sendVerificationEmail = async (email) => {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Error sending verification email:', err);
    throw err;
  }
};

// Verify email token — handled automatically by Supabase via /auth/callback
export const verifyEmail = async () => {
  // Supabase handles email verification automatically via the magic link redirect.
  // No manual token verification needed.
  return { success: true };
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

// Upload user avatar to Supabase Storage and update avatar_url in users table
export const uploadAvatar = async (file, userId) => {
  if (!supabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const ext = file.name.split('.').pop();
  const filePath = `${userId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  const { error: updateError } = await supabase
    .from('users')
    .update({ avatar_url: publicUrl })
    .eq('auth_user_id', userId);

  if (updateError) throw updateError;

  return publicUrl;
};

export { supabase, supabaseConfigured };
