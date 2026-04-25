import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');

async function test() {
  const { data, error } = await supabase
    .from('attempts')
    .select('*')
    .limit(10);
  console.log('Attempts:', data);
  console.log('Error:', error);
}

test();
