import { useAuth } from '../context/AuthContext';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, MessageCircle, X, Send, BarChart3, MoreHorizontal, Trash2, Search, Image, Heart, Hash } from 'lucide-react';
import Avatar from '../components/Avatar';
import ConfirmModal from '../components/ConfirmModal';

const INTEREST_KEYWORDS = [
  { interest: 'gaming', keywords: ['valorant', 'minecraft', 'elden ring', 'gaming', 'nintendo', 'playstation', 'xbox', 'pc gaming', 'league of legends', 'fortnite', 'call of duty', 'gta', 'roblox', 'steam', 'esports', 'speedrun', 'retro', 'arcade', 'rpg', 'fps'] },
  { interest: 'anime', keywords: ['anime', 'manga', 'naruto', 'one piece', 'attack on titan', 'aot', 'jujutsu kaisen', 'demon slayer', 'dragon ball', 'pokemon', 'studio ghibli', 'spirited away', 'death note', 'fullmetal', 'hunter x hunter', 'cosplay', 'waifu', 'otaku', 'shonen', 'isekai'] },
  { interest: 'movies', keywords: ['movie', 'film', 'cinema', 'netflix', 'marvel', 'dc', 'hollywood', 'bollywood', 'oscar', 'thriller', 'horror', 'comedy', 'drama', 'documentary', 'sci-fi', 'imdb', 'blockbuster', 'director', 'screenplay', 'animation'] },
  { interest: 'music', keywords: ['music', 'song', 'album', 'spotify', 'concert', 'band', 'guitar', 'piano', 'hip hop', 'rock', 'pop', 'jazz', 'classical', 'lofi', 'playlist', 'singer', 'producer', 'festival', 'vinyl', 'beat'] },
  { interest: 'art', keywords: ['art', 'drawing', 'painting', 'sketch', 'digital art', 'illustration', 'watercolor', 'acrylic', 'canvas', 'artist', 'gallery', 'exhibition', 'sculpture', 'portrait', 'abstract', 'surreal', 'creative', 'sketchbook', 'ink', 'traditional'] },
  { interest: 'design', keywords: ['design', 'ui', 'ux', 'graphic design', 'typography', 'logo', 'branding', 'figma', 'photoshop', 'illustrator', 'canva', 'color palette', 'wireframe', 'prototype', 'motion', '3d', 'blender', 'minimal', 'layout', 'visual'] },
  { interest: 'photography', keywords: ['photography', 'photo', 'camera', 'portrait', 'landscape', 'street photography', 'sony', 'canon', 'nikon', 'fujifilm', 'film photography', 'edit', 'lightroom', 'capture', 'lens', 'aperture', 'composition', 'golden hour', 'night photography', 'vintage'] },
  { interest: 'technology', keywords: ['technology', 'programming', 'coding', 'ai', 'artificial intelligence', 'web dev', 'react', 'javascript', 'python', 'machine learning', 'blockchain', 'cybersecurity', 'app dev', 'startup', 'saas', 'cloud', 'devops', 'data science', 'ui/ux', 'figma'] },
  { interest: 'coding', keywords: ['coding', 'programming', 'javascript', 'python', 'java', 'rust', 'go lang', 'typescript', 'react', 'node.js', 'docker', 'api', 'algorithm', 'open source', 'github', 'terminal', 'debug', 'framework', 'backend', 'frontend'] },
  { interest: 'ai', keywords: ['ai', 'artificial intelligence', 'machine learning', 'deep learning', 'chatgpt', 'llm', 'neural network', 'gpt', 'openai', 'stable diffusion', 'midjourney', 'prompt', 'automation', 'computer vision', 'nlp', 'tensorflow', 'pytorch', 'data', 'model', 'inference'] },
  { interest: 'science', keywords: ['science', 'physics', 'biology', 'chemistry', 'space', 'nasa', 'astronomy', 'research', 'lab', 'experiment', 'quantum', 'dna', 'evolution', 'climate', 'particle', 'telescope', 'mars', 'genetics', 'neuroscience', 'discovery'] },
  { interest: 'books', keywords: ['book', 'reading', 'novel', 'author', 'library', 'fantasy', 'sci-fi', 'fiction', 'nonfiction', 'bestseller', 'thriller', 'mystery', 'biography', 'philosophy', 'self-help', 'page-turner', 'literature', 'poetry', 'ebook', 'paperback'] },
  { interest: 'fitness', keywords: ['fitness', 'gym', 'workout', 'bodybuilding', 'yoga', 'cardio', 'crossfit', 'running', 'marathon', 'pilates', 'protein', 'calisthenics', 'weightlifting', 'hiit', 'meditation', 'mindfulness', 'nutrition', 'diet', 'abs', 'strength'] },
  { interest: 'health', keywords: ['health', 'wellness', 'mental health', 'sleep', 'self-care', 'therapy', 'anxiety', 'stress', 'mindfulness', 'meditation', 'immune', 'vitamin', 'healthy', 'recovery', 'hydration', 'skin care', 'gut health', 'hormone', 'energy', 'balance'] },
  { interest: 'food', keywords: ['food', 'cooking', 'baking', 'recipe', 'restaurant', 'pizza', 'sushi', 'pasta', 'dessert', 'vegan', 'vegetarian', 'keto', 'meal prep', 'street food', 'brunch', 'coffee', 'wine', 'cocktail', 'chef', 'gourmet'] },
  { interest: 'travel', keywords: ['travel', 'photography', 'adventure', 'backpacking', 'hiking', 'beach', 'mountains', 'road trip', 'vacation', 'explore', 'culture', 'wanderlust', 'solo travel', 'budget travel', 'luxury travel', 'nature', 'sunset', 'camping', 'roadtrip', 'destination'] },
  { interest: 'sports', keywords: ['sports', 'football', 'soccer', 'basketball', 'cricket', 'tennis', 'formula 1', 'nfl', 'nba', 'uefa', 'olympics', 'athlete', 'training', 'championship', 'league', 'stadium', 'goal', 'match', 'score', 'highlight'] },
  { interest: 'finance', keywords: ['finance', 'investing', 'stock', 'crypto', 'bitcoin', 'trading', 'savings', 'budget', 'passive income', 'real estate', 'dividend', 'portfolio', 'market', 'wealth', 'retirement', 'debt', 'credit', 'tax', 'financial', 'money'] },
  { interest: 'productivity', keywords: ['productivity', 'focus', 'time management', 'habit', 'routine', 'efficiency', 'goals', 'tracking', 'todo', 'organization', 'planning', 'deep work', 'pomodoro', 'minimalism', 'discipline', 'motivation', 'notion', 'workflow', 'schedule', 'hack'] },
  { interest: 'startups', keywords: ['startup', 'entrepreneur', 'founder', 'venture capital', 'fundraising', 'mvp', 'growth', 'scale', 'product market', 'pivot', 'accelerator', 'y combinator', 'series a', 'bootstrap', 'angel', 'pitch', 'investor', 'exit', 'saas', 'disrupt'] }
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

function scoreDiscussion(discussion, userInterests) {
  const text = [discussion.title, discussion.content, ...(discussion.tags || [])].filter(Boolean).join(' ').toLowerCase();
  let score = 0;
  const matched = new Set();
  for (const { interest, keywords } of INTEREST_KEYWORDS) {
    if (!userInterests?.includes(interest)) continue;
    for (const kw of keywords) {
      if (text.includes(kw)) {
        matched.add(interest);
        score += 3;
        break;
      }
    }
  }
  for (const interest of matched) {
    score += 2;
  }
  score += Math.min(discussion.comments || 0, 10);
  return score;
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
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [tags, setTags] = useState('');
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

  const fetchDiscussions = async () => {
    try {
      const res = await fetch('/api/posts/discussions');
      if (res.ok) {
        const list = await res.json();
        const userInterests = user?.interests || [];
        setDiscussions(list.sort((a, b) => {
          const scoreA = scoreDiscussion(a, userInterests);
          const scoreB = scoreDiscussion(b, userInterests);
          if (scoreB !== scoreA) return scoreB - scoreA;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }));
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchDiscussions(); }, [user]);

  const normalize = (value) => (value || '').toString().toLowerCase();
  const fuzzySearchMatch = (text, query) => {
    const haystack = normalize(text);
    const needle = normalize(query);
    if (!needle) return true;
    if (haystack.includes(needle)) return true;
    let idx = 0;
    for (const char of needle) {
      idx = haystack.indexOf(char, idx);
      if (idx === -1) return false;
      idx += 1;
    }
    return true;
  };

  const filteredDiscussions = useMemo(() => {
    if (!searchQuery.trim()) return discussions;
    return discussions.filter(d => {
      const searchSource = [d.title, d.content, d.username, d.tags?.join(' '), d.category].filter(Boolean).join(' ');
      return fuzzySearchMatch(searchSource, searchQuery);
    });
  }, [discussions, searchQuery]);

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
      const tagList = tags.split(/[,\s]+/).filter(Boolean);
      if (tagList.length > 0) body.tags = tagList;
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
        setTags('');
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

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)', fontSize: '15px' }}>Loading discussions...</div>
      ) : filteredDiscussions.length === 0 ? (
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
          {filteredDiscussions.map(d => (
            <div key={d._id} onClick={() => navigate(`/discussion/${d._id}`)}
              className="discussion-card"
              style={{
                backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)', padding: '20px',
                cursor: 'pointer', transition: 'box-shadow 0.2s ease, transform 0.2s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary-color)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}>
              {/* Author row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Avatar username={d?.username} size={24} />
                <span style={{ fontWeight: 500, fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  onClick={e => { e.stopPropagation(); navigate(`/profile/${d.username}`); }}>{d.username}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>· {timeAgo(d.createdAt)}</span>
                {user && d.username === user.username && (
                  <div style={{ position: 'relative', marginLeft: 'auto' }}>
                    <button onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId === d._id ? null : d._id); }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', display: 'flex', borderRadius: '6px', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <MoreHorizontal size={16} />
                    </button>
                    {menuOpenId === d._id && (
                      <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 100, minWidth: '160px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', padding: '4px', marginTop: '4px' }}
                        onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setConfirmDelete(d._id); setMenuOpenId(null); }}
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

              {/* Title */}
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-color)', margin: '0 0 6px', lineHeight: 1.3, letterSpacing: '-0.01em' }}>{d.title}</h3>

              {/* Tags */}
              {d.tags && d.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {d.tags.map((tag, i) => (
                    <span key={i} style={{ fontSize: '11px', color: 'var(--primary-color)', fontWeight: 500, opacity: 0.8 }}>#{tag}</span>
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
                <div style={{ marginBottom: '10px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', maxHeight: '200px', backgroundColor: 'var(--hover-bg)' }}>
                  <img src={d.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              {/* Poll preview */}
              {d.poll && d.poll.options && d.poll.options.length > 0 && (
                <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: 'var(--hover-bg)', borderRadius: 'var(--radius-sm)' }}>
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
                {d.poll && (
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
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Tags (comma-separated)</span>
              </div>
              <input className="form-input" placeholder="e.g. coding, react, webdev" value={tags} onChange={e => setTags(e.target.value)} />
            </div>

            {/* Image upload */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
              <button type="button" className="btn-secondary" onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <Image size={14} />
                Attach image
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
              {imagePreview && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--hover-bg)', width: '100%' }}>
                  <img src={imagePreview} alt="" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px' }} />
                  <div style={{ flex: 1, fontSize: '13px', color: 'var(--text-color)' }}>Image attached</div>
                  <button type="button" onClick={handleRemoveImage} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px', padding: '4px 8px', borderRadius: '4px', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Poll toggle */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, color: 'var(--text-color)', marginBottom: pollMode ? '12px' : 0 }}>
                <input type="checkbox" checked={pollMode} onChange={e => setPollMode(e.target.checked)} style={{ accentColor: 'var(--primary-color)' }} />
                Add a poll
              </label>
              {pollMode && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', backgroundColor: 'var(--hover-bg)', borderRadius: 'var(--radius-sm)' }}>
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

            {error && <div style={{ color: '#e74c3c', fontSize: '13px', marginBottom: '12px' }}>{error}</div>}

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
