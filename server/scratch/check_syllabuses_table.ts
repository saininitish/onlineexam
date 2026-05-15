import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

async function checkTable() {
    const { data, error } = await supabase
        .from('syllabuses')
        .select('*', { count: 'exact', head: true });
    
    if (error) {
        console.error('Error checking syllabuses table:', error.message);
        if (error.message.includes('does not exist')) {
            console.log('TABLE MISSING: syllabuses table needs to be created.');
        }
    } else {
        console.log('Syllabuses table exists.');
    }
}

checkTable();
