import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');

async function check() {
  const { data, error } = await supabase.from('battles').select('*').limit(1);
  if (error) {
    console.error('Error fetching battles:', error);
  } else {
    console.log('Battles columns:', Object.keys(data[0] || {}));
  }
}
check();
