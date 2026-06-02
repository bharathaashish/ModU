import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Plus, X, Search, UserCheck, UserX } from 'lucide-react';
import Avatar from '../components/Avatar';

export default function CloseFriends() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [closeFriends, setCloseFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch(`/api/users/${user.username}/close-friends`)
      .then(res => res.json())
      .then(setCloseFriends)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleRemove = async (targetUsername) => {
    try {
      const res = await fetch(`/api/users/${user.username}/close-friends/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUsername })
      });
      if (res.ok) {
        const updated = await res.json();
        setCloseFriends(updated);
      }
    } catch (err) {
      console.error('Remove close friend error:', err);
    }
  };

  const handleAdd = async (targetUsername) => {
    try {
      const res = await fetch(`/api/users/${user.username}/close-friends/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUsername })
      });
      if (res.ok) {
        const updated = await res.json();
        setCloseFriends(updated);
        setCandidates(prev => prev.filter(c => c.username !== targetUsername));
      }
    } catch (err) {
      console.error('Add close friend error:', err);
    }
  };

  const openAdd = async () => {
    setShowAdd(true);
    setSearchQuery('');
    setCandidatesLoading(true);
    try {
      const res = await fetch(`/api/users/${user.username}/close-friends`);
      const current = await res.json();
      const currentSet = new Set(current.map(c => c.username));
      const existingUsernames = [...currentSet];
      // Fetch followers + following as eligible candidates
      const userRes = await fetch(`/api/users/${user.username}?currentUsername=${user.username}`);
      const userData = await userRes.json();
      const connections = new Set([
        ...(userData?.followers || []),
        ...(userData?.following || [])
      ]);
      // Remove current close friends
      existingUsernames.forEach(u => connections.delete(u));
      connections.delete(user.username);
      const candidateList = await fetch(`/api/users?currentUsername=${user.username}`);
      const allUsers = await candidateList.json();
      const allUsersArr = Object.values(allUsers);
      const eligible = allUsersArr.filter(u => connections.has(u.username));
      setCandidates(eligible);
    } catch (err) {
      console.error('Fetch candidates error:', err);
    }
    setCandidatesLoading(false);
  };

  const filteredCandidates = candidates.filter(c =>
    c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', paddingBottom: '100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer', padding: '4px', marginRight: '12px', display: 'flex' }}>
          <ArrowLeft size={22} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-color)' }}>Close Friends</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>Only you can see this list</p>
        </div>
      </div>

      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Info card */}
        <div style={{ padding: '14px 16px', backgroundColor: 'var(--hover-bg)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          Close friends can see stories you share with them. Your list is completely private — nobody knows who's on it.
        </div>

        {/* Current close friends */}
        <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-color)' }}>
              Close Friends ({closeFriends.length})
            </span>
            <button onClick={openAdd}
              style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Plus size={14} /> Add
            </button>
          </div>
          <div style={{ padding: '8px' }}>
            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>Loading...</div>
            ) : closeFriends.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-color)', fontWeight: 500, marginBottom: '4px' }}>No close friends yet</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Add your first close friend to share stories privately.</div>
              </div>
            ) : (
              closeFriends.map(cf => (
                <div key={cf.username}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: 'var(--radius-sm)', transition: 'background-color 0.15s' }}>
                  <Avatar username={cf.username} image={cf.profilePhoto} size={42} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-color)' }}>{cf.name || cf.username}</div>
                    {cf.name && <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>@{cf.username}</div>}
                  </div>
                  <button onClick={() => handleRemove(cf.username)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <X size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '16px', padding: '20px', maxWidth: '420px', width: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--text-color)' }}>Add Close Friend</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search followers..."
                style={{ width: '100%', padding: '10px 12px 10px 36px', backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-color)', fontSize: '14px', outline: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              {candidatesLoading ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>Loading...</div>
              ) : filteredCandidates.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  {searchQuery ? 'No matching users found' : 'No eligible users. Follow more people to add close friends.'}
                </div>
              ) : (
                filteredCandidates.map(c => (
                  <div key={c.username}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <Avatar username={c.username} image={c.profilePhoto} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text-color)' }}>{c.name || c.username}</div>
                      {c.name && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>@{c.username}</div>}
                    </div>
                    <button onClick={() => handleAdd(c.username)}
                      style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '8px', border: 'none', background: 'var(--primary-color)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <UserCheck size={14} /> Add
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
