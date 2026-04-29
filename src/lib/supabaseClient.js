import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Read-only dashboard client. Configure Supabase RLS policies before exposing data publicly.
export const supabase = createClient(supabaseUrl, supabaseKey);
