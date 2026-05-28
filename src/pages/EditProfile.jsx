import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Save, User, Mail, Phone, Calendar, FileText, AtSign, Camera, CheckCircle2 } from 'lucide-react';
import Avatar from '../components/Avatar';

const USERNAME_REGEX = /^[a-zA-Z0-9_.]*$/;

const sections = [
  { id: 'info', label: 'Profile Information', icon: User },
  { id: 'bio', label: 'Bio', icon: FileText },
];

export default function EditProfile() {
  const { user, updateUserProfile } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(() => user?.name || '');
  const [username, setUsername] = useState(() => user?.username || '');
  const [email, setEmail] = useState(() => user?.email || '');
  const [age, setAge] = useState(() => user?.age || '');
  const [phone, setPhone] = useState(() => user?.phone || '');
  const [bio, setBio] = useState(() => user?.bio || '');
  const [error, setError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const validateUsername = useCallback((val) => {
    if (val.length > 0 && !USERNAME_REGEX.test(val)) {
      return 'Only letters, numbers, underscores, and periods allowed';
    }
    return '';
  }, []);

  const handleUsernameChange = (e) => {
    const val = e.target.value;
    setUsername(val);
    setUsernameError(validateUsername(val));
  };

  const handleSave = async () => {
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    const fmtErr = validateUsername(username);
    if (fmtErr) {
      setError(fmtErr);
      return;
    }
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    setError('');
    setSaving(true);
    setSaved(false);

    const result = await updateUserProfile({ username, name, email, age, phone, bio });
    setSaving(false);

    if (!result.success) {
      setError(result.message || 'Failed to update profile');
    } else {
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        navigate('/profile');
      }, 2000);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', paddingBottom: '100px' }}>
      {/* Header — clean, no sticky save */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer', padding: '4px', marginRight: '12px', display: 'flex' }}>
          <ArrowLeft size={22} />
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-color)' }}>Edit Profile</h1>
      </div>

      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Success/Error messages */}
        {error && <div style={{ padding: '10px 14px', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 'var(--radius-sm)', color: 'var(--error-color)', fontSize: '13px' }}>{error}</div>}
        {saved && <div style={{ padding: '10px 14px', backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 'var(--radius-sm)', color: '#10b981', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={16} /> Profile saved
        </div>}

        {/* Avatar */}
        <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar username={user?.username} size={72} />
          <button style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 500, marginTop: '10px', cursor: 'pointer', fontSize: '13px' }}>
            Change photo
          </button>
        </div>

        {/* Username + Name card */}
        <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: '14px' }}>Profile Information</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Username</label>
              <input type="text" value={username} onChange={handleUsernameChange}
                style={{ width: '100%', padding: '10px 12px', backgroundColor: 'var(--input-bg)', border: `1px solid ${usernameError ? 'var(--error-color)' : 'var(--border-color)'}`, borderRadius: 'var(--radius-sm)', color: 'var(--text-color)', fontSize: '14px', outline: 'none', fontFamily: 'var(--font-sans)', transition: 'border-color 0.15s' }} />
              {usernameError && <div style={{ color: 'var(--error-color)', fontSize: '12px', marginTop: '4px' }}>{usernameError}</div>}
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name"
                style={{ width: '100%', padding: '10px 12px', backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-color)', fontSize: '14px', outline: 'none', fontFamily: 'var(--font-sans)', transition: 'border-color 0.15s' }} />
            </div>
          </div>
        </div>

        {/* Email + Phone + Age card */}
        <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: '14px' }}>Contact</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-color)', fontSize: '14px', outline: 'none', fontFamily: 'var(--font-sans)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Age</label>
                <input type="number" value={age} onChange={e => setAge(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-color)', fontSize: '14px', outline: 'none', fontFamily: 'var(--font-sans)' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Phone</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-color)', fontSize: '14px', outline: 'none', fontFamily: 'var(--font-sans)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Bio card */}
        <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: '10px' }}>Bio</div>
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Write a little about yourself..."
            style={{ width: '100%', padding: '10px 12px', backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-color)', fontSize: '14px', outline: 'none', resize: 'vertical', lineHeight: '1.6', fontFamily: 'var(--font-sans)', transition: 'border-color 0.15s' }} />
        </div>

        {/* Save button at bottom */}
        <button onClick={handleSave} disabled={saving}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', padding: '12px', backgroundColor: saving ? 'var(--border-color)' : 'var(--primary-color)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontWeight: 600, fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)', transition: 'background-color 0.15s' }}>
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
