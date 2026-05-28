import { useAuth } from '../context/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Heart, MessageCircle, Plus, Lock, MoreHorizontal, Users, ShieldAlert, MapPin } from 'lucide-react';
import PostModal from '../components/PostModal';
import PostViewer from '../components/PostViewer';
import Avatar from '../components/Avatar';
import ConfirmModal from '../components/ConfirmModal';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { username: routeUsername } = useParams();
  const navigate = useNavigate();

  const isOwnProfile = !routeUsername || routeUsername === user?.username;
  const profileUsername = routeUsername || user?.username;

  const [profileUser, setProfileUser] = useState(isOwnProfile ? user : null);
  const [userPosts, setUserPosts] = useState([]);
  const [mutuals, setMutuals] = useState([]);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [menuPostId, setMenuPostId] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const handleDeletePost = async () => {
    if (!deleteTargetId) return;
    try {
      const res = await fetch(`/api/posts/${deleteTargetId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user?.username })
      });
      if (res.ok) {
        setUserPosts(prev => prev.filter(p => p._id !== deleteTargetId));
        setDeleteTargetId(null);
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error('Delete post failed:', res.status, errData);
        setDeleteTargetId(null);
      }
    } catch (err) {
      console.error('Delete error:', err);
      setDeleteTargetId(null);
    }
  };

  const handlePostUpdate = useCallback((updatedPost) => {
    setUserPosts(prevPosts =>
      prevPosts.map(p => p._id === updatedPost._id ? updatedPost : p)
    );
    setSelectedPost(updatedPost);
  }, []);

  const fetchProfileData = async () => {
    try {
      if (!isOwnProfile) {
        const userRes = await fetch(`/api/users/${profileUsername}`);
        if (userRes.ok) {
          const fetchedUser = await userRes.json();
          setProfileUser(fetchedUser);
        }
      } else {
        setProfileUser(user);
      }

      const postsRes = await fetch('/api/posts');
      if (postsRes.ok) {
        const allPosts = await postsRes.json();
        const posts = allPosts.filter(post => post.username === profileUsername && post.type === 'post');
        setUserPosts(posts);
      }
    } catch (err) {
      console.error('Failed to load profile data', err);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [user, showPostModal, profileUsername, isOwnProfile]);

  useEffect(() => {
    if (!isOwnProfile && profileUser && user) {
      fetch('/api/users')
        .then(res => res.json())
        .then(usersDict => {
          const allUsers = Object.values(usersDict);
          const myFollowing = user.following || [];
          const profileFollowers = profileUser.followers || [];
          const common = allUsers.filter(u =>
            u.username !== user.username &&
            u.username !== profileUsername &&
            myFollowing.includes(u.username) &&
            profileFollowers.includes(u.username)
          );
          setMutuals(common);
        })
        .catch(err => console.warn('Error fetching mutuals:', err));
    } else {
      setMutuals([]);
    }
  }, [profileUser, user, isOwnProfile, profileUsername]);

  const handleFollow = async (targetUsername) => {
    if (targetUsername === user?.username) return;
    try {
      const res = await fetch(`/api/users/${user?.username}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUsername })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        updateUser(updatedUser);
        fetchProfileData();
      }
    } catch (err) {
      console.error('Follow error', err);
    }
  };

  const isFollowing = user?.following?.includes(profileUsername);
  const isPrivate = profileUser?.isPrivate;
  const hasPendingRequest = profileUser?.followRequests?.some(r => r.fromUsername === user?.username);
  const canViewContent = isOwnProfile || !isPrivate || isFollowing;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', paddingBottom: '100px' }}>
      {/* Flat header area */}
      <div style={{ height: '100px', backgroundColor: 'var(--surface-alt)', borderBottom: '1px solid var(--border-color)' }} />

      {/* Profile card — overlapping the header */}
      <div style={{ maxWidth: '720px', margin: '-40px auto 0', padding: '0 16px', position: 'relative', zIndex: 5 }}>
        <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px 24px' }}>

          {/* Avatar + actions row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
            <div style={{ marginTop: '-52px' }}>
              <div style={{ borderRadius: '50%', padding: '3px', backgroundColor: 'var(--card-bg)', display: 'inline-block' }}>
                <Avatar username={profileUser?.username} size={72} style={{ border: '2px solid var(--border-color)' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {isOwnProfile ? (
                <>
                  <button onClick={() => navigate('/settings')} className="ghost-button">
                    Settings
                  </button>
                  <button onClick={() => navigate('/edit-profile')} className="ghost-button">
                    Edit Profile
                  </button>
                  <button onClick={() => setShowPostModal(true)} style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--primary-color)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', cursor: 'pointer', transition: 'background-color 0.15s' }}>
                    <Plus size={18} />
                  </button>
                </>
              ) : (
                <button onClick={() => handleFollow(profileUsername)} style={{ padding: '7px 20px', fontSize: '12px', fontWeight: 600, borderRadius: 'var(--radius-sm)', border: isFollowing || hasPendingRequest ? '1px solid var(--border-color)' : 'none', backgroundColor: isFollowing || hasPendingRequest ? 'transparent' : 'var(--primary-color)', color: isFollowing || hasPendingRequest ? 'var(--text-secondary)' : '#fff', cursor: 'pointer', transition: 'background-color 0.15s' }}>
                  {isFollowing ? 'Following' : (hasPendingRequest ? 'Requested' : 'Follow')}
                </button>
              )}
            </div>
          </div>

          {/* User info */}
          <div style={{ marginBottom: '16px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-color)', margin: 0 }}>{profileUser?.name || profileUsername}</h1>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>@{profileUsername}</div>
          </div>

          {/* Stats as three columns */}
          <div style={{ display: 'flex', marginBottom: '16px', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ flex: 1, padding: '12px 0', textAlign: 'center' }}>
              <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-color)' }}>{userPosts.length}</div>
              <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginTop: '2px' }}>Posts</div>
            </div>
            <div style={{ width: '1px', backgroundColor: 'var(--border-color)' }} />
            <div style={{ flex: 1, padding: '12px 0', textAlign: 'center', cursor: canViewContent ? 'pointer' : 'default' }} onClick={() => canViewContent && navigate(`/profile/${profileUsername}/followers`)}>
              <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-color)' }}>{profileUser?.followers?.length || 0}</div>
              <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginTop: '2px' }}>Followers</div>
            </div>
            <div style={{ width: '1px', backgroundColor: 'var(--border-color)' }} />
            <div style={{ flex: 1, padding: '12px 0', textAlign: 'center', cursor: canViewContent ? 'pointer' : 'default' }} onClick={() => canViewContent && navigate(`/profile/${profileUsername}/following`)}>
              <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-color)' }}>{profileUser?.following?.length || 0}</div>
              <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginTop: '2px' }}>Following</div>
            </div>
          </div>

          {/* Mutual follows */}
          {!isOwnProfile && mutuals.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', position: 'relative', height: '22px' }}>
                {mutuals.slice(0, 3).map((m, idx) => (
                  <div key={idx} style={{ marginLeft: idx > 0 ? '-10px' : 0, borderRadius: '50%', overflow: 'hidden', zIndex: 3 - idx }}>
                    <Avatar username={m.username} size={22} />
                  </div>
                ))}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Followed by {mutuals.slice(0, 2).map(m => m.name || m.username).join(', ')}
                {mutuals.length > 2 ? ` and ${mutuals.length - 2} other mutuals` : ''}
              </span>
            </div>
          )}

          {/* Bio & Details */}
          <div style={{ padding: '12px 0' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: '8px' }}>Bio</div>
            {profileUser?.bio ? (
              <div style={{ fontSize: '14px', color: 'var(--text-color)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{profileUser.bio}</div>
            ) : (
              <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No bio written yet.</div>
            )}
            <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              {profileUser?.email && profileUser?.isPrivate && (
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <ShieldAlert size={12} />
                  <span>Private Profile</span>
                </div>
              )}
            </div>
          </div>

          {/* Interests */}
          {canViewContent && profileUser?.interests && profileUser.interests.length > 0 && (
            <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: '10px' }}>Interests</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {profileUser.interests.map(interest => (
                  <span key={interest} style={{ padding: '4px 10px', borderRadius: '99px', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', fontSize: '12px', fontWeight: 500 }}>
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Posts section */}
      <div style={{ maxWidth: '720px', margin: '20px auto 0', padding: '0 16px' }}>
        {!canViewContent ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 16px' }}>
              <Lock size={22} color="var(--text-secondary)" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-color)', marginBottom: '6px' }}>This Account is Private</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '280px', margin: '0 auto' }}>Follow this user to view their posts.</p>
          </div>
        ) : userPosts.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 16px' }}>
              <Heart size={22} color="var(--text-secondary)" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-color)', marginBottom: '6px' }}>No Posts Yet</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Posts will appear here once shared.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {userPosts.map((post, idx) => (
              <div key={idx} style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s ease' }}
                onClick={() => setSelectedPost(post)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px' }}>
                  <Avatar username={post.username} size={34} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-color)' }}>{post.username}</div>
                    {post.createdAt && (
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                        {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                  {isOwnProfile && (
                    <div style={{ position: 'relative' }}>
                      <button onClick={(e) => { e.stopPropagation(); setMenuPostId(menuPostId === post._id ? null : post._id); }}
                        style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
                        <MoreHorizontal size={18} />
                      </button>
                      {menuPostId === post._id && (
                        <>
                          <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setMenuPostId(null)} />
                          <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 51, backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--elevated-shadow)', minWidth: '150px', overflow: 'hidden' }}>
                            <button onClick={(e) => { e.stopPropagation(); setMenuPostId(null); setDeleteTargetId(post._id); }}
                              style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', color: 'var(--error-color)', fontSize: '13px', cursor: 'pointer', textAlign: 'left', fontWeight: 500 }}>
                              Delete Post
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {post.content && (
                  <div style={{ padding: '0 16px 12px', fontSize: '13px', color: 'var(--text-color)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{post.content}</div>
                )}

                {post.image && (
                  <div style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
                    <img src={post.image} alt="" style={{ width: '100%', display: 'block', maxHeight: '400px', objectFit: 'cover' }} />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '16px', padding: '12px 16px', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                    <Heart size={14} />
                    <span>{post.likes || 0}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                    <MessageCircle size={14} />
                    <span>{post.comments || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isOwnProfile && (
        <PostModal isOpen={showPostModal} onClose={() => setShowPostModal(false)} onPostSuccess={() => setShowPostModal(false)} />
      )}
      <PostViewer post={selectedPost} onClose={() => setSelectedPost(null)} onLikeUpdate={handlePostUpdate} />

      {deleteTargetId && (
        <ConfirmModal
          key={deleteTargetId}
          isOpen={true}
          title="Delete Post?"
          message="Are you sure you want to delete this post? This action cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={() => handleDeletePost()}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </div>
  );
}
