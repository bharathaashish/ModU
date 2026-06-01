import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Ban, UserX, Search } from 'lucide-react';
import Avatar from '../components/Avatar';

export default function BlockedUsers() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBlocked = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/users/${user.username}/blocked`);
      if (res.ok) {
        const data = await res.json();
        // Fetch full user info for each blocked user
        const usersWithInfo = await Promise.all(
          data.map(async (b) => {
            try {
              const uRes = await fetch(`/api/users/${b.username}`);
              if (uRes.ok) {
                const uData = await uRes.json();
                return { ...b, name: uData.name, bio: uData.bio, profilePhoto: uData.profilePhoto };
              }
            } catch {}
            return { ...b, name: b.username };
          })
        );
        setBlockedUsers(usersWithInfo);
      }
    } catch (err) {
      console.error('Failed to fetch blocked users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBlocked(); }, [user]);

  const handleUnblock = async (targetUsername) => {
    try {
      const res = await fetch(`/api/users/${user.username}/unblock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUsername })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        updateUser(updatedUser);
        setBlockedUsers(prev => prev.filter(b => b.username !== targetUsername));
      }
    } catch (err) {
      console.error('Unblock error:', err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', paddingBottom: '100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
        <button onClick={() => navigate('/settings')} style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer', padding: '4px', marginRight: '12px', display: 'flex' }}>
          <ArrowLeft size={22} />
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-color)' }}>Blocked Users</h1>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 16px' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
          Blocked users cannot view your profile, posts, stories, or contact you. You will not see their content anywhere on ModU.
        </p>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
        ) : blockedUsers.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--hover-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Ban size={28} style={{ opacity: 0.5 }} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-color)', marginBottom: '6px' }}>No blocked users</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>You haven't blocked anyone yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {blockedUsers.map((blocked) => (
              <div key={blocked.username} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                <Avatar username={blocked.username} image={blocked.profilePhoto} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-color)' }}>{blocked.name || blocked.username}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>@{blocked.username}</div>
                </div>
                <button onClick={() => handleUnblock(blocked.username)}
                  style={{ padding: '7px 16px', fontSize: '12px', fontWeight: 600, borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-color)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
