import { createClient } from '@supabase/supabase-js'

// Hardcoded specifically for your project from your screenshots:
const supabaseUrl = 'https://dpgpeixajbrsnlkkjrtz.supabase.co'

// You must paste your real Anon Key here from your Settings -> API screenshot
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwZ3BlaXhhamJyc25sa2tqcnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzODM4MDMsImV4cCI6MjA4Nzk1OTgwM30.u2bUuLouEs36sBdUWI9wBIz__2OqRvt0jQ9nk2T6G8A'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)