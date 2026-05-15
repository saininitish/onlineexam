import { supabase } from "./src/config/supabase.js";
const { data, error } = await supabase.from("users").select("email").limit(5);
console.log("Users in DB:", data);
console.log("Error:", error);
process.exit(0);
