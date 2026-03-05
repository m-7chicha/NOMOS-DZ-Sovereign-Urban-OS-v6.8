import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://inrtymnmzqkrxuftasrl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlucnR5bW5tenFrcnh1ZnRhc3JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MDA5NjMsImV4cCI6MjA4Nzk3Njk2M30.04tsyekDQTJyE0S0mz07dK1hI-MyIK0Jsgb_1L5xj-E';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  console.log('Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('urban_events').select('id').limit(1);
    if (error) {
      console.error('Connection failed. Error details:', error.message);
    } else {
      console.log('Connection successful! Supabase is reachable.');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testConnection();
