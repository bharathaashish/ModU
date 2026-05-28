import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Lock, Plus, X } from 'lucide-react';

export default function CreateCommunity() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hubs, setHubs] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [hubId, setHubId] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [tags, setTags] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/hubs');
        if (res.ok) setHubs(await res.json());
      } catch {}
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !hubId || !user) return;
    setError('');
    setCreating(true);
    try {
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          hubId,
          isPrivate,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          creator: user.username
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSuccess('Community created! Redirecting...');
        setTimeout(() => navigate(`/community/${data._id}`), 1000);
      } else {
        setError(data.error || 'Failed to create community');
      }
    } catch {
      setError('Network error — please check your connection');
    }
    setCreating(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <button onClick={() => navigate('/hubs')} style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer', display: 'flex', padding: '4px' }}>
            <ArrowLeft size={22} />
          </button>
          <span className="page-title">Create Community</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: '480px', margin: '0 auto' }}>
        {error && <div className="error-text">{error}</div>}
        {success && <div style={{ color: '#2ecc71', fontSize: '14px', fontWeight: 500, marginBottom: '16px', textAlign: 'center' }}>{success}</div>}

        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-color)', marginBottom: '6px', display: 'block' }}>Community Name *</label>
        <input className="form-input" placeholder="e.g. AOT_India, TechBeginnersHub" value={name} onChange={e => setName(e.target.value)} autoFocus required />

        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-color)', marginBottom: '6px', display: 'block' }}>Description</label>
        <textarea className="form-textarea" placeholder="What is your community about?" value={description} onChange={e => setDescription(e.target.value)} />

        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-color)', marginBottom: '6px', display: 'block' }}>Hub *</label>
        <select className="form-input" value={hubId} onChange={e => setHubId(e.target.value)} required>
          <option value="">Select a hub...</option>
          {hubs.map(h => <option key={h._id} value={h._id}>{h.icon} {h.name}</option>)}
        </select>

        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-color)', marginBottom: '6px', display: 'block' }}>Visibility</label>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <button type="button" onClick={() => setIsPrivate(false)} style={{
            flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            backgroundColor: !isPrivate ? 'var(--primary-color)' : 'var(--bg-color)',
            border: `1px solid ${!isPrivate ? 'var(--primary-color)' : 'var(--border-color)'}`,
            borderRadius: '8px', color: !isPrivate ? '#fff' : 'var(--text-color)',
            fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
          }}>
            <Globe size={18} /> Public
          </button>
          <button type="button" onClick={() => setIsPrivate(true)} style={{
            flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            backgroundColor: isPrivate ? 'var(--primary-color)' : 'var(--bg-color)',
            border: `1px solid ${isPrivate ? 'var(--primary-color)' : 'var(--border-color)'}`,
            borderRadius: '8px', color: isPrivate ? '#fff' : 'var(--text-color)',
            fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
          }}>
            <Lock size={18} /> Private
          </button>
        </div>

        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-color)', marginBottom: '6px', display: 'block' }}>Tags (comma-separated, optional)</label>
        <input className="form-input" placeholder="e.g. gaming, valorant, competitive" value={tags} onChange={e => setTags(e.target.value)} />

        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={!name.trim() || !hubId || creating}>
          {creating ? 'Creating...' : 'Create Community'}
        </button>
      </form>
    </div>
  );
}
