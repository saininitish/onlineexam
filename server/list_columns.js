import dotenv from 'dotenv';
dotenv.config();
import { supabase } from './src/config/supabase.js';

async function listColumns() {
  const { data, error } = await supabase
    .from('attempts')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error fetching attempts:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('Columns in attempts table:', Object.keys(data[0]));
  } else {
    console.log('Attempts table is empty. Cannot determine columns via select *');
  }
}

listColumns();
