import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkTriggers() {
  console.log('Checking for triggers on questions table...');
  const { data, error } = await supabase.rpc('get_triggers'); // This might not exist

  if (error) {
    // If RPC doesn't exist, try a direct query (if enabled) or just list tables
    console.log('Could not use RPC to get triggers. Trying direct SQL query if possible...');
    
    // In Supabase, we can't easily query information_schema via the JS client unless a function is exposed.
    // Let's try to just insert a dummy question and see the error.
    console.log('Attempting a dummy insert into questions to see the exact error...');
    const { error: insertError } = await supabase
      .from('questions')
      .insert({
        test_id: '00000000-0000-0000-0000-000000000000', // Invalid but might trigger the schema check
        question: 'test',
        option_a: 'a',
        option_b: 'b',
        option_c: 'c',
        option_d: 'd',
        correct_answer: 'a'
      });
    
    if (insertError) {
      console.error('Insert failed as expected. Error:', insertError);
    }
  } else {
    console.log('Triggers:', data);
  }
}

checkTriggers();
