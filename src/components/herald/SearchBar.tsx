import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, X, BadgeCheck, TrendingUp, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  type: 'user' | 'post' | 'trending';
  id: string;
  title: string;
  subtitle?: string;
  avatar?: string | null;
  isVerified?: boolean;
}

interface SearchBarProps {
  className?: string;
  onClose?: () => void;
}

export function SearchBar({ className = '', onClose }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('herald_recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    const search = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      const [profilesRes, postsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url, is_verified')
          .or(`display_name.ilike.%${query}%,username.ilike.%${query}%`)
          .limit(5),
        supabase
          .from('posts')
          .select('id, content')
          .ilike('content', `%${query}%`)
          .limit(3),
      ]);

      const userResults: SearchResult[] = (profilesRes.data || []).map(p => ({
        type: 'user',
        id: p.user_id,
        title: p.display_name || 'Unknown',
        subtitle: `@${p.username || 'unknown'}`,
        avatar: p.avatar_url,
        isVerified: p.is_verified,
      }));

      const postResults: SearchResult[] = (postsRes.data || []).map(p => ({
        type: 'post',
        id: p.id,
        title: p.content.substring(0, 50) + (p.content.length > 50 ? '...' : ''),
      }));

      setResults([...userResults, ...postResults]);
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    // Save to recent searches
    const updated = [result.title, ...recentSearches.filter(s => s !== result.title)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('herald_recent_searches', JSON.stringify(updated));

    if (result.type === 'user') {
      navigate(`/user/${result.subtitle?.replace('@', '')}`);
    }
    setIsOpen(false);
    setQuery('');
    onClose?.();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('herald_recent_searches', JSON.stringify(updated));
      // Could navigate to search results page
    }
  };

  const clearRecentSearch = (search: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== search);
    setRecentSearches(updated);
    localStorage.setItem('herald_recent_searches', JSON.stringify(updated));
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSearchSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search Herald..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            className="pl-10 pr-10 bg-secondary border-border rounded-full"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {isOpen && (query.length > 0 || recentSearches.length > 0) && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <Card className="absolute top-full left-0 right-0 mt-2 z-50 border-border bg-card overflow-hidden">
            {query.length === 0 && recentSearches.length > 0 && (
              <div className="p-3">
                <p className="text-xs text-muted-foreground font-medium mb-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Recent searches
                </p>
                {recentSearches.map((search, i) => (
                  <button
                    key={i}
                    onClick={() => setQuery(search)}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <span className="text-sm text-foreground">{search}</span>
                    <X 
                      className="w-3 h-3 text-muted-foreground hover:text-foreground" 
                      onClick={(e) => clearRecentSearch(search, e)}
                    />
                  </button>
                ))}
              </div>
            )}

            {query.length > 0 && results.length === 0 && (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No results found for "{query}"
              </div>
            )}

            {results.length > 0 && (
              <div className="divide-y divide-border">
                {results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors text-left"
                  >
                    {result.type === 'user' ? (
                      <>
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={result.avatar || undefined} />
                          <AvatarFallback className="bg-primary/20 text-primary font-display font-bold">
                            {result.title[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground flex items-center gap-1">
                            {result.title}
                            {result.isVerified && (
                              <BadgeCheck className="w-4 h-4 text-primary fill-primary/20" />
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">{result.subtitle}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-foreground">{result.title}</p>
                      </>
                    )}
                  </button>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
