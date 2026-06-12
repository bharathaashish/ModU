import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { Heart, MessageCircle, Send, Plus, Check, MoreHorizontal, Lock } from 'lucide-react';
import PostModal from '../components/PostModal';
import StoryCreator from '../components/StoryCreator';
import StoryViewer from '../components/StoryViewer';
import PostViewer from '../components/PostViewer';
import ConfirmModal from '../components/ConfirmModal';

const VIEWED_POSTS_KEY = 'modu_viewed_posts';

const getViewedPosts = (username) => {
  if (!username) return {};
  try {
    const raw = localStorage.getItem(`${VIEWED_POSTS_KEY}_${username}`);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

const markPostAsViewed = (postId, username) => {
  if (!username || !postId) return;
  const key = `${VIEWED_POSTS_KEY}_${username}`;
  const current = getViewedPosts(username);
  current[postId] = Date.now();
  try { localStorage.setItem(key, JSON.stringify(current)); } catch {}
};

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function Home() {
  const { user, updateUser, refreshNotifications } = useAuth();
  const navigate = useNavigate();
  const feedFilter = user?.feedPreference || 'Friends';
  
  const [stories, setStories] = useState([]);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showStoryCreator, setShowStoryCreator] = useState(false);
  const [viewingStories, setViewingStories] = useState(null);
  const [storyRefreshKey, setStoryRefreshKey] = useState(0);

  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/posts?currentUsername=${user?.username || ''}`);
        // Fetch stories from independent API
        let storiesData = [];
        try {
          const storiesRes = await fetch(`/api/stories?currentUsername=${user?.username || ''}`);
          if (storiesRes.ok) storiesData = await storiesRes.json();
        } catch (e) { console.warn('Failed to fetch stories:', e); }
        if (res.ok) {
          const allContent = await res.json();
          const following = user?.following || [];
          const username = user?.username;

          const allPosts = allContent.filter(p => p.type !== 'discussion' && !p.communityId && !p.channel);

          // CLIENT-SIDE PRIVACY SAFETY NET — verify server filtered correctly
          // Fetch user privacy data for defense-in-depth
          let usersDict = {};
          try {
            const usersRes = await fetch(`/api/users?currentUsername=${username}`);
            if (usersRes.ok) usersDict = await usersRes.json();
          } catch (e) { console.warn('[PRIVACY] could not fetch user dict for safety net:', e); }

          const canView = (post) => {
            const ownerInfo = usersDict[post.username];
            if (!ownerInfo) return true;
            if (!ownerInfo.isPrivate) {
              console.log(`[PRIVACY-CLIENT] post by ${post.username} (PUBLIC) → VISIBLE`);
              return true;
            }
            if (post.username === username) {
              console.log(`[PRIVACY-CLIENT] post by ${post.username} (PRIVATE, own) → VISIBLE`);
              return true;
            }
            const isFollower = following.includes(post.username);
            console.log(`[PRIVACY-CLIENT] post by ${post.username} (PRIVATE) following=${isFollower} → ${isFollower ? 'VISIBLE' : 'HIDDEN'}`);
            return isFollower;
          };

          const visiblePosts = allPosts.filter(canView);
          const hiddenPostsCount = allPosts.length - visiblePosts.length;
          if (hiddenPostsCount > 0) console.log(`[PRIVACY-CLIENT] client-side filtered ${hiddenPostsCount} private posts`);

          // Keyword lists per interest for implicit caption-based detection
          const INTEREST_KEYWORDS = {
            gaming: ['gaming', 'game', 'gamer', 'setup', 'console', 'pc', 'playstation', 'xbox', 'nintendo', 'steam', 'fps', 'rpg', 'multiplayer', 'esports', 'stream', 'twitch', 'gg', 'win', 'level', 'quest', 'boss', 'raid', 'loot', 'skin', 'mods'],
            anime: ['anime', 'manga', 'naruto', 'one piece', 'attack on titan', 'demon slayer', 'jujutsu', 'kaisen', 'waifu', 'otaku', 'crunchyroll', 'shonen', 'seinen', 'cosplay', 'hentai', 'studio ghibli', 'dragon ball', 'pokemon', 'my hero', 'aot', 'bleach', 'one punch'],
            fitness: ['fitness', 'gym', 'workout', 'exercise', 'training', 'muscle', 'weight', 'cardio', 'yoga', 'protein', 'healthy', 'strength', 'run', 'running', 'squat', 'deadlift', 'bench', 'abs', 'fat loss', 'gains', 'reps', 'sets', 'pilates', 'crossfit'],
            technology: ['tech', 'technology', 'ai', 'artificial intelligence', 'coding', 'programming', 'software', 'hardware', 'app', 'startup', 'innovation', 'robot', 'blockchain', 'crypto', 'bitcoin', 'machine learning', 'data', 'cloud', 'cyber', 'gadget', 'iphone', 'android', 'computer', 'laptop', 'developer', 'code'],
            travel: ['travel', 'trip', 'vacation', 'journey', 'adventure', 'explore', 'wanderlust', 'destination', 'tourist', 'backpack', 'hike', 'hiking', 'beach', 'mountain', 'city', 'road trip', 'flight', 'hotel', 'resort', 'cruise', 'camping', 'abroad', 'nomad', 'passport', 'sightseeing'],
            food: ['food', 'recipe', 'cooking', 'baking', 'delicious', 'yummy', 'dinner', 'lunch', 'breakfast', 'tasty', 'restaurant', 'chef', 'cuisine', 'pizza', 'pasta', 'burger', 'sushi', 'dessert', 'chocolate', 'vegan', 'vegetarian', 'spicy', 'gourmet', 'homemade', 'kitchen', 'bbq', 'grill']
          };

          const scorePost = (post) => {
            const text = (post.content || '').toLowerCase();
            const interests = user?.interests || [];
            if (!interests || interests.length === 0) return 0;

            let score = 0;
            for (const interest of interests) {
              const keywords = INTEREST_KEYWORDS[interest] || [];
              for (const kw of keywords) {
                if (text.includes(kw)) score += 2;
              }
            }
            if (score === 0) return 0;
            if (post.comments) score += Math.min(post.comments, 4);
            return score;
          };

          // Mutual connection scoring — friend-of-friend overlap
          const mutualScore = (postOwnerUsername) => {
            const ownerInfo = usersDict[postOwnerUsername];
            if (!ownerInfo) return 0;
            const ownerFollowers = ownerInfo.followers || [];
            const ownerFollowing = ownerInfo.following || [];
            const myFollowing = following || [];
            const myFollowers = user?.followers || [];

            let score = 0;
            // HIGH: People I follow who also follow this post author
            for (const f of myFollowing) {
              if (ownerFollowers.includes(f)) score += 10;
            }
            // MEDIUM: People who follow me and also follow this post author
            for (const f of myFollowers) {
              if (ownerFollowers.includes(f)) score += 5;
            }
            // MEDIUM: People I follow that this post author also follows
            for (const f of myFollowing) {
              if (ownerFollowing.includes(f)) score += 3;
            }
            return score;
          };

          // Combined score: mutual connections dominate, interests secondary, baseline for discovery
          const combinedScore = (post) => {
            const mutual = mutualScore(post.username);
            const interest = scorePost(post);
            const baseline = 0.1;
            return mutual * 100 + interest + baseline;
          };

          // Separate into categories — suggested posts sorted by mutual connections first, then interests
          // Privacy filtering is already done server-side; this uses only visible posts
          const followingPosts = visiblePosts.filter(post => following.includes(post.username) || post.username === username);
          const suggestedPosts = visiblePosts
            .filter(post => !following.includes(post.username) && post.username !== username)
            .map(post => ({ ...post, score: combinedScore(post) }));

          const hasInterestPreferences = Array.isArray(user?.interests) && user.interests.length > 0;
          const rankedSuggested = hasInterestPreferences
            ? suggestedPosts.filter(post => post.score > 0).sort((a, b) => b.score - a.score)
            : suggestedPosts.sort((a, b) => b.score - a.score);

          let activePosts;
          const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
          if (feedFilter === 'Friends') {
            const viewedPostsMap = getViewedPosts(username);
            const now = Date.now();
            // Only followed users' posts, no injected content
            const friendPosts = followingPosts.filter(post => {
              const viewedTime = viewedPostsMap[post._id];
              if (!viewedTime) return true; // unviewed — never expires
              const postAge = now - new Date(post.createdAt).getTime();
              return postAge <= SEVEN_DAYS_MS; // viewed but fresh enough
            });
            // Sort: unviewed oldest-first, then viewed newest-first
            friendPosts.sort((a, b) => {
              const aViewed = !!viewedPostsMap[a._id];
              const bViewed = !!viewedPostsMap[b._id];
              if (aViewed !== bViewed) return aViewed ? 1 : -1;
              if (!aViewed) return new Date(a.createdAt) - new Date(b.createdAt);
              return new Date(b.createdAt) - new Date(a.createdAt);
            });
            activePosts = friendPosts;
          } else if (feedFilter === 'Suggested') {
            const viewedPostsMap = getViewedPosts(username);
            // Filter out viewed suggested posts — never show again in Home
            const freshSuggested = rankedSuggested
              .filter(post => !viewedPostsMap[post._id]);
            if (followingPosts.length === 0) {
              // No friend content — 100% suggested
              activePosts = freshSuggested;
            } else {
              // 2:1 interleave (Suggested : Friend)
              const interleaved = [];
              let sIdx = 0, fIdx = 0;
              while (sIdx < freshSuggested.length || fIdx < followingPosts.length) {
                for (let i = 0; i < 2 && sIdx < freshSuggested.length; i++) {
                  interleaved.push(freshSuggested[sIdx++]);
                }
                if (fIdx < followingPosts.length) {
                  interleaved.push(followingPosts[fIdx++]);
                }
              }
              activePosts = interleaved;
            }
          } else {
            // Balanced: 2 Friends : 1 Suggested
            const viewedPostsMap = getViewedPosts(username);
            const now = Date.now();
            // Friend posts follow Friends mode rules
            const friendPosts = followingPosts.filter(post => {
              const viewedTime = viewedPostsMap[post._id];
              if (!viewedTime) return true;
              const postAge = now - new Date(post.createdAt).getTime();
              return postAge <= SEVEN_DAYS_MS;
            });
            friendPosts.sort((a, b) => {
              const aViewed = !!viewedPostsMap[a._id];
              const bViewed = !!viewedPostsMap[b._id];
              if (aViewed !== bViewed) return aViewed ? 1 : -1;
              if (!aViewed) return new Date(a.createdAt) - new Date(b.createdAt);
              return new Date(b.createdAt) - new Date(a.createdAt);
            });
            // Suggested posts follow Suggested mode rules
            const freshSuggested = rankedSuggested
              .filter(post => !viewedPostsMap[post._id]);
            // 2:1 interleave (Friends : Suggested)
            const interleaved = [];
            let fIdx = 0, sIdx = 0;
            while (fIdx < friendPosts.length || sIdx < freshSuggested.length) {
              for (let i = 0; i < 2 && fIdx < friendPosts.length; i++) {
                interleaved.push(friendPosts[fIdx++]);
              }
              if (sIdx < freshSuggested.length) {
                interleaved.push(freshSuggested[sIdx++]);
              }
            }
            activePosts = interleaved;
          }

                  const activeStories = storiesData.filter(story => following.includes(story.author) || story.author === username);
          setFeed(activePosts);
          setStories(activeStories);
        }
      } catch (err) {
        console.error('Failed to fetch feed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, [user, feedFilter, showPostModal, storyRefreshKey]);

  const handleLikeUpdate = useCallback((updatedPost) => {
    setFeed(prevFeed => 
      prevFeed.map(p => p._id === updatedPost._id ? updatedPost : p)
    );
    if (selectedPost?._id === updatedPost._id) {
      setSelectedPost(updatedPost);
    }
  }, [selectedPost]);

  const handleDirectLike = async (post, e) => {
    e.stopPropagation();
    console.log("HOME LIKE CLICKED - user:", user?.username, "post:", post?._id);
    if (!user) {
      console.log("HOME LIKE FAILED: user is null");
      return;
    }
    try {
      const res = await fetch(`/api/posts/${post._id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
      });
      console.log("HOME LIKE API response status:", res.status);
      if (res.ok) {
        const updatedPost = await res.json();
        console.log("HOME LIKE updated post:", updatedPost);
        handleLikeUpdate(updatedPost);
        refreshNotifications();
      } else {
        const error = await res.json();
        console.log("HOME LIKE API error:", error);
      }
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleDirectShare = async (post, e) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/post/${post._id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user?.username })
      });
      if (res.ok) {
        setFeed(prev => prev.filter(p => p._id !== postId));
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const FeedItem = ({ post }) => {
    const isLiked = post.likedBy?.includes(user?.username);
    const lastTapRef = useRef(0);
    const [showHeart, setShowHeart] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const itemRef = useRef(null);
    const observedRef = useRef(false);

    // Mark post as viewed when it enters the viewport
    useEffect(() => {
      if (!user?.username) return;
      if (observedRef.current) return;
      const el = itemRef.current;
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            observedRef.current = true;
            markPostAsViewed(post._id, user.username);
            observer.disconnect();
          }
        },
        { threshold: 0.5 }
      );
      observer.observe(el);
      return () => observer.disconnect();
    }, [post._id, user?.username]);

    const handleImageClick = (e) => {
      const now = Date.now();
      const timeSince = now - lastTapRef.current;
      lastTapRef.current = now;
      if (timeSince < 300 && timeSince > 0) {
        // Double tap
        if (!isLiked) {
          handleDirectLike(post, e);
        }
        setShowHeart(true);
        setTimeout(() => setShowHeart(false), 800);
      } else {
        markPostAsViewed(post._id, user?.username);
        setSelectedPost(post);
      }
    };
    
    return (
      <>
      <div className="feed-item" ref={itemRef}>
        <div className="feed-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1, minWidth: 0 }} onClick={() => navigate(`/profile/${post.username}`)}>
            <Avatar username={post.username} image={post.profilePhoto} size={32} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', lineHeight: 1.3 }}>{post.username}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{timeAgo(post.createdAt)}</div>
            </div>
          </div>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}
            >
              <MoreHorizontal size={20} />
            </button>
            {showMenu && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setShowMenu(false)} />
                <div style={{
                  position: 'absolute', top: '100%', right: 0, zIndex: 51,
                  backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)',
                  borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  minWidth: '160px', overflow: 'hidden'
                }}>
                  {post.username === user?.username && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowMenu(false); setShowDeleteConfirm(true); }}
                      style={{
                        width: '100%', padding: '10px 14px', background: 'none', border: 'none',
                        color: 'var(--text-color)', fontSize: '14px', cursor: 'pointer', textAlign: 'left', fontWeight: 500
                      }}
                    >
                      Delete Post
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          {post.image && (
            <div 
              className="feed-image" 
              style={{ backgroundImage: `url(${post.image})`, backgroundSize: 'cover', cursor: 'pointer' }}
              onClick={handleImageClick}
            />
          )}
          {showHeart && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              pointerEvents: 'none', zIndex: 5,
              animation: 'heartPop 0.8s ease-out'
            }}>
              <Heart size={80} fill="white" color="white" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }} />
            </div>
          )}
        </div>
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
            <button 
              onClick={(e) => handleDirectLike(post, e)}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}
            >
              <Heart 
                size={24} 
                style={{ cursor: 'pointer', color: isLiked ? 'var(--text-color)' : 'var(--text-color)', fill: isLiked ? 'var(--text-color)' : 'none', transition: 'all 0.2s' }} 
              />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); markPostAsViewed(post._id, user?.username); setSelectedPost(post); }}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}
            >
              <MessageCircle size={24} style={{ cursor: 'pointer', color: 'var(--text-color)' }} />
            </button>
            <button 
              onClick={(e) => handleDirectShare(post, e)}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}
            >
              <Send size={24} style={{ cursor: 'pointer', color: 'var(--text-color)' }} />
            </button>
          </div>
          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
            {post.likes > 0 && post.likedBy?.[0] ? (
              <span>Liked by <strong>{post.likedBy[0]}</strong>{post.likes > 1 ? ` and ${post.likes - 1} others` : ''}</span>
            ) : (
              <span>{post.likes || 0} likes</span>
            )}
          </div>
          <div style={{ fontSize: '14px' }}>
            <span style={{ fontWeight: 600, marginRight: '8px', cursor: 'pointer' }} onClick={() => navigate(`/profile/${post.username}`)}>{post.username}</span>
            {post.content}
          </div>
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
          onConfirm={async () => {
            try {
              const res = await fetch(`/api/posts/${post._id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user?.username })
              });
              if (res.ok) {
                setFeed(prev => prev.filter(p => p._id !== post._id));
                setShowDeleteConfirm(false);
              } else {
                const errData = await res.json().catch(() => ({}));
                console.error('Delete post failed:', res.status, errData);
                setShowDeleteConfirm(false);
              }
            } catch (err) {
              console.error('Delete post error:', err);
              setShowDeleteConfirm(false);
            }
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
      </>
    );
  };

  return (
    <>
      <main className="main-content" style={{ padding: '16px 0', maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Stories Section */}
        <div className="stories-container">
          {/* Your Story */}
          <div style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => {
            const myStories = stories.filter(s => s.author === user?.username);
            if (myStories.length > 0) {
              setViewingStories({ stories: myStories, index: 0 });
            } else {
              setShowStoryCreator(true);
            }
          }}>
            {(() => {
              const myStories = stories.filter(s => s.author === user?.username);
              const firstStory = myStories[0];
  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)', zIndex: 100 }}>
        <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '2px solid var(--border-color)', borderTopColor: 'var(--text-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
                <>
                  <div className="story-circle" style={{ position: 'relative' }}>
                    <div className="story-circle-inner" style={firstStory ? { backgroundImage: `url(${firstStory.media})` } : { display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)' }}>
                      {!firstStory && <Plus size={20} color="var(--text-color)" strokeWidth={2.5} />}
                    </div>
                    {myStories.length > 0 && (
                      <div style={{ position: 'absolute', bottom: '0', right: '0', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--active-color)', border: '2px solid var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                        <Plus size={12} color="#fff" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: '10px', display: 'block', textAlign: 'center', marginTop: '4px', color: 'var(--text-secondary)' }}>Your Story</span>
                </>
              );
            })()}
          </div>

          {/* Friend Stories */}
          {!loading && stories.filter(s => s.author !== user?.username).reduce((acc, story) => {
            if (!acc.find(s => s.author === story.author)) acc.push(story);
            return acc;
          }, []).map((userStory) => {
            const authorStories = stories.filter(s => s.author === userStory.author);
            const allViewed = authorStories.every(s => s.viewers?.includes(user?.username));
            const firstStory = authorStories[0];
            return (
            <div key={userStory.author} style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => setViewingStories({ stories: authorStories, index: 0 })}>
              <div className={`story-circle${allViewed ? ' viewed' : ''}`} style={{ background: authorStories.some(s => s.audience === 'close_friends') ? '' : '' }}>
                <div className="story-circle-inner" style={{ backgroundImage: firstStory.media ? `url(${firstStory.media})` : 'none' }} />
                {authorStories.some(s => s.audience === 'close_friends') && (
                  <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'var(--text-color)', border: '2px solid var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Lock size={8} color="#fff" />
                  </div>
                )}
              </div>
              <span style={{ fontSize: '10px', display: 'block', textAlign: 'center', marginTop: '4px', color: 'var(--text-color)' }}>{userStory.author}</span>
            </div>
            );
          })}
        </div>

        {/* Feed Section */}
        <div style={{ padding: '0 16px', marginTop: '24px' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                <div className="spinner" />
              </div>
            ) : feed.length > 0 ? (
              <>
                {feed.map((post, i) => (
                  <FeedItem key={i} post={post} />
                ))}
                <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--border-color)', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 12px' }}>
                    <Check size={24} color="var(--text-secondary)" />
                  </div>
                  <p style={{ fontSize: '14px', margin: 0 }}>
                    {feedFilter === 'Friends' || feedFilter === 'Balanced' ? "You're all caught up with your friends." : "You're all caught up"}
                  </p>
                  <p style={{ fontSize: '13px', margin: '4px 0 0 0' }}>Check back later for more updates</p>
                </div>
              </>
            ) : feedFilter === 'Friends' || feedFilter === 'Balanced' ? (
              <div style={{ padding: '48px 16px', textAlign: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid var(--border-color)', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 16px' }}>
                  <Check size={28} color="var(--text-secondary)" />
                </div>
                <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-color)', margin: '0 0 4px' }}>You're all caught up with your friends.</p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 20px' }}>Discover new people to follow</p>
                <button
                  onClick={() => navigate('/discover')}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '20px',
                    border: 'none',
                    backgroundColor: 'var(--active-color)',
                    color: 'var(--active-text)',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Discover
                </button>
              </div>
            ) : (
              <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ color: 'var(--text-color)', marginBottom: '8px', fontWeight: '600' }}>No posts yet.</h3>
                <p>Create a post to get started!</p>
              </div>
            )}
        </div>

        {/* Floating Post Button */}
        <button
          onClick={() => setShowPostModal(true)}
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '16px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: "var(--active-color)",
            border: 'none',
            color: 'var(--active-text)',
            fontSize: '24px',
            cursor: 'pointer',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Plus size={28} />
        </button>
      </main>

      <PostModal
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        onPostSuccess={() => {
          setShowPostModal(false);
        }}
      />
      <StoryCreator
        isOpen={showStoryCreator}
        onClose={() => setShowStoryCreator(false)}
        onPostSuccess={() => {
          setShowStoryCreator(false);
          setStoryRefreshKey(k => k + 1);
        }}
      />
      {viewingStories && (
        <StoryViewer
          stories={viewingStories.stories}
          initialIndex={viewingStories.index}
          onClose={() => setViewingStories(null)}
        />
      )}
      <PostViewer 
        post={selectedPost} 
        onClose={() => setSelectedPost(null)}
        onLikeUpdate={handleLikeUpdate}
      />
    </>
  );
}
