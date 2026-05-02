import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function testInsert() {
  const { data: tests } = await supabase.from('tests').select('id').limit(1);
  if (!tests || tests.length === 0) {
    console.error('No tests found to perform a test insert.');
    return;
  }

  const testId = tests[0].id;
  console.log(`Using test_id: ${testId}`);

  const { error } = await supabase
    .from('questions')
    .insert({
      test_id: testId,
      question: '{"text": "Test Question"}',
      option_a: 'A',
      option_b: 'B',
      option_c: 'C',
      option_d: 'D',
      correct_answer: 'a'
    });

  if (error) {
    console.error('Insert failed! Error:', error);
  } else {
    console.log('Insert succeeded! Wait, that means there is no error?');
  }
}

testInsert();
