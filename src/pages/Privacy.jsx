import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Camera, Sparkles, Lock, Globe, ChevronRight, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const VISIBILITY_OPTIONS = [
  { value: 'everyone', label: 'Everyone', desc: 'All users can see this' },
  { value: 'followers', label: 'Followers Only', desc: 'Only your followers can see this' },
];

const ACCOUNT_OPTIONS = [
  { value: false, label: 'Public Account', desc: 'Anyone can see your posts and stories', icon: Globe },
  { value: true, label: 'Private Account', desc: 'Only approved followers can see your posts and stories', icon: Lock },
];

const SECTIONS = [
  { id: 'photoVisibility', label: 'Profile Picture Visibility', icon: Camera },
  { id: 'interestVisibility', label: 'Interest Tag Visibility', icon: Sparkles },
];

export default function Privacy() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [isPrivate, setIsPrivate] = useState(() => user?.isPrivate || false);
  const [settings, setSettings] = useState({
    photoVisibility: user?.photoVisibility || 'everyone',
    interestVisibility: user?.interestVisibility || 'everyone',
  });
  const [updating, setUpdating] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    if (user) {
      setIsPrivate(user.isPrivate || false);
      setSettings({
        photoVisibility: user.photoVisibility || 'everyone',
        interestVisibility: user.interestVisibility || 'everyone',
      });
    }
  }, [user]);

  const showMsg = (msg) => {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const handleChange = (section, value) => {
    setSettings(prev => ({ ...prev, [section]: value }));
  };

  const handleSave = async () => {
    if (updating) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/users/${user.username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, isPrivate })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        updateUser(updatedUser);
        showMsg('Privacy settings saved');
      }
    } catch (err) {
      console.error('Failed to update privacy', err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', paddingBottom: '100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate('/settings')} style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer', padding: '4px', marginRight: '12px', display: 'flex' }}>
          <ArrowLeft size={22} />
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-color)' }}>Privacy Settings</h1>
      </div>

      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {savedMsg && (
          <div style={{ padding: '12px', backgroundColor: 'var(--surface-alt)', color: 'var(--text-color)', borderRadius: '8px', textAlign: 'center', fontSize: '14px', fontWeight: 500 }}>
            {savedMsg}
          </div>
        )}

        <div style={{ padding: '14px 16px', backgroundColor: 'var(--surface-alt)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          Manage your account privacy. When your account is private, only approved followers can see your posts and stories. Profile photo and interest tags have their own independent visibility controls.
        </div>

        {/* Close Friends link */}
        <div onClick={() => navigate('/settings/close-friends')}
          style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 18px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.15s' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Heart size={18} color="var(--text-color)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-color)' }}>Close Friends</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1px' }}>Manage your private close friends list</div>
          </div>
          <ChevronRight size={18} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
        </div>

        {/* Account Privacy */}
        <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={16} color="var(--text-secondary)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-color)' }}>Account Privacy</span>
          </div>
          <div style={{ padding: '8px' }}>
            {ACCOUNT_OPTIONS.map(opt => (
              <div
                key={String(opt.value)}
                onClick={() => setIsPrivate(opt.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  backgroundColor: isPrivate === opt.value ? 'var(--surface-alt)' : 'transparent',
                  transition: 'background-color 0.15s'
                }}
              >
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${isPrivate === opt.value ? 'var(--text-color)' : 'var(--border-color)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {isPrivate === opt.value && <div style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: "var(--active-color)" }} />}
                </div>
                <opt.icon size={16} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-color)' }}>{opt.label}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1px' }}>{opt.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Visibility sections */}
        {SECTIONS.map(section => (
          <div key={section.id} style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <section.icon size={16} color="var(--text-secondary)" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-color)' }}>{section.label}</span>
            </div>
            <div style={{ padding: '8px' }}>
              {VISIBILITY_OPTIONS.map(opt => (
                <div
                  key={opt.value}
                  onClick={() => handleChange(section.id, opt.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    backgroundColor: settings[section.id] === opt.value ? 'var(--surface-alt)' : 'transparent',
                    transition: 'background-color 0.15s'
                  }}
                >
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${settings[section.id] === opt.value ? 'var(--text-color)' : 'var(--border-color)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {settings[section.id] === opt.value && <div style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: "var(--active-color)" }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-color)' }}>{opt.label}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1px' }}>{opt.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={handleSave}
          disabled={updating}
          style={{
            width: '100%', padding: '12px', backgroundColor: updating ? 'var(--border-color)' : 'var(--text-color)',
            border: 'none', borderRadius: 'var(--radius-sm)', color: 'var(--active-text)', fontWeight: 600, fontSize: '14px',
            cursor: updating ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)', transition: 'background-color 0.15s'
          }}
        >
          {updating ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
