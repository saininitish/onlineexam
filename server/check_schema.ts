import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');

async function run() {
  const { data, error } = await supabase
    .from('answers')
    .select('*')
    .limit(1);
  console.log('Answers Schema:', data);
}

run();
