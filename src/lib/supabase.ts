import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

type SupabaseClientLike = {
  from: (table: string) => any;
  rpc: (fn: string, args?: Record<string, unknown>) => any;
  channel: (topic: string, opts?: Record<string, unknown>) => any;
  removeChannel: (channel: any) => Promise<unknown>;
};

export const supabase = isSupabaseConfigured
  ? (createClient(supabaseUrl!, supabaseAnonKey!) as unknown as SupabaseClientLike)
  : null;
