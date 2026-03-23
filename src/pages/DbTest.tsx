import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/apiClient';
import { API_BASE_URL } from '@/lib/apiConfig';

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
      const apiUrl = API_BASE_URL;
      addResult(`Environment check:`);
      addResult(`  API Base URL: ${apiUrl ? `✅ ${apiUrl}` : '❌ Missing'}`);

      if (!apiUrl) {
        addResult('VITE_API_BASE_URL environment variable is not set!', true);
        setLoading(false);
        return;
      }

      try {
        // Test 1: General health
        addResult('\n1. Testing general API health...');
        try {
          const health = await apiGet<{ status: string }>('/health/');
          addResult(`API health: ${health?.status ?? 'ok'}`);
        } catch (err: any) {
          addResult(`API health check failed: ${err.message}`, true);
        }

        // Test 2: Database health
        addResult('\n2. Testing database connectivity...');
        try {
          const dbHealth = await apiGet<{ status: string; database?: string }>('/health/db/');
          addResult(`Database health: ${dbHealth?.status ?? 'ok'} — ${dbHealth?.database ?? ''}`);
        } catch (err: any) {
          addResult(`Database health check failed: ${err.message}`, true);
        }

        // Test 3: Auth health / token check
        addResult('\n3. Testing auth endpoint...');
        const token =
          localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
        addResult(`  JWT token in storage: ${token ? '✅ Present' : '⚠️  Not found (not logged in?)'}`);
        try {
          const authHealth = await apiGet<{ status: string; user?: string }>('/health/auth/');
          addResult(`Auth health: ${authHealth?.status ?? 'ok'}`);
          if (authHealth?.user) addResult(`  Authenticated as: ${authHealth.user}`);
        } catch (err: any) {
          addResult(`Auth health check failed: ${err.message}`, true);
        }

        // Test 4: Users endpoint
        addResult('\n4. Testing users API...');
        try {
          const users = await apiGet<any>('/users/?limit=5');
          const count = Array.isArray(users)
            ? users.length
            : (users as any)?.results?.length ?? (users as any)?.count ?? 0;
          addResult(`Users endpoint reachable. Returned ${count} record(s).`);
        } catch (err: any) {
          addResult(`Users endpoint failed: ${err.message}`, true);
        }

        // Test 5: Posts endpoint
        addResult('\n5. Testing posts API...');
        try {
          const posts = await apiGet<any>('/posts/?limit=5');
          const count = Array.isArray(posts)
            ? posts.length
            : (posts as any)?.results?.length ?? (posts as any)?.count ?? 0;
          addResult(`Posts endpoint reachable. Returned ${count} record(s).`);
        } catch (err: any) {
          addResult(`Posts endpoint failed: ${err.message}`, true);
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
        <h1 className="text-2xl font-bold mb-4">Backend Connection Test</h1>
        {loading && <p className="text-muted-foreground mb-4">Running tests...</p>}
        <div className="bg-card border rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
          {results.length === 0 ? 'Running tests...' : results.join('\n')}
        </div>
      </div>
    </div>
  );
}
