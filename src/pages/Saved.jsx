import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bookmark, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Saved() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleBack = () => navigate(-1);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/users/${user.username}/saved`)
      .then(res => res.json())
      .then(data => {
        setSavedPosts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Saved fetch error', err);
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
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-color)', margin: 0, flex: 1, textAlign: 'center' }}>Saved</h2>
      </div>

      {savedPosts.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '64px 20px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid var(--text-color)', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 16px' }}>
            <Bookmark size={32} color="var(--text-color)" />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-color)', marginBottom: '8px' }}>No saved posts</h3>
          <p style={{ fontSize: '14px', maxWidth: '280px', margin: '0 auto' }}>Save posts to view them later.</p>
        </div>
      ) : (
        <div className="profile-grid">
          {savedPosts.map((post, idx) => (
            <div 
              key={idx} 
              style={{ aspectRatio: '1/1', backgroundImage: post.image ? `url(${post.image})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: 'var(--border-color)' }} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

