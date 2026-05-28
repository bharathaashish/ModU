import { useAuth } from '../context/AuthContext';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { Users, MessageSquare, ChevronRight, MessageCircle, ArrowRight, Search, Globe, Lock, X } from 'lucide-react';

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
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

function scorePost(caption, userInterests, userCommunities, allCommunities, post) {
  const lower = (caption || '').toLowerCase();
  let score = 0;
  const hasSelectedInterests = Array.isArray(userInterests) && userInterests.length > 0;
  const matchedInterests = new Set();

  for (const { interest, keywords } of INTEREST_KEYWORDS) {
    if (!hasSelectedInterests || userInterests.includes(interest)) {
      for (const kw of keywords) {
        if (lower.includes(kw)) {
          matchedInterests.add(interest);
          score += 3;
        }
      }
    }
  }

  if (hasSelectedInterests && matchedInterests.size === 0) {
    const alignedCommunity = (allCommunities || []).some(community =>
      userCommunities?.some(joined => (joined._id === community._id || joined === community._id)) &&
      community.interests?.some(i => userInterests.includes(i))
    );
    if (!alignedCommunity) return -1;
  }

  if (hasSelectedInterests) {
    for (const interest of userInterests) {
      if (matchedInterests.has(interest)) score += 4;
    }
  }

  if (Array.isArray(userCommunities) && Array.isArray(allCommunities)) {
    for (const community of allCommunities) {
      const joined = userCommunities.some(c => c._id === community._id || c === community._id);
      if (joined) {
        score += 4;
        if (community.interests?.some(i => userInterests?.includes(i))) score += 2;
      }
    }
  }

  if (post?.comments > 0) score += Math.min(post.comments, 5);
  return score;
}

export default function Discover() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [interestPosts, setInterestPosts] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search state
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [userResults, setUserResults] = useState([]);
  const [communityResults, setCommunityResults] = useState([]);
  const searchRef = useRef(null);

  useEffect(() => {
    async function load() {
      const [usersRes, postsRes, discRes, hubsRes, commRes, joinedRes] = await Promise.all([
        fetch(`/api/users?currentUsername=${user?.username || ''}`),
        fetch('/api/posts'),
        fetch('/api/posts/discussions'),
        fetch('/api/hubs'),
        fetch('/api/communities'),
        user ? fetch(`/api/community/joined/${user.username}`) : Promise.resolve({ ok: false })
      ]);

      const allUsersDict = usersRes.ok ? await usersRes.json() : {};
      let allUsers = Object.values(allUsersDict);
      const allPosts = postsRes.ok ? await postsRes.json() : [];
      const discussionsList = discRes.ok ? await discRes.json() : [];
      const hubsList = hubsRes.ok ? await hubsRes.json() : [];
      const commList = commRes.ok ? await commRes.json() : [];
      const joinedCommunities = joinedRes.ok ? await joinedRes.json() : [];

      const followed = user?.following || [];
      const myFollowers = user?.followers || [];
      const myInterests = user?.interests || [];

      const seen = new Set();
      allUsers = allUsers.filter(u => {
        if (seen.has(u.username)) return false;
        seen.add(u.username);
        return true;
      });

      const mutualScore = (candidate) => {
        const f = candidate.followers || [];
        const g = candidate.following || [];
        let score = 0;
        for (const u of followed) { if (f.includes(u)) score += 10; }
        for (const u of myFollowers) { if (f.includes(u)) score += 5; }
        for (const u of [].concat(followed, myFollowers)) { if (g.includes(u)) score += 3; }
        if (myInterests.length > 0 && candidate.interests) {
          const shared = myInterests.filter(i => candidate.interests.includes(i));
          score += shared.length;
        }
        return score;
      };

      const suggested = allUsers
        .filter(u => u.username !== user?.username && !followed.includes(u.username))
        .sort((a, b) => mutualScore(b) - mutualScore(a))
        .slice(0, 10);

      setSuggestedUsers(suggested);

      const scored = allPosts
        .filter(p => p.type !== 'discussion' && p.username !== user?.username)
        .map(p => ({ ...p, score: scorePost(p.content, myInterests, joinedCommunities, commList, p) }))
        .filter(p => p.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      setInterestPosts(scored);

      // Score discussions by interest relevance
      const scoredDiscussions = discussionsList
        .map(d => {
          const text = [d.title, d.content, ...(d.tags || [])].filter(Boolean).join(' ').toLowerCase();
          let score = 0;
          for (const { interest, keywords } of INTEREST_KEYWORDS) {
            if (!myInterests.includes(interest)) continue;
            for (const kw of keywords) {
              if (text.includes(kw)) { score += 3; break; }
            }
          }
          score += Math.min(d.comments || 0, 5);
          return { ...d, _score: score };
        })
        .sort((a, b) => b._score - a._score);

      setDiscussions(scoredDiscussions);
      setHubs(hubsList);
      setCommunities(commList);
      setLoading(false);
    }
    load();
  }, [user]);

  // Search effect
  useEffect(() => {
    if (!query.trim()) {
      setUserResults([]);
      setCommunityResults([]);
      setSearching(false);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const [usersRes, commsRes] = await Promise.all([
          fetch(`/api/users/search?q=${encodeURIComponent(query.trim())}&currentUsername=${encodeURIComponent(user?.username || '')}`),
          fetch(`/api/communities/search?q=${encodeURIComponent(query.trim())}`)
        ]);
        if (usersRes.ok) setUserResults(await usersRes.json());
        if (commsRes.ok) setCommunityResults(await commsRes.json());
      } catch {}
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, user]);

  const handleFollow = async (e, username) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/users/${username}/follow`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentUsername: user?.username }) });
      if (res.ok) {
        setUserResults(prev => prev.map(u => u.username === username ? { ...u, hasPendingRequest: true } : u));
        setSuggestedUsers(prev => prev.map(u => u.username === username ? { ...u, hasPendingRequest: true } : u));
      }
    } catch {}
  };

  const isSearching = query.trim().length > 0;

  if (loading) {
    return (
      <div style={{ padding: '20px', color: 'var(--text-color)', textAlign: 'center' }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="discover-container">
      <div className="discover-header">
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-color)', marginBottom: '4px' }}>
          Discover
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Find people, discussions, and communities you care about
        </p>

        {/* Integrated Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '16px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0 14px' }}>
          <Search size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
          <input
            ref={searchRef}
            style={{ flex: 1, padding: '12px 10px', background: 'none', border: 'none', color: 'var(--text-color)', fontSize: '14px', outline: 'none' }}
            placeholder="Search users, communities..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setUserResults([]); setCommunityResults([]); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', flexShrink: 0 }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      {isSearching ? (
        <div className="discover-grid">
          {searching && userResults.length === 0 && communityResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '14px' }}>Searching...</div>
          ) : userResults.length === 0 && communityResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '14px' }}>
              <Search size={36} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
              No results found for "{query}"
            </div>
          ) : (
            <>
              {/* User Results */}
              {userResults.length > 0 && (
                <div className="discover-widget">
                  <div className="discover-widget-header">
                    <Users size={20} color="var(--primary-color)" />
                    <span className="discover-widget-title">Users</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {userResults.map(u => (
                      <div
                        key={u.username}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'var(--bg-color)', transition: 'background-color 0.2s' }}
                        onClick={() => navigate(`/profile/${u.username}`)}
                      >
                        <Avatar username={u.username} size={40} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-color)' }}>{u.name || u.username}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>@{u.username} · {u.interests?.length || 0} interests</div>
                        </div>
                        <button
                          onClick={(e) => handleFollow(e, u.username)}
                          style={{
                            padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '6px', border: 'none', cursor: 'pointer', flexShrink: 0,
                            backgroundColor: u.hasPendingRequest || user?.following?.includes(u.username) ? 'var(--border-color)' : 'var(--primary-color)',
                            color: u.hasPendingRequest || user?.following?.includes(u.username) ? 'var(--text-secondary)' : '#fff'
                          }}
                        >
                          {user?.following?.includes(u.username) ? 'Following' : u.hasPendingRequest ? 'Requested' : 'Follow'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Community Results */}
              {communityResults.length > 0 && (
                <div className="discover-widget">
                  <div className="discover-widget-header">
                    <MessageSquare size={20} color="var(--primary-color)" />
                    <span className="discover-widget-title">Communities</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {communityResults.map(c => (
                      <div
                        key={c._id}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'var(--bg-color)', transition: 'background-color 0.2s' }}
                        onClick={() => navigate(`/community/${c._id}`)}
                      >
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                          {c.icon || '🏠'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-color)' }}>{c.name}</div>
                            {c.isPrivate ? <Lock size={12} color="var(--text-secondary)" /> : <Globe size={12} color="var(--text-secondary)" />}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</div>
                          <div style={{ fontSize: '11px', color: 'var(--primary-color)', fontWeight: 500, marginTop: '2px' }}>{c.memberCount} members</div>
                        </div>
                        <ChevronRight size={16} color="var(--text-secondary)" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* Normal Discover content — unchanged */
        <div className="discover-grid">
          {/* WIDGET 1: Suggested Connections */}
          <div className="discover-widget" onClick={() => navigate('/discover/connections')} style={{ cursor: 'pointer' }}>
            <div className="discover-widget-header">
              <Users size={20} color="var(--primary-color)" />
              <span className="discover-widget-title" style={{ flex: 1 }}>Suggested Connections</span>
            </div>
            {suggestedUsers.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                No suggestions yet — follow more people to get recommendations
              </div>
            ) : (
              <div className="scroll-row">
                {suggestedUsers.map(u => (
                  <div key={u._id || u.username} className="scroll-card" onClick={(e) => { e.stopPropagation(); navigate(`/profile/${u.username}`); }}>
                    <Avatar username={u.username} size={56} />
                    <div style={{ textAlign: 'center', width: '100%', overflow: 'hidden' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name || u.username}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.interests?.slice(0, 1).join(', ') || 'New here'}</div>
                    </div>
                    <button
                      onClick={(e) => handleFollow(e, u.username)}
                      style={{ width: '100%', padding: '6px 0', backgroundColor: user?.following?.includes(u.username) ? 'var(--border-color)' : (u.hasPendingRequest ? 'var(--border-color)' : 'var(--primary-color)'), border: 'none', borderRadius: '6px', color: user?.following?.includes(u.username) || u.hasPendingRequest ? 'var(--text-secondary)' : '#fff', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
                    >
                      {user?.following?.includes(u.username) ? 'Following' : (u.hasPendingRequest ? 'Requested' : 'Follow')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* WIDGET 2: Shared Interest Posts */}
          <div className="discover-widget" onClick={() => navigate('/discover/posts')} style={{ cursor: 'pointer' }}>
            <div className="discover-widget-header">
              <MessageSquare size={20} color="var(--primary-color)" />
              <span className="discover-widget-title" style={{ flex: 1 }}>Shared Interest Posts</span>
            </div>
            {interestPosts.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                No posts match your interests yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {interestPosts.slice(0, 4).map(post => (
                  <div key={post._id} style={{ display: 'flex', gap: '12px', padding: '8px', borderRadius: '8px', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); navigate(`/discussion/${post._id}`); }}>
                    <Avatar username={post.username} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-color)' }}>{post.username}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-color)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.content || '📸 Photo post'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{post.likes} likes · {post.comments} comments</div>
                    </div>
                    {post.image && <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--border-color)', flexShrink: 0, overflow: 'hidden' }}><img src={post.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* WIDGET 3: Active Discussions */}
          <div className="discover-widget" onClick={() => navigate('/discussions')} style={{ cursor: 'pointer' }}>
            <div className="discover-widget-header">
            <MessageCircle size={20} color="var(--primary-color)" />
            <span className="discover-widget-title">Active Discussions</span>
          </div>
            {discussions.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                <MessageCircle size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
                No active discussions yet.<br />
                Start a conversation and build your community.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {discussions.slice(0, 4).map(d => (
                  <div key={d._id} className="discover-widget-row" onClick={(e) => { e.stopPropagation(); navigate(`/discussion/${d._id}`); }}>
                    <Avatar username={d.username} size={22} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text-color)', marginBottom: '4px' }}>{d.title || 'Untitled discussion'}</div>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', alignItems: 'center' }}>
                        <span>{d.username}</span>
                        <span>·</span>
                        <span>{timeAgo(d.createdAt)}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--primary-color)', fontWeight: 500 }}>{d.comments} {d.comments === 1 ? 'reply' : 'replies'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* WIDGET 4: Interest Hubs */}
          <div className="discover-widget" onClick={() => navigate('/hubs')} style={{ cursor: 'pointer' }}>
            <div className="discover-widget-header">
              <span style={{ fontSize: '20px' }}>🏠</span>
              <span className="discover-widget-title" style={{ flex: 1 }}>Interest Hubs</span>
            </div>
            {hubs.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                No hubs available yet — seed them from the server
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {hubs.slice(0, 4).map(hub => (
                  <div
                    key={hub._id}
                    className="discover-widget-row"
                    onClick={(e) => { e.stopPropagation(); navigate(`/hubs?hub=${hub._id}`); }}
                  >
                    <span style={{ fontSize: '22px' }}>{hub.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-color)' }}>{hub.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{hub.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
