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

  if (loading) return <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ display: 'inline-block', width: '24px', height: '24px', border: '2px solid var(--border-color)', borderTopColor: 'var(--text-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /></div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: '0.5px solid var(--divider-color)', backgroundColor: 'var(--card-bg)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={handleBack} style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer', padding: '4px', marginRight: '16px', display: 'flex' }}>
          <ChevronLeft size={24} />
        </button>
        <h2 style={{ fontSize: 'var(--fs-lg)', margin: 0, fontWeight: 500, color: 'var(--text-color)' }}>Saved</h2>
      </div>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>

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
    </div>
  );
}

