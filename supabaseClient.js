import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const supabase = createClient(
  "https://lnjaexmtlgddiunudarh.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuamFleG10bGdkZGl1bnVkYXJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MzY1OTksImV4cCI6MjA4NTQxMjU5OX0.v358gx2x-DSdVEnL5jo4d4bxpgNZ3MX6VQcnEDQiuFk"
);
