import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Privacy() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [selectedPrivacy, setSelectedPrivacy] = useState(user?.isPrivate || false);
  const [updating, setUpdating] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const showMsg = (msg) => {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const handleSave = async () => {
    if (updating) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/users/${user.username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPrivate: selectedPrivacy })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        updateUser(updatedUser);
        showMsg('Settings Saved');
      }
    } catch (err) {
      console.error('Failed to update privacy', err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="app-container" style={{ padding: 0, justifyContent: 'flex-start', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', position: 'sticky', top: 0, zIndex: 10, alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
        <button onClick={() => navigate('/settings')} style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer', padding: '4px', marginRight: '16px' }}>
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 600, color: 'var(--text-color)' }}>Account Privacy</h2>
      </div>

      <div style={{ flex: 1, width: '100%', padding: '24px 16px', display: 'flex', flexDirection: 'column' }}>
        {savedMsg && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '8px', textAlign: 'center', fontSize: '14px', fontWeight: 500, marginBottom: '24px' }}>
            {savedMsg}
          </div>
        )}
        
        {/* Public Account Option */}
        <div 
          onClick={() => setSelectedPrivacy(false)}
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '20px', 
            marginBottom: '16px',
            backgroundColor: 'var(--card-bg)', 
            border: !selectedPrivacy ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ flex: 1, paddingRight: '16px' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-color)', marginBottom: '4px' }}>Public Account</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Anyone can view your profile and posts.</div>
          </div>
          <div>
            {!selectedPrivacy ? <CheckCircle2 size={24} color="var(--primary-color)" /> : <Circle size={24} color="var(--text-secondary)" />}
          </div>
        </div>

        {/* Private Account Option */}
        <div 
          onClick={() => setSelectedPrivacy(true)}
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '20px', 
            backgroundColor: 'var(--card-bg)', 
            border: selectedPrivacy ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ flex: 1, paddingRight: '16px' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-color)', marginBottom: '4px' }}>Private Account</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Only approved followers can view your posts and profile.</div>
          </div>
          <div>
            {selectedPrivacy ? <CheckCircle2 size={24} color="var(--primary-color)" /> : <Circle size={24} color="var(--text-secondary)" />}
          </div>
        </div>

        {/* Save Button */}
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', paddingTop: '24px' }}>
          <button 
            onClick={handleSave} 
            disabled={updating}
            style={{ 
              padding: '12px 24px', 
              backgroundColor: 'var(--primary-color)', 
              color: 'white', 
              borderRadius: '8px', 
              border: 'none', 
              fontWeight: 600, 
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
              opacity: updating ? 0.5 : 1
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
