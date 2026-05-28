import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, LogOut, Shield, Sliders, Palette, Heart, Bookmark, Layers, Activity, User, Bell, Sparkles, Clock, MessageCircle, UserPlus, Eye, List } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const menuItems = [
  { id: 'privacy', label: 'Profile Privacy', desc: 'Manage visibility and follow access', icon: Shield, path: '/settings/privacy' },
  { id: 'interests', label: 'Edit Interests', desc: 'Topics you care about', icon: Layers, path: '/settings/interests' },
  { id: 'feed', label: 'Feed Control', desc: 'Content preferences and sorting', icon: Sliders, path: '/settings/feed' },
  { id: 'appearance', label: 'Appearance', desc: 'Theme and display settings', icon: Palette, path: '/settings/appearance' },
  { id: 'liked', label: 'Liked Posts', desc: 'Posts you have liked', icon: Heart, path: '/settings/liked' },
  { id: 'saved', label: 'Saved Posts', desc: 'Posts you have bookmarked', icon: Bookmark, path: '/settings/saved' },
];

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [activityTab, setActivityTab] = useState('all');
  const [allPosts, setAllPosts] = useState([]);
  const [allComments, setAllComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadActivity() {
      try {
        const [postsRes, commentsRes] = await Promise.all([
          fetch('/api/posts'),
          fetch(`/api/comments/user/${user?.username}`)
        ]);
        if (postsRes.ok) setAllPosts(await postsRes.json());
        if (commentsRes.ok) setAllComments(await commentsRes.json());
      } catch {}
      setLoading(false);
    }
    if (user) loadActivity();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const myActivity = user ? [
    { type: 'posts', count: (allPosts || []).filter(p => p.username === user.username).length, label: 'Posts', icon: List },
    { type: 'likes', count: (allPosts || []).filter(p => p.likedBy?.includes(user.username)).length, label: 'Likes Given', icon: Heart },
    { type: 'comments', count: (allComments || []).filter(c => c.username === user.username).length, label: 'Comments', icon: MessageCircle },
    { type: 'followers', count: user.followers?.length || 0, label: 'Followers', icon: UserPlus },
    { type: 'following', count: user.following?.length || 0, label: 'Following', icon: Eye },
  ] : [];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', paddingBottom: '100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer', padding: '4px', marginRight: '12px', display: 'flex' }}>
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-color)' }}>Settings & Activity</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>{user?.username}</p>
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Activity Dashboard */}
        <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: '20px', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            <Activity size={16} />
            <span>ACTIVITY OVERVIEW</span>
          </div>
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>Loading activity...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {myActivity.map(item => (
                <div key={item.type} style={{ padding: '14px 10px', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                  <item.icon size={18} style={{ color: 'var(--primary-color)', marginBottom: '6px' }} />
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-color)' }}>{item.count}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{item.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settings Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {menuItems.map(item => (
            <div key={item.id} onClick={() => navigate(item.path)}
              style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 18px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', boxShadow: 'var(--card-shadow)', transition: 'all 0.2s ease' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--card-shadow-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--card-shadow)'; }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--hover-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <item.icon size={18} color="var(--primary-color)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-color)' }}>{item.label}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{item.desc}</div>
              </div>
              <ChevronRight size={18} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: '20px', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            <Clock size={16} />
            <span>RECENT ACTIVITY</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
            {['all', 'posts', 'likes', 'comments'].map(tab => (
              <button key={tab} onClick={() => setActivityTab(tab)}
                style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '20px', border: 'none', cursor: 'pointer', backgroundColor: activityTab === tab ? 'var(--primary-color)' : 'var(--hover-bg)', color: activityTab === tab ? 'white' : 'var(--text-secondary)', transition: 'all 0.15s' }}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div>
            {loading ? (
              <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
            ) : (
              <>
                {activityTab === 'all' || activityTab === 'posts' ? (
                  (allPosts || []).filter(p => p.username === user?.username).slice(0, 3).map(p => (
                    <div key={p._id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)', fontSize: '13px', color: 'var(--text-color)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Posted:</span> {p.title || p.content?.slice(0, 60)}{p.content?.length > 60 ? '...' : ''}
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{new Date(p.createdAt).toLocaleDateString()}</div>
                    </div>
                  ))
                ) : null}
                {activityTab === 'all' || activityTab === 'likes' ? (
                  (allPosts || []).filter(p => p.likedBy?.includes(user?.username)).slice(0, 3).map(p => (
                    <div key={p._id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)', fontSize: '13px', color: 'var(--text-color)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Liked:</span> {p.content?.slice(0, 60) || 'a post'}{p.content?.length > 60 ? '...' : ''}
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{p.username}</div>
                    </div>
                  ))
                ) : null}
                {activityTab === 'all' || activityTab === 'comments' ? (
                  (allComments || []).filter(c => c.username === user?.username).slice(0, 3).map(c => (
                    <div key={c._id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)', fontSize: '13px', color: 'var(--text-color)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Commented:</span> {c.content?.slice(0, 60)}{c.content?.length > 60 ? '...' : ''}
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{new Date(c.createdAt).toLocaleDateString()}</div>
                    </div>
                  ))
                ) : null}
                {(!allPosts || allPosts.length === 0) && (!allComments || allComments.length === 0) && (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>No activity yet</div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Log Out */}
        <button onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '14px', backgroundColor: 'transparent', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', color: '#ef4444', fontWeight: 600, fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s' }}>
          <LogOut size={18} />
          Log Out
        </button>
      </div>
    </div>
  );
}
