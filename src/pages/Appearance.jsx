import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

function getStoredTheme() {
  try {
    return localStorage.getItem('modu_theme') || 'dark';
  } catch {
    return 'dark';
  }
}

export default function Appearance() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(getStoredTheme);
  const [savedMsg, setSavedMsg] = useState('');

  const showMsg = (msg) => {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const handleSave = () => {
    localStorage.setItem('modu_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    showMsg('Settings Saved');
  };

  return (
    <div className="app-container" style={{ padding: 0, justifyContent: 'flex-start', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', position: 'sticky', top: 0, zIndex: 10, alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
        <button onClick={() => navigate('/settings')} style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer', padding: '4px', marginRight: '16px' }}>
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 600, color: 'var(--text-color)' }}>Appearance</h2>
      </div>

      <div style={{ flex: 1, width: '100%', padding: '24px 16px', display: 'flex', flexDirection: 'column' }}>
        {savedMsg && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '8px', textAlign: 'center', fontSize: '14px', fontWeight: 500, marginBottom: '24px' }}>
            {savedMsg}
          </div>
        )}
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>Choose how the app looks for you.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label 
            className={`checkbox-item ${theme === 'light' ? 'selected' : ''}`}
            style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'var(--card-bg)' }}
          >
            <input 
              type="radio" name="theme" value="light" 
              checked={theme === 'light'} onChange={() => setTheme('light')}
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary-color)' }}
            />
            <span style={{ fontWeight: 500, fontSize: '16px', color: 'var(--text-color)' }}>Light Mode</span>
          </label>

          <label 
            className={`checkbox-item ${theme === 'dark' ? 'selected' : ''}`}
            style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'var(--card-bg)' }}
          >
            <input 
              type="radio" name="theme" value="dark" 
              checked={theme === 'dark'} onChange={() => setTheme('dark')}
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary-color)' }}
            />
            <span style={{ fontWeight: 500, fontSize: '16px', color: 'var(--text-color)' }}>Dark Mode</span>
          </label>
        </div>

        {/* Save Button */}
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', paddingTop: '24px' }}>
          <button 
            onClick={handleSave} 
            style={{ 
              padding: '12px 24px', 
              backgroundColor: 'var(--primary-color)', 
              color: 'white', 
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
