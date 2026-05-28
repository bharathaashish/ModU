import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Image, PlusCircle } from 'lucide-react';

export default function PostModal({ isOpen, onClose, onPostSuccess }) {
  const { user } = useAuth();
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
        setImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async () => {
    if (!user) return;
    setError('');
    if (!image) {
      setError('Please select a photo or video to post');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          content: caption,
          image
        })
      });
      if (res.ok) {
        setCaption('');
        setImage(null);
        setPreview('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        onPostSuccess?.();
        onClose();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Post failed');
      }
    } catch (err) {
      setError('Network error — please check your connection');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-color)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        border: '1px solid var(--border-color)'
      }}>
        {/* Header */}
        <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button onClick={onClose} style={{ padding: 0, background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            <div style={{ fontWeight: 600, color: 'var(--text-color)' }}>Create Post</div>
          </div>
          <button
            onClick={handlePost}
            disabled={!image || loading}
            style={{
              padding: '8px 16px',
              backgroundColor: loading || !image ? 'var(--border-color)' : 'var(--primary-color)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontWeight: 600,
              cursor: loading || !image ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Posting...' : 'Share'}
          </button>
        </div>

        {/* Image Upload */}
        <div style={{ padding: '0 20px 16px' }}>
          {!preview ? (
            <div style={{
              height: '400px',
              border: '2px dashed var(--border-color)',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)'
            }} onClick={() => fileInputRef.current?.click()}
            >
              <PlusCircle size={48} />
              <div style={{ fontWeight: 600, marginTop: '8px' }}>Choose photo or video</div>
              <div style={{ fontSize: '14px', marginTop: '4px' }}>PNG, JPG, GIF up to 20MB</div>
            </div>
          ) : (
            <div style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1',
              backgroundImage: `url(${preview})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              <button onClick={() => {setPreview(''); setImage(null); fileInputRef.current.value = '';}} style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(0,0,0,0.7)',
                border: 'none',
                borderRadius: '50%',
                color: 'white',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <X size={20} />
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />
        </div>

        {/* Caption */}
        <div style={{ padding: '0 20px 20px' }}>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '16px',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                backgroundColor: 'var(--card-bg)',
                color: 'var(--text-color)',
                resize: 'vertical',
                fontSize: '16px',
                outline: 'none',
                fontFamily: 'inherit'
              }}
              rows={3}
            />
          </div>
        {error && <div style={{ color: '#e74c3c', fontSize: '13px', padding: '0 20px 16px' }}>{error}</div>}
      </div>
    </div>
  );
}

