import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PostViewer from '../components/PostViewer';
import { ArrowLeft } from 'lucide-react';

export default function PostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);

  useEffect(() => {
    if (id) {
      fetch(`/api/posts/${id}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => setPost(data))
        .catch(() => {});
    }
  }, [id]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', color: 'var(--text-color)' }}>
          <ArrowLeft size={22} />
        </button>
      </div>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '16px' }}>
        {post ? (
          <PostViewer post={post} onClose={() => navigate(-1)} onLikeUpdate={(updated) => setPost(updated)} />
        ) : (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading post...</div>
        )}
      </div>
    </div>
  );
}
