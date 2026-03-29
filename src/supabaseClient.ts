import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

export const supabase = supabaseUrl && supabaseAnonKey && isValidUrl(supabaseUrl) && supabaseUrl !== 'YOUR_SUPABASE_URL'
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
