import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, UserPlus, UserCheck } from 'lucide-react';
import Avatar from '../components/Avatar';

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

export default function SuggestedConnections() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [usersRes, commRes, joinedRes] = await Promise.all([
        fetch(`/api/users?currentUsername=${user?.username || ''}`),
        fetch('/api/communities'),
        user ? fetch(`/api/community/joined/${user.username}`) : Promise.resolve({ ok: false })
      ]);

      const allUsersDict = usersRes.ok ? await usersRes.json() : {};
      let allUsers = Object.values(allUsersDict);
      const allCommunities = commRes.ok ? await commRes.json() : [];
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

      const computeScore = (candidate) => {
        const f = candidate.followers || [];
        const g = candidate.following || [];
        let score = 0;

        // Shared interests: high weight
        if (myInterests.length > 0 && candidate.interests) {
          const shared = myInterests.filter(i => candidate.interests.includes(i));
          score += shared.length * 15;
          // Bonus if bio/keywords also match interests
          const bio = (candidate.bio || '').toLowerCase();
          for (const { interest, keywords } of INTEREST_KEYWORDS) {
            if (myInterests.includes(interest)) {
              for (const kw of keywords) {
                if (bio.includes(kw)) { score += 3; break; }
              }
            }
          }
        }

        // Mutual followers: I follow X, X follows candidate
        for (const u of followed) {
          if (f.includes(u)) score += 12;
          if (g.includes(u)) score += 4;
        }

        // My followers who also follow candidate
        for (const u of myFollowers) {
          if (f.includes(u)) score += 8;
          if (g.includes(u)) score += 3;
        }

        // Common communities
        if (joinedCommunities.length > 0) {
          const candidateCommNames = new Set((candidate.communities || []).map(c =>
            typeof c === 'object' ? c._id : c
          ));
          for (const jc of joinedCommunities) {
            if (candidateCommNames.has(jc._id)) {
              score += 10;
            }
          }
        }

        // Shared community interests
        if (allCommunities.length > 0 && joinedCommunities.length > 0) {
          for (const community of allCommunities) {
            const joinedIds = new Set(joinedCommunities.map(c =>
              typeof c === 'object' ? c._id : c
            ));
            if (joinedIds.has(community._id)) {
              const candidateCommIds = new Set((candidate.communities || []).map(c =>
                typeof c === 'object' ? c._id : c
              ));
              if (candidateCommIds.has(community._id) &&
                  community.interests?.some(i => myInterests?.includes(i))) {
                score += 5;
              }
            }
          }
        }

        // Interaction history: if candidate follows me
        if (g.includes(user?.username)) score += 6;

        return score;
      };

      const suggested = allUsers
        .filter(u => u.username !== user?.username && !followed.includes(u.username))
        .map(u => ({ ...u, _score: computeScore(u) }))
        .sort((a, b) => b._score - a._score);

      setSuggestedUsers(suggested);
      setLoading(false);
    }
    load();
  }, [user]);

  const handleFollow = async (username) => {
    try {
      const res = await fetch(`/api/users/${username}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUsername: user?.username })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        updateUser(updatedUser);
        setSuggestedUsers(prev => prev.filter(u => u.username !== username));
      }
    } catch (err) {
      console.error('Follow error:', err);
    }
  };

  if (loading) {
    return (
      <div className="discover-container">
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '14px' }}>Loading...</div>
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
          <Users size={24} color="var(--primary-color)" />
          Suggested Connections
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          People you might know — based on shared interests, communities, and networks
        </p>
      </div>

      {suggestedUsers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-secondary)' }}>
          <Users size={40} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
          <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '6px' }}>No suggestions yet</div>
          <div style={{ fontSize: '14px' }}>Follow more people and join communities to get better recommendations</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {suggestedUsers.map(u => {
            const sharedInterests = user?.interests?.filter(i => u.interests?.includes(i)) || [];
            return (
              <div
                key={u._id || u.username}
                className="flat-card"
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px',
                  cursor: 'pointer'
                }}
                onClick={() => navigate(`/profile/${u.username}`)}
              >
                <Avatar username={u.username} size={48} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-color)' }}>
                    {u.name || u.username}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                    @{u.username}
                  </div>
                  {u.bio && (
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.bio}
                    </div>
                  )}
                  {sharedInterests.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {sharedInterests.slice(0, 3).map(i => (
                        <span key={i} className="pill-chip" style={{ fontSize: '11px', padding: '2px 8px' }}>
                          {i}
                        </span>
                      ))}
                      {sharedInterests.length > 3 && (
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', padding: '2px 6px' }}>
                          +{sharedInterests.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleFollow(u.username); }}
                  style={{
                    padding: '8px 16px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: 'none',
                    cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px',
                    backgroundColor: u.hasPendingRequest ? 'var(--border-color)' : 'var(--primary-color)',
                    color: u.hasPendingRequest ? 'var(--text-secondary)' : '#fff'
                  }}
                >
                  {u.hasPendingRequest ? <UserPlus size={14} /> : <UserCheck size={14} />}
                  {u.hasPendingRequest ? 'Requested' : 'Follow'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
