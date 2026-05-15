import dotenv from 'dotenv';
dotenv.config();
import { supabase } from './src/config/supabase.js';

async function listColumns() {
  const { data, error } = await supabase
    .from('answers')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error fetching answers:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('Columns in answers table:', Object.keys(data[0]));
  } else {
    console.log('Answers table is empty.');
  }
}

listColumns();
