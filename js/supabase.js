<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
  const SUPABASE_URL = "https://uqffsnrhasfqfcswkncf.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZmZzbnJoYXNmcWZjc3drbmNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NzgyMDcsImV4cCI6MjA4NTE1NDIwN30.qVcKz8PuuEOBsObidm7Phmx-pw8iitYkH3Hzyc_E9Ak";

  window.supabase = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
</script>
