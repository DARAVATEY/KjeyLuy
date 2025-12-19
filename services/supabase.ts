import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uunjpuuimictpkhabzww.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1bmpwdXVpbWljdHBraGFiend3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMjM4MjksImV4cCI6MjA4MTY5OTgyOX0.aG3U7rJz_ysBh843qDK25viHLsT5fgmnj_c2KVLDcws';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);