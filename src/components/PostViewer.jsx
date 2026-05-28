import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Heart, MessageCircle, Send, Bookmark, Share2, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import ConfirmModal from '../components/ConfirmModal';

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function PostViewer({ post, onClose, onLikeUpdate, onPostUpdate }) {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [showAllComments, setShowAllComments] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const lastTapRef = useRef(0);

  const handleDeletePost = async () => {
    try {
      const res = await fetch(`/api/posts/${post._id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user?.username })
      });
      if (res.ok) {
        setShowDeleteConfirm(false);
        onClose();
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error('Delete post failed:', res.status, errData);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  useEffect(() => {
    if (post) {
      setIsLiked(post.likedBy?.includes(user?.username) || false);
      setLikeCount(post.likes || 0);
      setIsSaved(user?.savedPosts?.includes(post._id) || false);
      setComments([]);
      setShowComments(true);
      setShowAllComments(false);
      setShowShareMenu(false);
    }
  }, [post, user]);

  const fetchComments = useCallback(async (postId) => {
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (post?._id && showComments) {
      fetchComments(post._id);
    }
  }, [post?._id, showComments, fetchComments]);

  const handleLike = async () => {
    if (!user || !post) return;
    try {
      const res = await fetch(`/api/posts/${post._id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
      });
      if (res.ok) {
        const updatedPost = await res.json();
        setIsLiked(updatedPost.likedBy?.includes(user.username) || false);
        setLikeCount(updatedPost.likes || 0);
        onLikeUpdate?.(updatedPost);
        onPostUpdate?.(updatedPost);
      }
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleSave = async () => {
    if (!user || !post) return;
    try {
      const res = await fetch(`/api/posts/${post._id}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        const saved = updatedUser.savedPosts?.includes(post._id) || false;
        setIsSaved(saved);
        updateUser(updatedUser);
        if (saved) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2000);
        }
      }
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  const handleCommentLike = async (commentId) => {
    if (!user || !post) return;
    try {
      const res = await fetch(`/api/posts/${post._id}/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
      });
      if (res.ok) {
        const updatedComment = await res.json();
        setComments(prev => prev.map(c =>
          c._id === commentId ? { ...c, likes: updatedComment.likes, likedBy: updatedComment.likedBy } : c
        ));
      }
    } catch (err) {
      console.error('Comment like error:', err);
    }
  };

  const handleComment = async () => {
    if (!user || !newComment.trim() || !post) return;
    try {
      const res = await fetch(`/api/posts/${post._id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, content: newComment.trim() })
      });
      if (res.ok) {
        const comment = await res.json();
        setComments(prev => [comment, ...prev]);
        setNewComment('');
      }
    } catch (err) {
      console.error('Comment error:', err);
    }
  };

  const handleShare = async () => {
    if (!post) return;
    const shareUrl = `${window.location.origin}/post/${post._id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Check out this post on ModU', text: post.content || 'Shared post', url: shareUrl });
      } catch (err) {
        if (err.name !== 'AbortError') copyToClipboard(shareUrl);
      }
    } else {
      copyToClipboard(shareUrl);
    }
    setShowShareMenu(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  };

  if (!post) return null;

  const sortedComments = comments.slice().sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const visibleComments = showAllComments ? sortedComments : sortedComments.slice(0, 3);

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.95)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000, padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative', width: '100%', maxWidth: '935px', maxHeight: '95vh',
          backgroundColor: 'var(--bg-color)', borderRadius: '12px',
          overflow: 'hidden', display: 'flex', flexDirection: 'column'
        }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose}
          style={{
            position: 'absolute', top: '12px', right: '12px',
            background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
            width: '36px', height: '36px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', color: 'white', zIndex: 10
          }}>
          <X size={20} />
        </button>

        {/* Post Header */}
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, cursor: 'pointer' }} onClick={() => navigate(`/profile/${post.username}`)}>
            <Avatar username={post?.username} size={32} />
            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-color)' }}>{post.username}</span>
          </div>
          {post.username !== user?.username && (
            <button onClick={async () => {
              try {
                const res = await fetch(`/api/users/${user.username}/follow`, {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ targetUsername: post.username })
                });
                if (res.ok) { const updatedUser = await res.json(); updateUser(updatedUser); }
              } catch (err) { console.error('Follow error', err); }
            }}
              style={{ padding: '4px 12px', backgroundColor: user?.following?.includes(post.username) ? 'var(--border-color)' : 'var(--primary-color)', border: 'none', borderRadius: '6px', color: user?.following?.includes(post.username) ? 'var(--text-secondary)' : 'white', fontWeight: 600, fontSize: '12px', cursor: 'pointer', flexShrink: 0 }}>
              {user?.following?.includes(post.username) ? 'Following' : 'Follow'}
            </button>
          )}
          {post.username === user?.username && (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowMenu(!showMenu)} style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
                <MoreHorizontal size={20} />
              </button>
              {showMenu && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setShowMenu(false)} />
                  <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 51, backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', minWidth: '160px', overflow: 'hidden' }}>
                    <button onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }}
                      style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', color: '#ef4444', fontSize: '14px', cursor: 'pointer', textAlign: 'left', fontWeight: 500 }}>
                      Delete Post
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Post Image */}
        <div style={{ width: '100%', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', maxHeight: '50vh', position: 'relative', cursor: 'pointer' }}
          onClick={() => {
            const now = Date.now();
            const timeSince = now - lastTapRef.current;
            lastTapRef.current = now;
            if (timeSince < 300 && timeSince > 0) {
              if (!isLiked) handleLike();
              setShowHeartAnimation(true);
              setTimeout(() => setShowHeartAnimation(false), 800);
            }
          }}>
          {post.image && (
            <img src={post.image} alt="Post" style={{ width: '100%', maxHeight: '50vh', objectFit: 'contain', userSelect: 'none' }} />
          )}
          {showHeartAnimation && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 5, animation: 'heartPop 0.8s ease-out' }}>
              <Heart size={80} fill="white" color="white" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }} />
            </div>
          )}
        </div>

        {/* Engagement Row */}
        <div style={{ padding: '12px 16px', display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)' }}>
          <button onClick={handleLike} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
            <Heart size={26} style={{ color: isLiked ? '#ed4956' : 'var(--text-color)', fill: isLiked ? '#ed4956' : 'none', transition: 'all 0.2s' }} />
          </button>
          <button onClick={() => setShowComments(!showComments)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
            <MessageCircle size={26} style={{ color: showComments ? 'var(--primary-color)' : 'var(--text-color)' }} />
          </button>
          <button onClick={() => { setShowShareMenu(!showShareMenu); setShowComments(false); }} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
            <Share2 size={26} style={{ color: showShareMenu ? 'var(--primary-color)' : 'var(--text-color)' }} />
          </button>
          <div style={{ flex: 1 }} />
          <button onClick={handleSave} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
            <Bookmark size={26} style={{ color: 'var(--text-color)', fill: isSaved ? 'var(--text-color)' : 'none' }} />
          </button>
        </div>

        {/* Like Count */}
        <div style={{ padding: '12px 16px', fontWeight: 600, fontSize: '14px' }}>
          {likeCount > 0 && post?.likedBy?.[0] ? (
            <span>Liked by <strong>{post.likedBy[0]}</strong>{likeCount > 1 ? ` and ${likeCount - 1} others` : ''}</span>
          ) : (
            <span>{likeCount} likes</span>
          )}
          {saveSuccess && <span style={{ marginLeft: '8px', color: 'var(--primary-color)', fontSize: '12px', fontWeight: 500 }}>Post saved!</span>}
        </div>

        {/* Post Content */}
        {post.content && (
          <div style={{ padding: '0 16px 12px', fontSize: '14px' }}>
            <span style={{ fontWeight: 600, marginRight: '8px', cursor: 'pointer' }} onClick={() => { onClose(); navigate(`/profile/${post.username}`); }}>{post.username}</span>
            {post.content}
          </div>
        )}

        {/* Share Menu */}
        {showShareMenu && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
            <button onClick={handleShare}
              style={{ width: '100%', padding: '10px 16px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
              {shareCopied ? 'Link Copied!' : 'Copy Link'}
            </button>
          </div>
        )}

        {/* Comments Section — inline, no modal */}
        {showComments && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Comment input at top of comments area */}
            <div style={{ padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'center', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--hover-bg)' }}>
              <Avatar username={user?.username} size={24} />
              <input type="text" placeholder="Add a comment..." value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleComment()}
                style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '20px', backgroundColor: 'var(--card-bg)', color: 'var(--text-color)', fontSize: '13px', outline: 'none' }} />
              <button onClick={handleComment} disabled={!newComment.trim()}
                style={{ padding: '6px 14px', backgroundColor: newComment.trim() ? 'var(--primary-color)' : 'var(--border-color)', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 600, cursor: newComment.trim() ? 'pointer' : 'default', fontSize: '12px' }}>
                Post
              </button>
            </div>

            {/* Scrollable comment list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {commentsLoading ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)', fontSize: '13px' }}>Loading comments...</div>
              ) : sortedComments.length > 0 ? (
                <>
                  {visibleComments.map((comment, idx) => {
                    const isLiked = comment.likedBy?.includes(user?.username) || false;
                    return (
                      <div key={comment._id || idx}
                        style={{ padding: '10px 16px', borderBottom: idx < visibleComments.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                              <span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-color)', cursor: 'pointer' }}
                                onClick={() => { onClose(); navigate(`/profile/${comment.username}`); }}>{comment.username}</span>
                              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>· {timeAgo(comment.createdAt)}</span>
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-color)', lineHeight: '1.5', wordBreak: 'break-word' }}>{comment.content}</div>
                          </div>
                          <button onClick={() => handleCommentLike(comment._id)}
                            style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                            <Heart size={14} style={{ color: isLiked ? '#ed4956' : 'var(--text-secondary)', fill: isLiked ? '#ed4956' : 'none', transition: 'all 0.2s' }} />
                            {(comment.likes || 0) > 0 && (
                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{comment.likes}</span>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {!showAllComments && sortedComments.length > 3 && (
                    <button onClick={() => setShowAllComments(true)}
                      style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', textAlign: 'left', transition: 'color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--primary-color)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                      View all {sortedComments.length} comments
                    </button>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  <MessageCircle size={28} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }} />
                  No comments yet. Be the first!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div style={{ padding: '8px 16px', fontSize: '11px', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)' }}>
          {timeAgo(post.createdAt)}
        </div>
      </div>
      {showDeleteConfirm && (
        <ConfirmModal
          key={post._id}
          isOpen={true}
          title="Delete Post?"
          message="Are you sure you want to delete this post? This action cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={handleDeletePost}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
