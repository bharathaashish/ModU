import { useAuth } from '../context/AuthContext';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, MessageCircle, X, Send, BarChart3, MoreHorizontal, Trash2, Search, Image, Heart, Hash, ChevronDown } from 'lucide-react';
import Avatar from '../components/Avatar';
import ConfirmModal from '../components/ConfirmModal';

const INTEREST_KEYWORDS = [
  { interest: 'Gaming', keywords: ['game', 'games', 'gaming', 'gamer'] },
  { interest: 'Music', keywords: ['music', 'musician', 'song', 'songs', 'artist', 'album'] },
  { interest: 'Art', keywords: ['art', 'artist', 'drawing', 'sketch', 'painting', 'digital art'] },
  { interest: 'Fashion', keywords: ['fashion', 'style', 'outfit', 'clothing', 'streetwear'] },
  { interest: 'Travel', keywords: ['travel', 'traveling', 'trip', 'vacation', 'wanderlust'] },
  { interest: 'Food', keywords: ['food', 'cooking', 'recipe', 'baking', 'cuisine'] },
  { interest: 'Fitness', keywords: ['fitness', 'workout', 'exercise', 'gym', 'training'] },
  { interest: 'Sports', keywords: ['sports', 'sport', 'athlete', 'team', 'game', 'match'] },
  { interest: 'Technology', keywords: ['tech', 'technology', 'coding', 'programming', 'software', 'ai', 'computer'] },
  { interest: 'Science', keywords: ['science', 'scientific', 'research', 'experiment', 'biology', 'physics', 'chemistry'] },
  { interest: 'Reading', keywords: ['reading', 'book', 'books', 'novel', 'literature', 'author'] },
  { interest: 'Writing', keywords: ['writing', 'writer', 'author', 'poetry', 'story', 'blog'] },
  { interest: 'Movies', keywords: ['movie', 'movies', 'film', 'cinema', 'hollywood'] },
  { interest: 'TV Shows', keywords: ['tv', 'television', 'show', 'shows', 'netflix', 'series'] },
  { interest: 'Anime', keywords: ['anime', 'manga', 'japanese', 'otaku'] },
  { interest: 'Photography', keywords: ['photography', 'photographer', 'photo', 'camera', 'photoshoot'] },
  { interest: 'Nature', keywords: ['nature', 'outdoor', 'wildlife', 'garden', 'plant', 'environment'] },
  { interest: 'Pets', keywords: ['pet', 'pets', 'dog', 'cat', 'animal', 'animals'] },
  { interest: 'Education', keywords: ['education', 'learning', 'study', 'student', 'school', 'college', 'university'] },
  { interest: 'Business', keywords: ['business', 'entrepreneur', 'startup', 'finance', 'career', 'economy', 'marketing'] }
];

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

export default function Discussions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [creating, setCreating] = useState(false);
  const [pollMode, setPollMode] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState('trending');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [tags, setTags] = useState([]);
  const fileInputRef = useRef(null);

  const handleDelete = async (postId) => {
    if (!postId || !user) return;
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
      });
      if (res.ok) {
        setDiscussions(prev => prev.filter(d => d._id !== postId));
        setConfirmDelete(null);
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error('Delete discussion failed:', res.status, errData);
      }
    } catch (err) {
      console.error('Delete discussion error:', err);
    }
    setMenuOpenId(null);
  };

  const fetchDiscussions = async (searchOverride) => {
    try {
      const q = searchOverride !== undefined ? searchOverride : searchQuery;
      let url = `/api/posts/discussions?username=${user?.username || ''}&sort=${sortMode}`;
      if (q.trim()) {
        url += `&search=${encodeURIComponent(q.trim())}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        setDiscussions(await res.json());
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchDiscussions(), 300);
    return () => clearTimeout(timer);
  }, [user, sortMode, searchQuery]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setImagePreview(evt.target.result);
      setImage(file);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreate = async () => {
    if (!title.trim() || !user) return;
    setCreating(true);
    setError('');
    try {
      const body = { username: user.username, title: title.trim(), content: content.trim(), type: 'discussion' };
      if (imagePreview) body.image = imagePreview;
      if (tags.length > 0) body.tags = tags;
      if (pollMode) {
        const options = pollOptions.filter(o => o.trim()).map(text => ({ text: text.trim(), votes: 0, voters: [] }));
        if (options.length < 2) { setError('Add at least 2 poll options'); setCreating(false); return; }
        body.poll = { options };
      }
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setShowCreate(false);
        setTitle('');
        setContent('');
        setPollMode(false);
        setPollOptions(['', '']);
        setTags([]);
        await fetchDiscussions();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to create discussion');
      }
    } catch {
      setError('Network error — please check your connection');
    }
    setCreating(false);
  };

  const addPollOption = () => setPollOptions(prev => [...prev, '']);
  const updatePollOption = (i, val) => setPollOptions(prev => { const n = [...prev]; n[i] = val; return n; });
  const removePollOption = (i) => setPollOptions(prev => prev.length > 2 ? prev.filter((_, idx) => idx !== i) : prev);

  return (
    <div className="page-container" style={{ maxWidth: '680px' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <button onClick={() => navigate('/discover')} style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer', display: 'flex', padding: '4px' }}>
            <ArrowLeft size={22} />
          </button>
          <span className="page-title">Discussions</span>
        </div>
        <button className="create-btn" onClick={() => setShowCreate(true)}>
          <Plus size={18} />
          <span>New Topic</span>
        </button>
      </div>

      {/* Search bar */}
      <div className="discussion-search-bar">
        <Search size={16} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
        <input
          type="search"
          placeholder="Search discussions, topics, tags, or people..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px', display: 'flex', flexShrink: 0 }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Sort dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '4px 16px 8px' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <select
            value={sortMode}
            onChange={e => setSortMode(e.target.value)}
            style={{
              padding: '6px 28px 6px 12px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--card-bg)',
              color: 'var(--text-color)',
              cursor: 'pointer',
              outline: 'none',
              appearance: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              fontFamily: 'var(--font-sans)'
            }}
          >
            <option value="trending">Trending</option>
            <option value="popular">Popular</option>
            <option value="recent">Recent</option>
          </select>
          <ChevronDown size={14} color="var(--text-secondary)" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}><div style={{ display: 'inline-block', width: '24px', height: '24px', border: '2px solid var(--border-color)', borderTopColor: 'var(--text-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /></div>
      ) : discussions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
          <MessageCircle size={48} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
          <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-color)' }}>
            {searchQuery.trim() ? 'No matches found' : 'No discussions yet'}
          </div>
          <div style={{ fontSize: '14px', marginBottom: '28px', color: 'var(--text-secondary)' }}>
            {searchQuery.trim()
              ? 'Try a broader search term or clear the filter.'
              : 'Start a conversation — ask a question or share an opinion.'}
          </div>
          <button className="create-btn" style={{ margin: '0 auto' }} onClick={() => setShowCreate(true)}>
            <Plus size={18} />
            <span>Create the first topic</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {discussions.map(d => (
            <div key={d._id} onClick={() => navigate(`/discussion/${d._id}`)}
              className="discussion-card"
              style={{
                backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)', padding: '20px',
                cursor: 'pointer', transition: 'box-shadow 0.2s ease, transform 0.2s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-color)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}>
              {/* Author row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Avatar username={d?.username} image={d?.profilePhoto} size={24} />
                <span style={{ fontWeight: 500, fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  onClick={e => { e.stopPropagation(); navigate(`/profile/${d.username}`); }}>{d.username}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>· {timeAgo(d.createdAt)}</span>
                {user && d.username === user.username && (
                  <div style={{ position: 'relative', marginLeft: 'auto' }}>
                    <button onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId === d._id ? null : d._id); }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', display: 'flex', borderRadius: '6px', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-alt)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <MoreHorizontal size={16} />
                    </button>
                    {menuOpenId === d._id && (
                      <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 100, minWidth: '160px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', padding: '4px', marginTop: '4px' }}
                        onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setConfirmDelete(d._id); setMenuOpenId(null); }}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', border: 'none', background: 'none', color: 'var(--text-color)', fontSize: '13px', cursor: 'pointer', borderRadius: '6px', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-alt)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <Trash2 size={14} />
                          <span>Delete Discussion</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Title */}
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-color)', margin: '0 0 6px', lineHeight: 1.3, letterSpacing: '-0.01em' }}>{d.title}</h3>

              {/* Tags */}
              {d.tags && d.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {d.tags.map((tag, i) => (
                    <span key={i} style={{ fontSize: '11px', color: 'var(--text-color)', fontWeight: 500, opacity: 0.8 }}>#{tag}</span>
                  ))}
                </div>
              )}

              {/* Content preview */}
              {d.content && (
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {d.content}
                </div>
              )}

              {/* Image thumbnail */}
              {d.image && (
                <div style={{ marginBottom: '10px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', maxHeight: '200px', backgroundColor: 'var(--surface-alt)' }}>
                  <img src={d.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              {/* Poll preview */}
              {d.poll && d.poll.options && d.poll.options.length > 0 && (
                <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: 'var(--surface-alt)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-color)', marginBottom: '6px' }}>
                    <BarChart3 size={14} />
                    <span>Poll</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {d.poll.options.slice(0, 3).map((opt, i) => (
                      <div key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '5px 8px', backgroundColor: 'var(--card-bg)', borderRadius: '4px' }}>
                        {opt.text}
                      </div>
                    ))}
                    {d.poll.options.length > 3 && (
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', padding: '4px 8px' }}>
                        +{d.poll.options.length - 3} more options
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{d.poll.totalVotes || 0} votes</div>
                </div>
              )}

              {/* Stats row — likes + replies only, no votes */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: 'var(--text-tertiary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Heart size={14} />
                  <span>{d.likes || 0}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MessageCircle size={14} />
                  <span>{d.comments || 0} {d.comments === 1 ? 'reply' : 'replies'}</span>
                </div>
                {d.poll?.options?.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <BarChart3 size={14} />
                    <span>{d.poll.totalVotes || 0} votes</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <ConfirmModal
          key={confirmDelete}
          isOpen={true}
          title="Delete Discussion"
          message="Are you sure you want to delete this discussion? This action cannot be undone."
          confirmLabel="Delete Discussion"
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* Create Discussion Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div className="modal-title" style={{ margin: 0 }}>New Discussion</div>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            <input className="form-input" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} autoFocus />

            <textarea className="form-textarea" placeholder="What's on your mind? Ask a question, share an opinion, or start a discussion..."
              value={content} onChange={e => setContent(e.target.value)} />

            {/* Tags */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Hash size={14} color="var(--text-secondary)" />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Tags</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {INTEREST_KEYWORDS.map(({ interest }) => {
                  const active = tags.includes(interest);
                  return (
                    <button key={interest} type="button" onClick={() => {
                      setTags(prev => prev.includes(interest) ? prev.filter(t => t !== interest) : [...prev, interest]);
                    }}
                      style={{
                        padding: '6px 14px', borderRadius: '20px', border: `1px solid ${active ? 'var(--text-color)' : 'var(--border-color)'}`,
                        backgroundColor: active ? 'var(--surface-alt)' : 'transparent',
                        color: 'var(--text-color)', fontSize: '12px', fontWeight: active ? 600 : 500,
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Image upload */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
              <button type="button" className="btn-secondary" onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <Image size={14} />
                Attach image
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
              {imagePreview && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--surface-alt)', width: '100%' }}>
                  <img src={imagePreview} alt="" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px' }} />
                  <div style={{ flex: 1, fontSize: '13px', color: 'var(--text-color)' }}>Image attached</div>
                  <button type="button" onClick={handleRemoveImage} style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer', fontSize: '13px', padding: '4px 8px', borderRadius: '4px', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-alt)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Poll toggle */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, color: 'var(--text-color)', marginBottom: pollMode ? '12px' : 0 }}>
                <input type="checkbox" checked={pollMode} onChange={e => setPollMode(e.target.checked)} style={{ accentColor: 'var(--text-color)' }} />
                Add a poll
              </label>
              {pollMode && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', backgroundColor: 'var(--surface-alt)', borderRadius: 'var(--radius-sm)' }}>
                  {pollOptions.map((opt, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input className="form-input" style={{ margin: 0, flex: 1 }} placeholder={`Option ${i + 1}`} value={opt} onChange={e => updatePollOption(i, e.target.value)} />
                      {pollOptions.length > 2 && (
                        <button onClick={() => removePollOption(i)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={addPollOption} className="btn-secondary" style={{ padding: '8px', fontSize: '13px', justifyContent: 'center' }}>
                    + Add option
                  </button>
                </div>
              )}
            </div>

            {error && <div style={{ color: 'var(--text-color)', fontSize: '13px', marginBottom: '12px' }}>{error}</div>}

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreate} disabled={!title.trim() || creating}>
                {creating ? 'Posting...' : 'Post Topic'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
