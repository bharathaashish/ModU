import { useAuth } from '../context/AuthContext';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Heart, MessageCircle, Image as ImageIcon, Search, X, ChevronDown } from 'lucide-react';
import Avatar from '../components/Avatar';

const INTEREST_KEYWORDS = [
  { interest: 'gaming', keywords: ['valorant', 'minecraft', 'elden ring', 'gaming', 'game', 'games', 'gamer', 'nintendo', 'playstation', 'xbox', 'pc gaming', 'league of legends', 'fortnite', 'call of duty', 'gta', 'roblox', 'steam', 'esports', 'speedrun', 'retro', 'arcade', 'rpg', 'fps'] },
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

function scoreDiscoverPost(post, userInterests, userCommunities, allCommunities, allUsers) {
  const text = [post.content || '', post.title || '', ...(post.tags || [])].filter(Boolean).join(' ').toLowerCase();
  let score = 0;
  const matchedInterests = new Set();
  const hasInterests = Array.isArray(userInterests) && userInterests.length > 0;

  // Direct interest keyword matches (high weight)
  for (const { interest, keywords } of INTEREST_KEYWORDS) {
    if (!hasInterests || userInterests.includes(interest)) {
      for (const kw of keywords) {
        if (text.includes(kw)) {
          matchedInterests.add(interest);
          score += 4;
          break;
        }
      }
    }
  }

  // Bonus for exact interest match
  if (hasInterests) {
    for (const interest of userInterests) {
      if (matchedInterests.has(interest)) score += 5;
    }
  }

  // Community boost
  if (Array.isArray(userCommunities)) {
    const joinedIds = new Set(userCommunities.map(c => typeof c === 'object' ? c._id : c));
    if (post.community && joinedIds.has(post.community)) {
      score += 8;
    }
  }

  // Engagement boost
  if (post.likes > 0) score += Math.min(post.likes, 8);
  if (post.comments > 0) score += Math.min(post.comments, 5);

  // Broader discovery: if no interests matched but post has tags
  if (hasInterests && matchedInterests.size === 0) {
    const postOwner = allUsers?.find(u => u.username === post.username);
    if (postOwner?.interests) {
      const shared = userInterests.filter(i => postOwner.interests.includes(i));
      if (shared.length > 0) score += 6; // Connected through author's interests
    }
    // Tags that relate to adjacent interest categories
    if (post.tags?.length > 0) {
      score += 2;
    }
  }

  return score;
}

export default function SharedInterestPosts() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [allCommunities, setAllCommunities] = useState([]);
  const [joinedCommunities, setJoinedCommunities] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState('trending');

  useEffect(() => {
    async function load() {
      const [postsRes, commRes, joinedRes, usersRes] = await Promise.all([
        fetch(`/api/posts?currentUsername=${user?.username || ''}`),
        fetch('/api/communities'),
        user ? fetch(`/api/community/joined/${user.username}`) : Promise.resolve({ ok: false }),
        fetch(`/api/users?currentUsername=${user?.username || ''}`)
      ]);

      const fetchedPosts = postsRes.ok ? await postsRes.json() : [];
      const fetchedCommunities = commRes.ok ? await commRes.json() : [];
      const fetchedJoined = joinedRes.ok ? await joinedRes.json() : [];
      const allUsersDict = usersRes.ok ? await usersRes.json() : {};
      const fetchedUsers = Object.values(allUsersDict);

      setAllPosts(fetchedPosts);
      setAllCommunities(fetchedCommunities);
      setJoinedCommunities(fetchedJoined);
      setAllUsers(fetchedUsers);

      const myInterests = user?.interests || [];

      const scored = fetchedPosts
        .filter(p => p.type !== 'discussion' && p.type !== 'story' && p.username !== user?.username)
        .map(p => ({ ...p, _score: scoreDiscoverPost(p, myInterests, fetchedJoined, fetchedCommunities, fetchedUsers) }))
        .filter(p => p._score > 0 || (p.tags?.length > 0))
        .sort((a, b) => {
          const scoreDiff = b._score - a._score;
          if (Math.abs(scoreDiff) > 5) return scoreDiff;
          return Math.random() - 0.5;
        });

      setPosts(scored);
      setLoading(false);
    }
    load();
  }, [user]);

  const sortPosts = (list) => {
    const now = Date.now();
    const sorted = [...list];
    if (sortMode === 'recent') {
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortMode === 'popular') {
      sorted.sort((a, b) => ((b.likes || 0) + (b.comments || 0)) - ((a.likes || 0) + (a.comments || 0)));
    } else {
      sorted.sort((a, b) => {
        const engagementA = (a.likes || 0) + (a.comments || 0) + 1;
        const hoursAgeA = (now - new Date(a.createdAt).getTime()) / 3600000;
        const scoreA = engagementA / Math.pow((hoursAgeA + 2), 1.5);
        const engagementB = (b.likes || 0) + (b.comments || 0) + 1;
        const hoursAgeB = (now - new Date(b.createdAt).getTime()) / 3600000;
        const scoreB = engagementB / Math.pow((hoursAgeB + 2), 1.5);
        return scoreB - scoreA;
      });
    }
    return sorted;
  };

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortPosts(posts);

    const scored = allPosts
      .filter(p => p.type !== 'discussion' && p.type !== 'story')
      .map(p => {
        const title = (p.title || '').toLowerCase();
        const content = (p.content || '').toLowerCase();
        const tags = (p.tags || []).join(' ').toLowerCase();
        let score = 0;

        if (title.includes(q)) score += 10;
        if (tags.includes(q)) score += 5;
        if (content.includes(q)) score += 2;

        return { ...p, _searchScore: score };
      })
      .filter(p => p._searchScore > 0);

    return sortPosts(scored);
  }, [posts, allPosts, searchQuery, sortMode]);

  if (loading) {
    return (
      <div className="discover-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '2px solid var(--border-color)', borderTopColor: 'var(--text-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="discover-container">
      <div className="discover-header">
        <button
          onClick={() => navigate('/discover')}
          style={{ background: 'none', border: 'none', padding: '0 0 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px' }}
        >
          <ArrowLeft size={16} />
          Back to Discover
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-color)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MessageSquare size={24} color="var(--text-color)" />
          Shared Interest Posts
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Discover posts from across the platform — curated around your interests with room for exploration
        </p>
      </div>

      {/* Search bar */}
      <div className="discussion-search-bar" style={{ margin: '0 0 16px' }}>
        <Search size={16} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
        <input
          type="search"
          placeholder="Search posts, tags, users..."
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
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 0 12px' }}>
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

      {filteredPosts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-secondary)' }}>
          <MessageSquare size={40} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
          <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '6px' }}>{searchQuery.trim() ? 'No posts found' : 'No posts to discover yet'}</div>
          <div style={{ fontSize: '14px' }}>{searchQuery.trim() ? 'Try a broader search term or clear the filter.' : 'Set more interests or follow communities to find relevant content'}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredPosts.map(post => (
            <div
              key={post._id}
              className="flat-card"
              style={{ padding: '14px 16px', cursor: 'pointer' }}
              onClick={() => navigate(`/discussion/${post._id}`)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <Avatar username={post.username} image={post.profilePhoto} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-color)' }}>
                    {post.username}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                    {timeAgo(post.createdAt)}
                  </div>
                </div>
              </div>

              {post.content && (
                <div style={{ fontSize: '14px', color: 'var(--text-color)', marginBottom: '10px', lineHeight: 1.5 }}>
                  {post.content.length > 200 ? post.content.slice(0, 200) + '...' : post.content}
                </div>
              )}

              {post.image && (
                <div style={{
                  width: '100%', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px',
                  backgroundColor: 'var(--border-color)', maxHeight: '240px'
                }}>
                  <img src={post.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', maxHeight: '240px' }} />
                </div>
              )}

              {post.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {post.tags.map(tag => (
                    <span key={tag} style={{
                      fontSize: '12px', color: 'var(--text-color)', fontWeight: 500
                    }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Heart size={14} /> {post.likes || 0}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MessageCircle size={14} /> {post.comments || 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
