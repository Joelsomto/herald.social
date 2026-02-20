import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function DbTest() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string, isError = false) => {
    setResults(prev => [...prev, `${isError ? '❌' : '✅'} ${message}`]);
  };

  useEffect(() => {
    const testConnection = async () => {
      setLoading(true);
      setResults([]);
      
      // Check env vars
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      addResult(`Environment check:`);
      addResult(`  URL: ${url ? '✅ Set' : '❌ Missing'}`);
      addResult(`  Key: ${key ? '✅ Set' : '❌ Missing'}`);
      
      if (!url || !key) {
        addResult('Environment variables not loaded!', true);
        setLoading(false);
        return;
      }

      try {
        // Test 1: Basic connection
        addResult('\n1. Testing basic connection...');
        const { error: healthError } = await supabase
          .from('profiles')
          .select('count')
          .limit(1);
        
        if (healthError) {
          addResult(`Connection failed: ${healthError.message}`, true);
          addResult(`Error code: ${healthError.code || 'N/A'}`, true);
          addResult(`Error details: ${JSON.stringify(healthError)}`, true);
        } else {
          addResult('Basic connection successful');
        }

        // Test 2: Fetch profiles
        addResult('\n2. Testing profiles table...');
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .limit(5);
        
        if (profilesError) {
          addResult(`Profiles query failed: ${profilesError.message}`, true);
          addResult(`Error code: ${profilesError.code || 'N/A'}`, true);
          addResult(`Error hint: ${profilesError.hint || 'N/A'}`, true);
        } else {
          addResult(`Profiles query successful. Found ${profiles?.length || 0} profiles`);
        }

        // Test 3: Fetch posts
        addResult('\n3. Testing posts table...');
        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .limit(5);
        
        if (postsError) {
          addResult(`Posts query failed: ${postsError.message}`, true);
          addResult(`Error code: ${postsError.code || 'N/A'}`, true);
        } else {
          addResult(`Posts query successful. Found ${posts?.length || 0} posts`);
        }

        // Test 4: Check auth
        addResult('\n4. Testing auth...');
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          addResult(`Auth check failed: ${authError.message}`, true);
        } else {
          addResult(`Auth check successful. Session: ${session ? 'Active' : 'None'}`);
        }

        // Test 5: Explain users table
        addResult('\n5. Important: Users Table Info...');
        addResult('ℹ️  User Table Information:');
        addResult('   - Supabase Auth uses: auth.users (in auth schema)');
        addResult('   - "user" (singular) view may exist in Supabase dashboard');
        addResult('   - "users" (plural) table does NOT exist');
        addResult('   - Use profiles table in app: SELECT * FROM profiles');
        addResult('   - To get auth users: supabase.auth.getUser()');
        
        // Test if user view exists
        addResult('\n6. Testing user view (if available)...');
        const { data: userViewData, error: userViewError } = await supabase
          .from('user')
          .select('count')
          .limit(1);
        
        if (userViewError) {
          addResult(`   "user" view not accessible via client: ${userViewError.message}`);
          addResult('   (May be available in Supabase SQL editor only)');
        } else {
          addResult('   ✅ "user" view is accessible');
        }
        
        // Test 7: Show correct way to query user data
        addResult('\n7. Querying user data correctly...');
        const { data: userProfiles, error: userProfilesError } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, created_at')
          .limit(5);
        
        if (userProfilesError) {
          addResult(`Error querying profiles: ${userProfilesError.message}`, true);
        } else {
          addResult(`✅ Found ${userProfiles?.length || 0} profiles`);
          addResult('   Use: SELECT * FROM profiles (not users)');
        }

      } catch (error: any) {
        addResult(`Unexpected error: ${error.message}`, true);
        addResult(`Stack: ${error.stack}`, true);
      }
      
      setLoading(false);
    };

    testConnection();
  }, []);

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Database Connection Test</h1>
        {loading && <p className="text-muted-foreground mb-4">Testing...</p>}
        <div className="bg-card border rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
          {results.length === 0 ? 'Running tests...' : results.join('\n')}
        </div>
      </div>
    </div>
  );
}
