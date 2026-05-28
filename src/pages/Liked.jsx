import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Liked() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [likedPosts, setLikedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleBack = () => navigate(-1);

  useEffect(() => {
    if (!user) return;
    fetch('/api/posts')
      .then(res => res.json())
      .then(allPosts => {
        const posts = allPosts.filter(post => post.likedBy?.includes(user.username));
        setLikedPosts(posts);
        setLoading(false);
      })
      .catch(err => {
        console.error('Liked posts fetch error', err);
        setLoading(false);
      });
  }, [user]);

  if (loading) return <div className="app-container" style={{ justifyContent: 'center', minHeight: 'calc(100vh - 120px)' }}><div>Loading...</div></div>;

  return (
    <div className="app-container" style={{ padding: '16px', justifyContent: 'flex-start' }}>
      <div style={{ padding: '16px', display: 'flex', position: 'sticky', top: 0, zIndex: 10, alignItems: 'center', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
        <button onClick={handleBack} style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer', padding: '4px', marginRight: '16px' }}>
          <ChevronLeft size={24} />
        </button>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-color)', margin: 0, flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Heart size={20} fill="var(--error-color)" color="var(--error-color)" />
          Liked Posts
        </h2>
      </div>

      {likedPosts.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '64px 20px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid var(--text-color)', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 16px' }}>
            <Heart size={32} color="var(--text-color)" />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-color)', marginBottom: '8px' }}>No liked posts</h3>
          <p style={{ fontSize: '14px', maxWidth: '280px', margin: '0 auto' }}>Posts you like will appear here.</p>
        </div>
      ) : (
        <div className="profile-grid">
          {likedPosts.map((post, idx) => (
            <div 
              key={idx} 
              style={{ 
                aspectRatio: '1/1', 
                backgroundImage: post.image ? `url(${post.image})` : 'none', 
                backgroundSize: 'cover', 
                backgroundPosition: 'center', 
                backgroundColor: 'var(--border-color)',
                position: 'relative'
              }} 
            >
              <div style={{ 
                position: 'absolute', 
                bottom: '4px', 
                right: '4px',
                backgroundColor: 'rgba(0,0,0,0.6)',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Heart size={14} fill="white" color="white" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

