import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkAttemptsSchema() {
  console.log('Checking attempts table schema...');
  const { data, error } = await supabase
    .from('attempts')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching attempts:', error);
  } else if (data && data.length > 0) {
    console.log('Columns in attempts table:', Object.keys(data[0]));
    // We can't see the type easily, but if it fails with float, it's integer.
  } else {
    console.log('No attempts found.');
  }
  
  // Let's also check tests table again for marks columns
  const { data: tests } = await supabase.from('tests').select('*').limit(1);
  if (tests && tests.length > 0) {
      console.log('Tests columns:', Object.keys(tests[0]));
  }
}

checkAttemptsSchema();
