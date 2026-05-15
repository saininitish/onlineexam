import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey || supabaseKey === 'placeholder' || supabaseKey.startsWith('sb_secret')) {
  const missing = [];
  if (!supabaseUrl) missing.push('SUPABASE_URL');
  if (!supabaseKey || supabaseKey === 'placeholder' || supabaseKey.startsWith('sb_secret')) missing.push('SUPABASE_ANON_KEY (Missing or Invalid)');
  
  console.error(`❌ CRITICAL ERROR: Supabase Credentials: ${missing.join(', ')}`);
  console.log('Current URL Loaded:', supabaseUrl || 'NOT SET');
  console.log('Current Key (start):', supabaseKey ? `${supabaseKey.substring(0, 10)}...` : 'NOT SET');
} else {
  console.log('✅ Supabase initialized for project:', supabaseUrl.substring(0, 30));
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

