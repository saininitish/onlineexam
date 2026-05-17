import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');

async function run() {
  console.log('Attempting RPC exec_sql...');
  const { data, error } = await supabase.rpc('exec_sql', { sql: "ALTER TABLE tests ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id);" });
  console.log('RPC Data:', data);
  console.log('RPC Error:', error);
}

run();
