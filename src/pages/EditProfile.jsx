import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Save, User, Mail, Phone, Calendar, FileText, AtSign, Camera, CheckCircle2, Trash2 } from 'lucide-react';
import Avatar from '../components/Avatar';
import CropModal from '../components/CropModal';

const USERNAME_REGEX = /^[a-zA-Z0-9_.]*$/;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function EditProfile() {
  const { user, updateUser, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [name, setName] = useState(() => user?.name || '');
  const [username, setUsername] = useState(() => user?.username || '');
  const [email, setEmail] = useState(() => user?.email || '');
  const [age, setAge] = useState(() => user?.age || '');
  const [phone, setPhone] = useState(() => user?.phone || '');
  const [bio, setBio] = useState(() => user?.bio || '');
  const [photoVisibility, setPhotoVisibility] = useState(() => user?.photoVisibility || 'everyone');
  const [error, setError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImage, setCropImage] = useState(null);

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

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please select a JPG, PNG, or WEBP image');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropImage(ev.target.result);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleUploadPhoto = async () => {
    if (!photoPreview || !user) return;
    setPhotoUploading(true);
    setError('');
    try {
      const res = await fetch(`/api/users/${user.username}/photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: photoPreview })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        updateUser(updatedUser);
      } else {
        setError('Failed to upload photo');
      }
    } catch {
      setError('Failed to upload photo');
    }
    setPhotoUploading(false);
  };

  const handleRemovePhoto = async () => {
    if (!user) return;
    setPhotoUploading(true);
    setError('');
    try {
      const res = await fetch(`/api/users/${user.username}/photo`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const updatedUser = await res.json();
        updateUser(updatedUser);
        setPhotoPreview(null);
      } else {
        setError('Failed to remove photo');
      }
    } catch {
      setError('Failed to remove photo');
    }
    setPhotoUploading(false);
  };

  const handleCropSave = (croppedImage) => {
    setPhotoPreview(croppedImage);
    setShowCropModal(false);
    setCropImage(null);
  };

  const handleCloseCropModal = () => {
    setShowCropModal(false);
    setCropImage(null);
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

    const result = await updateUserProfile({ username, name, email, age, phone, bio, photoVisibility });
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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer', padding: '4px', marginRight: '12px', display: 'flex' }}>
          <ArrowLeft size={22} />
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-color)' }}>Edit Profile</h1>
      </div>

      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Messages */}
        {error && <div style={{ padding: '10px 14px', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 'var(--radius-sm)', color: 'var(--error-color)', fontSize: '13px' }}>{error}</div>}
        {saved && <div style={{ padding: '10px 14px', backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 'var(--radius-sm)', color: '#10b981', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={16} /> Profile saved
        </div>}

        {/* Avatar card with photo upload */}
        <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar username={user?.username} image={photoPreview || user?.profilePhoto} size={80} />
          <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handlePhotoChange} style={{ display: 'none' }} />
          {photoPreview ? (
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button onClick={handleUploadPhoto} disabled={photoUploading}
                style={{ padding: '8px 20px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: 'none', background: 'var(--primary-color)', color: '#fff', cursor: photoUploading ? 'not-allowed' : 'pointer', opacity: photoUploading ? 0.6 : 1 }}>
                {photoUploading ? 'Uploading...' : 'Save Photo'}
              </button>
              <button onClick={() => setPhotoPreview(null)}
                style={{ padding: '8px 20px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-color)', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button onClick={handlePhotoClick} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 500, cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Camera size={14} /> Change photo
              </button>
              {user?.profilePhoto && (
                <button onClick={handleRemovePhoto} disabled={photoUploading}
                  style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 500, cursor: photoUploading ? 'not-allowed' : 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', opacity: photoUploading ? 0.6 : 1 }}>
                  <Trash2 size={14} /> Remove
                </button>
              )}
            </div>
          )}
        </div>

        {/* Profile Information */}
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

        {/* Contact card */}
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

        {/* Photo Visibility card */}
        <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: '14px' }}>Profile Photo Visibility</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                  { value: 'everyone', label: 'Everyone', desc: 'Anyone can see your profile photo' },
                  { value: 'followers', label: 'Followers Only', desc: 'Only your followers can see your profile photo' },
                ].map(opt => (
              <label key={opt.value} onClick={() => setPhotoVisibility(opt.value)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', backgroundColor: photoVisibility === opt.value ? 'var(--hover-bg)' : 'transparent', transition: 'background-color 0.15s' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${photoVisibility === opt.value ? 'var(--primary-color)' : 'var(--border-color)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {photoVisibility === opt.value && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary-color)' }} />}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-color)' }}>{opt.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Save button */}
        <button onClick={handleSave} disabled={saving}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', padding: '12px', backgroundColor: saving ? 'var(--border-color)' : 'var(--primary-color)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontWeight: 600, fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)', transition: 'background-color 0.15s' }}>
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {showCropModal && cropImage && (
        <CropModal image={cropImage} onSave={handleCropSave} onClose={handleCloseCropModal} />
      )}
    </div>
  );
}
