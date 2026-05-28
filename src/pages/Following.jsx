import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';

export default function Following() {
  const navigate = useNavigate();
  const { username } = useParams();
  const { user, updateUser } = useAuth();
  
  const [followingList, setFollowingList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowing = async () => {
      try {
        const res = await fetch(`/api/users/${username}`);
        if (res.ok) {
          const targetUser = await res.json();
          
          const followingUsers = await Promise.all(
            (targetUser.following || []).map(async (followUsername) => {
              try {
                const userRes = await fetch(`/api/users/${followUsername}`);
                if (userRes.ok) {
                  const followedUser = await userRes.json();
                  return { username: followUsername, ...followedUser };
                }
              } catch (e) {
                console.error(`Failed to fetch ${followUsername}:`, e);
              }
              return null;
            })
          );
          
          const following = followingUsers.filter(u => u && u.username !== user.username);
          setFollowingList(following);
        }
      } catch (err) {
        console.error('Following fetch error', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowing();
  }, [username, user]);

  if (loading) {
    return <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>;
  }

  return (
    <div className="app-container" style={{ padding: '16px', justifyContent: 'flex-start', minHeight: 'calc(100vh - 120px)' }}>
      {/* Back Header */}
      <div style={{ padding: '16px 0', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-color)' }}>
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ margin: 0, fontWeight: 600, fontSize: '18px', color: 'var(--text-color)' }}>Following</h2>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '600px' }}>
        {followingList.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '64px 20px' }}>
            <h3>Not following anyone</h3>
          </div>
        ) : (
          followingList.map((member) => (
            <div key={member.username} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', backgroundColor: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', cursor: 'pointer' }} onClick={() => navigate(`/profile/${member.username}`)}>
              <Avatar username={member?.username} size={48} onClick={() => navigate(`/profile/${member?.username}`)} />
              <div style={{ flex: 1 }}>
                {member.name && <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{member.name}</div>}
                <div style={{ fontWeight: 600, color: 'var(--text-color)' }}>{member.username}</div>
                {member.bio && !member.name && <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{member.bio}</div>}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (member.username === user?.username) return;
                    try {
                      const res = await fetch(`/api/users/${user.username}/follow`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ targetUsername: member.username })
                      });
                      if (res.ok) {
                        const updatedUser = await res.json();
                        updateUser(updatedUser);
                      }
                    } catch (err) {
                      console.error('Follow error', err);
                    }
                  }}
                  style={{
                    padding: '4px 12px',
                    backgroundColor: user?.following?.includes(member.username) ? 'var(--border-color)' : 'var(--primary-color)',
                    border: 'none',
                    borderRadius: '6px',
                    color: user?.following?.includes(member.username) ? 'var(--text-secondary)' : 'white',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  {user?.following?.includes(member.username) ? 'Following' : 'Follow'}
                </button>
                <button onClick={() => navigate(`/messages/${member.username}`)} style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <MessageCircle size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
