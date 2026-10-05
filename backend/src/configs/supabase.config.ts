import { createClient } from "@supabase/supabase-js";
import { serverConfig } from "./env.config.js";

export const supabase = createClient(
    serverConfig.SUPABASE_URL,
    serverConfig.SUPABASE_PUBLISHABLE_KEY
);