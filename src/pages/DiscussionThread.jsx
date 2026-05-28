import { useAuth } from '../context/AuthContext';
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { ArrowLeft, MessageCircle, Send, BarChart3, ChevronUp, ChevronDown, MoreHorizontal, Trash2, Heart, Reply } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

function Poll({ poll, postId, user, onVote }) {
  const [voted, setVoted] = useState(false);
  const total = poll.totalVotes || 0;

  useEffect(() => {
    if (user && poll.options) {
      setVoted(poll.options.some(o => o.voters?.includes(user.username)));
    }
  }, [poll, user]);

  const handleVote = async (optionIndex) => {
    if (!user || voted) return;
    try {
      const res = await fetch(`/api/posts/${postId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, optionIndex })
      });
      if (res.ok) {
        const updatedPost = await res.json();
        onVote(updatedPost);
        setVoted(true);
      }
    } catch (err) {
      console.error('Vote error:', err);
    }
  };

  return (
    <div style={{ marginTop: '16px', padding: '16px', backgroundColor: 'var(--hover-bg)', borderRadius: 'var(--radius-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, color: 'var(--text-color)', marginBottom: '12px' }}>
        <BarChart3 size={18} />
        <span>Poll</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {poll.options?.map((opt, i) => {
          const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
          return (
            <button key={i} onClick={() => handleVote(i)}
              disabled={voted}
              style={{
                position: 'relative', width: '100%', padding: '12px 14px',
                border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--card-bg)', cursor: voted ? 'default' : 'pointer',
                textAlign: 'left', fontSize: '14px', color: 'var(--text-color)',
                overflow: 'hidden', transition: 'all 0.2s ease'
              }}>
              {voted && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, bottom: 0,
                  width: `${pct}%`, backgroundColor: 'var(--primary-glow)',
                  transition: 'width 0.4s ease', borderRadius: '7px'
                }} />
              )}
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{opt.text}</span>
                {voted && <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary-color)' }}>{pct}%</span>}
              </div>
            </button>
          );
        })}
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '10px' }}>
        {total} vote{total !== 1 ? 's' : ''} {voted ? '(You voted)' : ''}
      </div>
    </div>
  );
}

function CommentVoteButtons({ comment, user, onVote }) {
  const [localUp, setLocalUp] = useState(user && comment.upvotedBy?.includes(user.username));
  const [localDown, setLocalDown] = useState(user && comment.downvotedBy?.includes(user.username));
  const [localScore, setLocalScore] = useState((comment.upvotes || 0) - (comment.downvotes || 0));
  const lastVotedId = useRef(null);

  useEffect(() => {
    if (lastVotedId.current === comment._id) return;
    lastVotedId.current = comment._id;
    setLocalUp(user && comment.upvotedBy?.includes(user.username));
    setLocalDown(user && comment.downvotedBy?.includes(user.username));
    setLocalScore((comment.upvotes || 0) - (comment.downvotes || 0));
  }, [comment, user]);

  const handleClick = (voteType) => {
    if (!user) return;
    const wasUp = localUp;
    const wasDown = localDown;
    const oldScore = localScore;

    let newUp = false, newDown = false, newScore = oldScore;
    if (voteType === 'upvote') {
      if (localUp) { newUp = false; newScore = oldScore - 1; }
      else { newUp = true; newDown = false; newScore = wasDown ? oldScore + 2 : oldScore + 1; }
    } else {
      if (localDown) { newDown = false; newScore = oldScore + 1; }
      else { newDown = true; newUp = false; newScore = wasUp ? oldScore - 2 : oldScore - 1; }
    }

    setLocalUp(newUp);
    setLocalDown(newDown);
    setLocalScore(newScore);

    onVote(comment._id, voteType, () => {
      setLocalUp(wasUp);
      setLocalDown(wasDown);
      setLocalScore(oldScore);
    });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
      <button onClick={() => handleClick('upvote')}
        style={{ background: 'none', border: 'none', cursor: user ? 'pointer' : 'default', padding: '4px', display: 'flex', borderRadius: '4px', color: localUp ? 'var(--primary-color)' : 'var(--text-tertiary)', transition: 'color 0.15s, background 0.15s' }}
        onMouseEnter={e => { if (user) { e.currentTarget.style.background = 'var(--hover-bg)'; e.currentTarget.style.color = 'var(--primary-color)'; }}}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; if (!localUp) e.currentTarget.style.color = 'var(--text-tertiary)'; }}>
        <ChevronUp size={16} />
      </button>
      <span style={{ fontSize: '12px', fontWeight: 700, color: localScore > 0 ? 'var(--primary-color)' : localScore < 0 ? '#ef4444' : 'var(--text-secondary)', lineHeight: 1, minWidth: '18px', textAlign: 'center' }}>{localScore}</span>
      <button onClick={() => handleClick('downvote')}
        style={{ background: 'none', border: 'none', cursor: user ? 'pointer' : 'default', padding: '4px', display: 'flex', borderRadius: '4px', color: localDown ? '#ef4444' : 'var(--text-tertiary)', transition: 'color 0.15s, background 0.15s' }}
        onMouseEnter={e => { if (user) { e.currentTarget.style.background = 'var(--hover-bg)'; e.currentTarget.style.color = '#ef4444'; }}}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; if (!localDown) e.currentTarget.style.color = 'var(--text-tertiary)'; }}>
        <ChevronDown size={16} />
      </button>
    </div>
  );
}

function CommentItem({ comment, user, onVote, onReply, onDelete, depth, onNavigate, allReplies }) {
  const [showReplies, setShowReplies] = useState(true);
  const maxNest = 4;
  const children = allReplies[comment._id] || [];

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', padding: '10px 12px 10px 0', borderBottom: '1px solid var(--border-color)' }}>
        <CommentVoteButtons comment={comment} user={user} onVote={onVote} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-color)', cursor: 'pointer' }}
              onClick={() => onNavigate(`/profile/${comment.username}`)}>{comment.username}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>· {timeAgo(comment.createdAt)}</span>
            {user && user.username === comment.username && onDelete && (
              <button onClick={() => onDelete(comment._id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-tertiary)', fontSize: '11px', fontWeight: 500, borderRadius: '4px', transition: 'color 0.15s, background 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'var(--hover-bg)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = 'transparent'; }}>
                <Trash2 size={12} /> Delete
              </button>
            )}
            {user && (
              <button onClick={() => onReply(comment._id, comment.username)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-tertiary)', fontSize: '11px', fontWeight: 500, borderRadius: '4px', transition: 'color 0.15s, background 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary-color)'; e.currentTarget.style.background = 'var(--hover-bg)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = 'transparent'; }}>
                <Reply size={12} /> Reply
              </button>
            )}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-color)', lineHeight: '1.5', wordBreak: 'break-word' }}>{comment.content}</div>
        </div>
      </div>
      {children.length > 0 && (
        <div style={{ marginLeft: depth < maxNest ? '28px' : '0', borderLeft: depth < maxNest ? '2px solid var(--border-color)' : 'none', paddingLeft: depth < maxNest ? '8px' : '0' }}>
          {showReplies && children.map(reply => (
            <CommentItem key={reply._id} comment={reply} user={user} onVote={onVote} onReply={onReply}
              onDelete={onDelete} depth={depth + 1} onNavigate={onNavigate} allReplies={allReplies} />
          ))}
          <button onClick={() => setShowReplies(!showReplies)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', color: 'var(--primary-color)', fontSize: '11px', fontWeight: 500, marginTop: '2px', transition: 'opacity 0.15s' }}>
            {showReplies ? '− Hide replies' : `+ ${children.length} ${children.length === 1 ? 'reply' : 'replies'}`}
          </button>
        </div>
      )}
    </div>
  );
}

export default function DiscussionThread() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [sending, setSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const sortedComments = comments.slice().sort((a, b) => {
    const scoreA = (a.upvotes || 0) - (a.downvotes || 0);
    const scoreB = (b.upvotes || 0) - (b.downvotes || 0);
    if (scoreB !== scoreA) return scoreB - scoreA;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const topLevel = sortedComments.filter(c => !c.parentId);
  const repliesByParent = {};
  sortedComments.forEach(c => {
    if (c.parentId) {
      const pid = c.parentId.toString();
      if (!repliesByParent[pid]) repliesByParent[pid] = [];
      repliesByParent[pid].push(c);
    }
  });

  useEffect(() => {
    async function load() {
      const [postRes, commentsRes] = await Promise.all([
        fetch(`/api/posts/${id}`),
        fetch(`/api/posts/${id}/comments`)
      ]);
      if (postRes.ok) setPost(await postRes.json());
      if (commentsRes.ok) setComments(await commentsRes.json());
    }
    load();
  }, [id]);

  const handleDelete = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
      });
      if (res.ok) {
        setConfirmDelete(false);
        navigate(-1);
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error('Delete discussion failed:', res.status, errData);
        setConfirmDelete(false);
      }
    } catch (err) {
      console.error('Delete discussion error:', err);
      setConfirmDelete(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/posts/${id}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
      });
      if (res.ok) {
        const data = await res.json();
        const removedId = data.commentId;
        setComments(prev => {
          const idsToRemove = new Set([removedId]);
          let found = true;
          while (found) {
            found = false;
            prev.forEach(c => {
              if (c.parentId && idsToRemove.has(c.parentId) && !idsToRemove.has(c._id)) {
                idsToRemove.add(c._id);
                found = true;
              }
            });
          }
          return prev.filter(c => !idsToRemove.has(c._id));
        });
        setPost(prev => prev ? { ...prev, comments: Math.max(0, (prev.comments || 0) - 1) } : prev);
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error('Delete comment failed:', res.status, errData);
      }
    } catch (err) {
      console.error('Delete comment error:', err);
    }
  };

  const handleLike = async () => {
    if (!user || !post) return;
    try {
      const res = await fetch(`/api/posts/${id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
      });
      if (res.ok) {
        const updated = await res.json();
        setPost(updated);
      }
    } catch {}
  };

  const handleCommentVote = async (commentId, voteType, rollback) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/posts/${id}/comments/${commentId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, voteType })
      });
      if (res.ok) {
        const updated = await res.json();
        setComments(prev => prev.map(c => c._id === commentId ? updated : c));
      } else {
        rollback?.();
      }
    } catch (err) {
      console.error('Vote error:', err);
      rollback?.();
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !user) return;
    setSending(true);
    const body = {
      username: user.username,
      content: replyingTo ? `@${replyingTo.username} ${replyText.trim()}` : replyText.trim()
    };
    if (replyingTo) body.parentId = replyingTo.commentId;

    console.log('Sending reply with parentId:', body.parentId);

    const res = await fetch(`/api/posts/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      const newComment = await res.json();
      console.log('Reply response parentId:', newComment.parentId);
      setComments(prev => {
        const updated = [newComment, ...prev];
        return updated;
      });
      setReplyText('');
      setReplyingTo(null);
      setPost(prev => prev ? { ...prev, comments: (prev.comments || 0) + 1 } : prev);
    } else {
      console.error('Reply failed:', res.status);
    }
    setSending(false);
  };

  const startReply = (commentId, username) => {
    setReplyingTo({ commentId, username });
    setReplyText('');
  };

  const isLiked = user && post?.likedBy?.includes(user.username);

  if (!post) {
    return (
      <div className="thread-container" style={{ textAlign: 'center', paddingTop: '80px', color: 'var(--text-secondary)' }}>
        Loading discussion...
      </div>
    );
  }

  return (
    <div className="thread-container">
      {/* Back */}
      <button onClick={() => navigate(-1)}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-color)', fontSize: '14px', cursor: 'pointer', padding: '8px 0', marginBottom: '20px', opacity: 0.7, transition: 'opacity 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}>
        <ArrowLeft size={20} />
        <span>Back to discussions</span>
      </button>

      {/* Thread post */}
      <div className="thread-post" style={{ padding: '24px' }}>
        {/* Author + menu */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Avatar username={post.username} size={32} onClick={() => navigate(`/profile/${post.username}`)} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-color)', cursor: 'pointer' }}
                onClick={() => navigate(`/profile/${post.username}`)}>{post.username}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{timeAgo(post.createdAt)}</div>
            </div>
          </div>
          {user && post.username === user.username && (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowMenu(!showMenu)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px', display: 'flex', borderRadius: '6px', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <MoreHorizontal size={18} />
              </button>
              {showMenu && (
                <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 100, minWidth: '160px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', padding: '4px', marginTop: '4px' }}>
                  <button onClick={() => { setConfirmDelete(true); setShowMenu(false); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', border: 'none', background: 'none', color: '#ef4444', fontSize: '13px', cursor: 'pointer', borderRadius: '6px', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <Trash2 size={14} />
                    <span>Delete Discussion</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {post.tags.map((tag, i) => (
              <span key={i} style={{ fontSize: '12px', color: 'var(--primary-color)', fontWeight: 500, opacity: 0.8 }}>#{tag}</span>
            ))}
          </div>
        )}

        {/* Title */}
        {post.title && <h1 className="thread-post-title">{post.title}</h1>}

        {/* Content */}
        {post.content && <div className="thread-post-body">{post.content}</div>}

        {/* Image */}
        {post.image && (
          <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '16px' }}>
            <img src={post.image} alt="" style={{ width: '100%', maxHeight: '450px', objectFit: 'cover' }} />
          </div>
        )}

        {/* Poll */}
        {post.poll && post.poll.options && post.poll.options.length > 0 && (
          <Poll poll={post.poll} postId={post._id} user={user} onVote={(updatedPost) => setPost(updatedPost)} />
        )}

        {/* Actions row — ❤️ like + reply count */}
        <div className="thread-actions" style={{ marginTop: '16px', marginBottom: 0 }}>
          <button className="thread-action-btn" onClick={handleLike} disabled={!user}
            style={{ color: isLiked ? 'var(--error-color)' : 'var(--text-secondary)', cursor: user ? 'pointer' : 'default' }}>
            <Heart size={16} fill={isLiked ? 'var(--error-color)' : 'none'} />
            <span>{post.likes || 0} {post.likes === 1 ? 'like' : 'likes'}</span>
          </button>
          <div className="thread-action-btn" style={{ cursor: 'default' }}>
            <MessageCircle size={16} />
            <span>{post.comments || 0} {post.comments === 1 ? 'reply' : 'replies'}</span>
          </div>
        </div>
      </div>

      {/* Reply input */}
      <div style={{ marginBottom: '0' }}>
        {replyingTo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', fontSize: '12px', color: 'var(--primary-color)', fontWeight: 500, backgroundColor: 'var(--hover-bg)', borderRadius: '8px 8px 0 0', borderBottom: '1px solid var(--border-color)' }}>
            <Reply size={12} />
            <span>Replying to <strong>{replyingTo.username}</strong></span>
            <button onClick={() => { setReplyingTo(null); setReplyText(''); }}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px', display: 'flex' }}>
              <ArrowLeft size={14} />
            </button>
          </div>
        )}
        <div className="thread-reply-input" style={{ borderTopLeftRadius: replyingTo ? '0' : undefined, borderTopRightRadius: replyingTo ? '0' : undefined }}>
          <input placeholder={replyingTo ? 'Write a reply...' : 'Write a comment...'} value={replyText} onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !sending && handleReply()} />
          <button onClick={handleReply} disabled={!replyText.trim() || sending}>
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <ConfirmModal
          key={id}
          isOpen={true}
          title="Delete Discussion"
          message="Are you sure you want to delete this discussion? This action cannot be undone."
          confirmLabel="Delete Discussion"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      {/* Comments — Reddit-style with upvote/downvote + threading */}
      <div style={{ marginTop: '20px' }}>
        {comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            <MessageCircle size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
            <div style={{ fontWeight: 600, color: 'var(--text-color)', marginBottom: '4px' }}>No replies yet</div>
            <div>Be the first to share your thoughts.</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              {comments.length} {comments.length === 1 ? 'reply' : 'replies'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {topLevel.map(c => (
                <CommentItem key={c._id} comment={c} user={user} onVote={handleCommentVote} onReply={startReply}
                  onDelete={handleDeleteComment} depth={0} onNavigate={navigate} allReplies={repliesByParent} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
