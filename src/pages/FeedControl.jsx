import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function FeedControl() {
  const navigate = useNavigate();
  const { user, updateUserSettings } = useAuth();
  
  const [feedPref, setFeedPref] = useState(() => user?.feedPreference || 'Friends');
  const [savedMsg, setSavedMsg] = useState('');

  const showMsg = (msg) => {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const handleSave = async () => {
    await updateUserSettings({ interests: user?.interests, feedPreference: feedPref });
    showMsg('Settings Saved to Cloud');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: '0.5px solid var(--divider-color)', backgroundColor: 'var(--card-bg)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate('/settings')} style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer', padding: '4px', marginRight: '16px', display: 'flex' }}>
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ fontSize: 'var(--fs-lg)', margin: 0, fontWeight: 500, color: 'var(--text-color)' }}>Feed Control</h2>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column' }}>
        {savedMsg && (
          <div style={{ padding: '12px 16px', backgroundColor: 'var(--success-bg, #e6f4ea)', border: '1.5px solid var(--success-border, #4caf50)', borderRadius: '8px', color: 'var(--success-text, #1e7e34)', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <CheckCircle2 size={16} /> {savedMsg}
          </div>
        )}

        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>Control whose posts appear first in your home feed.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {['Friends', 'Suggested', 'Balanced'].map(pref => (
            <label 
              key={pref} 
              className={`checkbox-item ${feedPref === pref ? 'selected' : ''}`}
              style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'var(--card-bg)' }}
            >
              <input 
                type="radio" name="feedPreference" value={pref} 
                checked={feedPref === pref} onChange={() => setFeedPref(pref)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--text-color)' }}
              />
              <span style={{ fontWeight: 500, fontSize: '16px', color: 'var(--text-color)' }}>{pref}</span>
            </label>
          ))}
        </div>

        {/* Save Button */}
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', paddingTop: '24px' }}>
          <button 
            onClick={handleSave} 
            style={{ 
              padding: '12px 24px', 
              backgroundColor: "var(--active-color)", 
              color: 'var(--active-text)', 
              borderRadius: '8px', 
              border: 'none', 
              fontWeight: 600, 
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'opacity 0.2s'
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
