import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sun, Moon } from 'lucide-react';

const FONT_SIZES = [
  { id: 'small', label: 'Small' },
  { id: 'normal', label: 'Default' },
  { id: 'large', label: 'Large' },
  { id: 'extra-large', label: 'Extra Large' },
];

function getInitialState() {
  try {
    const stored = localStorage.getItem('modu_theme') || 'dark';
    const fontStored = localStorage.getItem('modu_font_size') || 'normal';
    const mode = stored === 'light' ? 'light' : 'dark';
    const font = ['small', 'normal', 'large', 'extra-large'].includes(fontStored) ? fontStored : 'normal';
    return { mode, font };
  } catch {
    return { mode: 'dark', font: 'normal' };
  }
}

export default function Appearance() {
  const navigate = useNavigate();
  const init = getInitialState();
  const [mode, setMode] = useState(init.mode);
  const [font, setFont] = useState(init.font);
  const [savedMsg, setSavedMsg] = useState('');

  const showMsg = (msg) => {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const handleSave = () => {
    localStorage.setItem('modu_theme', mode);
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem('modu_font_size', font);
    document.documentElement.setAttribute('data-font-size', font === 'normal' ? '' : font);
    showMsg('Settings Saved');
  };

  return (
    <div className="app-container" style={{ padding: 0, justifyContent: 'flex-start', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <div style={{ display: 'flex', position: 'sticky', top: 0, zIndex: 10, alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
        <button onClick={() => navigate('/settings')} style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer', padding: '4px', marginRight: '16px' }}>
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 600, color: 'var(--text-color)' }}>Appearance</h2>
      </div>

      <div style={{ flex: 1, width: '100%', padding: '24px 16px', display: 'flex', flexDirection: 'column' }}>
        {savedMsg && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '12px', textAlign: 'center', fontSize: '14px', fontWeight: 500, marginBottom: '24px' }}>
            {savedMsg}
          </div>
        )}
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>Choose how the app looks for you.</p>

        {/* Mode Toggle */}
        <span className="section-label" style={{ marginBottom: '12px' }}>Mode</span>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
          <button
            onClick={() => setMode('light')}
            style={{
              flex: 1, padding: '14px', borderRadius: '12px',
              border: mode === 'light' ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
              backgroundColor: mode === 'light' ? 'var(--primary-glow)' : 'var(--card-bg)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '8px', fontWeight: 600, fontSize: '14px', color: 'var(--text-color)',
              fontFamily: 'var(--font-sans)',
              transition: 'border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Sun size={18} /> Light
          </button>
          <button
            onClick={() => setMode('dark')}
            style={{
              flex: 1, padding: '14px', borderRadius: '12px',
              border: mode === 'dark' ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
              backgroundColor: mode === 'dark' ? 'var(--primary-glow)' : 'var(--card-bg)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '8px', fontWeight: 600, fontSize: '14px', color: 'var(--text-color)',
              fontFamily: 'var(--font-sans)',
              transition: 'border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Moon size={18} /> Dark
          </button>
        </div>

        {/* Font Size */}
        <span className="section-label" style={{ marginBottom: '12px' }}>Font Size</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
          {FONT_SIZES.map(f => (
            <label
              key={f.id}
              className={`checkbox-item ${font === f.id ? 'selected' : ''}`}
              style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', cursor: 'pointer', backgroundColor: 'var(--card-bg)' }}
            >
              <input
                type="radio" name="fontSize" value={f.id}
                checked={font === f.id} onChange={() => setFont(f.id)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary-color)' }}
              />
              <span style={{ fontWeight: 500, fontSize: '16px', color: 'var(--text-color)' }}>{f.label}</span>
            </label>
          ))}
        </div>

        {/* Save Button */}
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', paddingTop: '24px' }}>
          <button
            onClick={handleSave}
            style={{
              padding: '12px 24px', backgroundColor: 'var(--primary-color)', color: 'white',
              borderRadius: '12px', border: 'none', fontWeight: 600, fontSize: '16px',
              cursor: 'pointer', fontFamily: 'var(--font-sans)',
              transition: 'background-color 0.2s ease, transform 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'var(--primary-hover)';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'var(--primary-color)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1.02)'}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
