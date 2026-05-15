import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking questions table schema...');
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching questions:', error);
  } else if (data && data.length > 0) {
    console.log('Columns in questions table:', Object.keys(data[0]));
  } else {
    console.log('No questions found to check columns.');
  }

  console.log('\nChecking tests table schema...');
  const { data: testData, error: testError } = await supabase
    .from('tests')
    .select('*')
    .limit(1);

  if (testError) {
    console.error('Error fetching tests:', testError);
  } else if (testData && testData.length > 0) {
    console.log('Columns in tests table:', Object.keys(testData[0]));
  } else {
    console.log('No tests found to check columns.');
  }
}

checkSchema();
