import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rindtqjsxoyafzovgnkp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbmR0cWpzeG95YWZ6b3ZnbmtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4Njc5ODIsImV4cCI6MjA1OTQ0Mzk4Mn0.CZ9AsZuCFzRh3u5DHb3BWzt9EVFPAEjSWlLV15nXtkA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);