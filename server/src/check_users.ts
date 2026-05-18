import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');

async function check() {
  const { data, error } = await supabase.from('users').select('name, email, xp, coins, streak, referral_code').limit(5);
  if (error) {
    console.error('Error fetching users:', error);
  } else {
    console.log('Users found:', data);
  }
}
check();
