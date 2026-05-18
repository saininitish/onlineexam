import { supabase } from './src/config/supabase.js';

async function addColumn() {
  console.log('--- SUPABASE SCHEMA INSTRUCTIONS ---');
  console.log('1. Please add a column "time_spent_map" of type "jsonb" to the "attempts" table in your Supabase Dashboard.');
  console.log('   SQL command: ALTER TABLE attempts ADD COLUMN IF NOT EXISTS time_spent_map JSONB;');
  
  console.log('\n2. Please add a column "assigned_to" of type "jsonb" to the "tests" table in your Supabase Dashboard.');
  console.log('   SQL command: ALTER TABLE tests ADD COLUMN IF NOT EXISTS assigned_to JSONB;');

  console.log('\n3. [MONETIZATION & SAAS] Please add the following columns to the "users" table in your Supabase Dashboard:');
  console.log('   SQL command:');
  console.log(`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 500,
    ADD COLUMN IF NOT EXISTS gems INTEGER DEFAULT 20,
    ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'Challenger',
    ADD COLUMN IF NOT EXISTS battle_pass TEXT DEFAULT 'Free',
    ADD COLUMN IF NOT EXISTS last_claim_date TEXT,
    ADD COLUMN IF NOT EXISTS referral_code TEXT,
    ADD COLUMN IF NOT EXISTS referred_by TEXT,
    ADD COLUMN IF NOT EXISTS mock_purchases JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS tournament_entries JSONB DEFAULT '[]'::jsonb;
  `);
  console.log('\nNote: If these columns are not added to Supabase, the backend will automatically use a local JSON fallback (saas_profiles.json) so your app works flawlessly!');
}

addColumn();
