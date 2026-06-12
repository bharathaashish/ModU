import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, LogOut, Shield, Sliders, Palette, Heart, Bookmark, Layers, Activity, MessageCircle, UserPlus, Eye, List, Ban, Users, Clock, Trash2, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const menuItems = [
  { id: 'close-friends', label: 'Close Friends', desc: 'Stories visible only to your closest connections', icon: Users, path: '/settings/close-friends' },
  { id: 'privacy', label: 'Profile Privacy', desc: 'Manage visibility and follow access', icon: Shield, path: '/settings/privacy' },
  { id: 'interests', label: 'Edit Interests', desc: 'Topics you care about', icon: Layers, path: '/settings/interests' },
  { id: 'feed', label: 'Feed Control', desc: 'Content preferences and sorting', icon: Sliders, path: '/settings/feed' },
  { id: 'appearance', label: 'Appearance', desc: 'Theme and display settings', icon: Palette, path: '/settings/appearance' },
  { id: 'blocked', label: 'Blocked Users', desc: 'Manage blocked accounts', icon: Ban, path: '/settings/blocked' },
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

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

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== user?.username || deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${user.username}`, { method: 'DELETE' });
      if (res.ok) {
        logout();
        navigate('/login');
      }
    } catch {
      setDeleting(false);
    }
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

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Activity Overview */}
        <div style={{ padding: '20px 16px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            <Activity size={16} />
            <span>ACTIVITY</span>
          </div>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}><div style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid var(--border-color)', borderTopColor: 'var(--text-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
              {myActivity.map(item => (
                <div key={item.type} style={{ padding: '12px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-color)' }}>{item.count}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{item.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0 16px' }} />

        {/* Settings List */}
        <div style={{ padding: '8px 0' }}>
          {menuItems.map((item, index) => (
            <div key={item.id}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 16px',
                cursor: 'pointer',
                transition: 'background-color 0.15s',
                borderBottom: index < menuItems.length - 1 ? '1px solid var(--border-color)' : 'none',
                margin: '0 16px'
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--surface-alt)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
              <item.icon size={20} color="var(--text-color)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-color)' }}>{item.label}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1px' }}>{item.desc}</div>
              </div>
              <ChevronRight size={18} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
            </div>
          ))}
        </div>

        <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0 16px' }} />

        {/* Recent Activity */}
        <div style={{ padding: '20px 16px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            <Clock size={16} />
            <span>RECENT ACTIVITY</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
            {['all', 'posts', 'likes', 'comments'].map(tab => (
              <button key={tab} onClick={() => setActivityTab(tab)}
                style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '20px', border: 'none', cursor: 'pointer', backgroundColor: activityTab === tab ? 'var(--text-color)' : 'var(--surface-alt)', color: activityTab === tab ? 'var(--active-text)' : 'var(--text-secondary)', transition: 'all 0.15s' }}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}><div style={{ display: 'inline-block', width: '24px', height: '24px', border: '2px solid var(--border-color)', borderTopColor: 'var(--text-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /></div>
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
        <div style={{ padding: '16px' }}>
          <button onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '14px', backgroundColor: 'transparent', border: 'none', color: 'var(--text-color)', fontWeight: 600, fontSize: '15px', cursor: 'pointer' }}>
            <LogOut size={18} />
            Log Out
          </button>
        </div>

        {/* Delete Account */}
        <div style={{ padding: '0 16px 24px' }}>
          <button onClick={() => setShowDeleteModal(true)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '14px', backgroundColor: 'transparent', border: '1.5px solid #e53935', borderRadius: '8px', color: '#e53935', fontWeight: 600, fontSize: '15px', cursor: 'pointer' }}>
            <Trash2 size={18} />
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => { if (!deleting) setShowDeleteModal(false) }}>
          <div style={{ maxWidth: '400px', width: '100%', backgroundColor: 'var(--card-bg)', borderRadius: '12px', padding: '24px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={22} color="#e53935" />
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text-color)' }}>Delete Account</h3>
              </div>
              <button onClick={() => setShowDeleteModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', display: deleting ? 'none' : 'block' }}>
                <X size={20} />
              </button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5', margin: '0 0 12px' }}>
              This will permanently delete your account and all associated data — posts, comments, messages, followers, and more. This action cannot be undone.
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 16px' }}>
              Type <strong style={{ color: 'var(--text-color)' }}>{user?.username}</strong> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder="Enter your username"
              style={{ width: '100%', padding: '12px 14px', backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-color)', fontSize: '14px', outline: 'none', fontFamily: 'var(--font-sans)', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); }}
                disabled={deleting}
                style={{ flex: 1, padding: '12px', backgroundColor: 'var(--surface-alt)', border: 'none', borderRadius: '8px', color: 'var(--text-color)', fontWeight: 600, fontSize: '14px', cursor: deleting ? 'not-allowed' : 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== user?.username || deleting}
                style={{ flex: 1, padding: '12px', backgroundColor: deleteConfirm === user?.username && !deleting ? '#e53935' : 'var(--border-color)', border: 'none', borderRadius: '8px', color: deleteConfirm === user?.username && !deleting ? '#fff' : 'var(--text-secondary)', fontWeight: 600, fontSize: '14px', cursor: deleteConfirm === user?.username && !deleting ? 'pointer' : 'not-allowed' }}
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
