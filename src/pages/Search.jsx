import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search as SearchIcon, X, Clock, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';

export default function Search() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    fetchRecentSearches();
  }, []);

  const fetchRecentSearches = async () => {
    try {
      const res = await fetch(`/api/users/${user.username}/search/recent`);
      if (res.ok) {
        const data = await res.json();
        setRecentSearches(data);
      }
    } catch (err) {
      console.error('Failed to fetch recent searches', err);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!term.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setSearched(true);
      try {
        const url = `/api/users/search?q=${encodeURIComponent(term.trim())}&currentUsername=${encodeURIComponent(user?.username || '')}`;
        console.log(`[Search] fetching: ${url}`);
        const res = await fetch(url);
        console.log(`[Search] response status: ${res.status}`);
        if (res.ok) {
          const data = await res.json();
          console.log(`[Search] received ${data.length} users`);
          setResults(data.filter(u => u.username !== user?.username));
        } else {
          const errText = await res.text();
          console.error(`[Search] request failed: ${errText}`);
        }
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setLoading(false);
      }
    }, 200);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setResults([]);
    setSearched(false);
    inputRef.current?.focus();
  };

  const saveRecentSearch = async (targetUsername, targetName) => {
    try {
      await fetch(`/api/users/${user.username}/search/recent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUsername, targetName })
      });
      fetchRecentSearches();
    } catch (err) {
      console.error('Failed to save recent search', err);
    }
  };

  const removeRecentSearch = async (targetUsername, e) => {
    e.stopPropagation();
    try {
      await fetch(`/api/users/${user.username}/search/recent/${targetUsername}`, {
        method: 'DELETE'
      });
      setRecentSearches(prev => prev.filter(s => s.username !== targetUsername));
    } catch (err) {
      console.error('Failed to remove recent search', err);
    }
  };

  const clearAllRecent = async () => {
    try {
      await fetch(`/api/users/${user.username}/search/recent`, {
        method: 'DELETE'
      });
      setRecentSearches([]);
    } catch (err) {
      console.error('Failed to clear recent searches', err);
    }
  };

  const handleUserClick = (u) => {
    saveRecentSearch(u.username, u.name || '');
    navigate(`/profile/${u.username}`);
  };

  const handleFollow = async (targetUsername, e) => {
    e.stopPropagation();
    if (targetUsername === user?.username || !user) return;
    try {
      const res = await fetch(`/api/users/${user.username}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUsername })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        updateUser(updatedUser);
        // Toggle the local hasPendingRequest flag
        setResults(prev => prev.map(u =>
          u.username === targetUsername
            ? { ...u, hasPendingRequest: !u.hasPendingRequest }
            : u
        ));
      }
    } catch (err) {
      console.error('Follow error', err);
    }
  };

  const isSearching = searchTerm.trim().length > 0;

  return (
    <div className="app-container" style={{ padding: '16px', justifyContent: 'flex-start', minHeight: 'calc(100vh - 120px)' }}>
      {/* Search Bar */}
      <div style={{ marginBottom: '16px', width: '100%', maxWidth: '600px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', backgroundColor: 'var(--card-bg)', borderRadius: '12px', padding: '12px 16px', border: '1px solid var(--border-color)' }}>
          <SearchIcon size={20} color="var(--text-secondary)" style={{ marginRight: '12px', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search users"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              background: 'none', border: 'none', outline: 'none', flex: 1, color: 'var(--text-color)', fontSize: '16px'
            }}
          />
          {searchTerm && (
            <button onClick={clearSearch} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Recent Searches Section (shown when not searching) */}
      {!isSearching && (
        <div style={{ width: '100%', maxWidth: '600px' }}>
          {recentSearches.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-color)', margin: 0 }}>Recent</h3>
              <button
                onClick={clearAllRecent}
                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '14px', cursor: 'pointer', fontWeight: 500 }}
              >
                Clear all
              </button>
            </div>
          )}

          {recentSearches.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '64px 20px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid var(--border-color)', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 16px' }}>
                <SearchIcon size={32} color="var(--text-secondary)" />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-color)', marginBottom: '8px' }}>Search users</h3>
              <p style={{ fontSize: '14px', maxWidth: '280px', margin: '0 auto' }}>Find people and see their profiles.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              {recentSearches.map((s, i) => (
                <div
                  key={s.username || i}
                  onClick={() => handleUserClick(s)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                    backgroundColor: 'var(--card-bg)', cursor: 'pointer', borderBottom: i < recentSearches.length - 1 ? '1px solid var(--border-color)' : 'none'
                  }}
                >
                  <Clock size={18} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                  <Avatar username={s?.username} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-color)', fontSize: '14px' }}>{s.username}</div>
                  </div>
                  <button
                    onClick={(e) => removeRecentSearch(s.username, e)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search Results (shown when actively searching) */}
      {isSearching && (
        <div style={{ width: '100%', maxWidth: '600px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px' }}>Searching...</div>
          ) : results.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '64px 20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-color)', marginBottom: '8px' }}>No results found</h3>
              <p style={{ fontSize: '14px' }}>Try a different search term</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              {results.map((u, i) => (
                <div
                  key={u._id || i}
                  onClick={() => handleUserClick(u)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                    backgroundColor: 'var(--card-bg)', cursor: 'pointer',
                    borderBottom: i < results.length - 1 ? '1px solid var(--border-color)' : 'none'
                  }}
                >
                  <Avatar username={u?.username} size={44} onClick={() => navigate(`/profile/${u?.username}`)} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-color)', fontSize: '14px' }}>{u.username}</div>
                  </div>
                  <button
                    onClick={(e) => handleFollow(u.username, e)}
                    style={{
                      padding: '6px 16px', backgroundColor: (user?.following?.includes(u.username) || u.hasPendingRequest) ? 'var(--border-color)' : 'var(--primary-color)',
                      border: 'none', borderRadius: '8px', color: (user?.following?.includes(u.username) || u.hasPendingRequest) ? 'var(--text-secondary)' : 'white',
                      fontWeight: 600, fontSize: '13px', cursor: (user?.following?.includes(u.username) || u.hasPendingRequest) ? 'default' : 'pointer', flexShrink: 0
                    }}
                  >
                    {user?.following?.includes(u.username) ? 'Following' : (u.hasPendingRequest ? 'Requested' : 'Follow')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
