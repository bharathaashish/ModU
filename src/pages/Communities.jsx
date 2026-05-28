import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Users, Plus, ChevronRight, Globe, Lock } from 'lucide-react';
import CreateCommunity from './CreateCommunity';

export default function Communities() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/communities');
        if (res.ok) setCommunities(await res.json());
      } catch {}
      setLoading(false);
    })();
  }, []);

  const handleSearch = async (q) => {
    setSearchQuery(q);
    try {
      if (!q.trim()) {
        const res = await fetch('/api/communities');
        if (res.ok) setCommunities(await res.json());
        return;
      }
      const res = await fetch(`/api/communities/search?q=${encodeURIComponent(q)}`);
      if (res.ok) setCommunities(await res.json());
    } catch {}
  };

  const handleJoin = async (e, communityId) => {
    e.stopPropagation();
    if (!user) return;
    try {
      const res = await fetch(`/api/community/${communityId}/join`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
      });
      if (res.ok) {
        setCommunities(prev => prev.map(c => {
          if (c._id === communityId) {
            return { ...c, memberCount: c.memberCount + 1, members: [...(c.members || []), { username: user.username, role: 'member' }] };
          }
          return c;
        }));
      }
    } catch {}
  };

  if (showCreate) return <CreateCommunity />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <button onClick={() => navigate('/discover')} style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer', display: 'flex', padding: '4px' }}>
            <ArrowLeft size={22} />
          </button>
          <span className="page-title">Communities</span>
        </div>
        <button className="create-btn" onClick={() => setShowCreate(true)}>
          <Plus size={18} />
          <span>Create</span>
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input
          className="form-input"
          style={{ paddingLeft: '40px' }}
          placeholder="Search public communities..."
          value={searchQuery}
          onChange={e => handleSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading communities...</div>
      ) : communities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 20px', color: 'var(--text-secondary)' }}>
          <Users size={48} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-color)' }}>
            {searchQuery ? 'No communities found' : 'No communities yet'}
          </div>
          <div style={{ fontSize: '14px', marginBottom: '24px' }}>
            {searchQuery ? 'Try a different search term.' : 'Create a community and start building your network.'}
          </div>
          {!searchQuery && (
            <button className="create-btn" style={{ margin: '0 auto' }} onClick={() => setShowCreate(true)}>
              <Plus size={18} />
              <span>Create Community</span>
            </button>
          )}
        </div>
      ) : (
        <div className="card-list">
          {communities.map(c => (
            <div key={c._id} className="card-item" onClick={() => navigate(`/community/${c._id}`)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                  {c.icon || '🏠'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div className="card-item-title">{c.name}</div>
                    {c.isPrivate ? <Lock size={12} color="var(--text-secondary)" /> : <Globe size={12} color="var(--text-secondary)" />}
                  </div>
                  <div className="card-item-sub">{c.description}</div>
                  <div className="card-item-meta">
                    <Users size={12} />
                    <span>{c.memberCount} members</span>
                    <span>·</span>
                    <span>{c.channels?.length || 0} channels</span>
                  </div>
                </div>
                {user && !c.members?.some(m => m.username === user.username) && (
                  <button
                    className="btn-primary"
                    style={{ padding: '6px 16px', fontSize: '12px', flexShrink: 0 }}
                    onClick={(e) => handleJoin(e, c._id)}
                  >
                    Join
                  </button>
                )}
                <ChevronRight size={18} color="var(--text-secondary)" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
