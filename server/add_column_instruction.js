import { supabase } from './src/config/supabase.js';

async function addColumn() {
  console.log('--- SUPABASE SCHEMA INSTRUCTIONS ---');
  console.log('1. Please add a column "time_spent_map" of type "jsonb" to the "attempts" table in your Supabase Dashboard.');
  console.log('   SQL command: ALTER TABLE attempts ADD COLUMN IF NOT EXISTS time_spent_map JSONB;');
  console.log('\n2. Please add a column "assigned_to" of type "jsonb" to the "tests" table in your Supabase Dashboard.');
  console.log('   SQL command: ALTER TABLE tests ADD COLUMN IF NOT EXISTS assigned_to JSONB;');
}

addColumn();
