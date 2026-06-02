import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sun, Moon } from 'lucide-react';

const THEMES = [
  { id: 'space', name: 'Space', desc: 'Flat, minimal, modern' },
  { id: 'aurora', name: 'Aurora', desc: 'Gradient borders, airy' },
  { id: 'forest', name: 'Forest', desc: 'Warm earth tones' },
  { id: 'paper', name: 'Paper', desc: 'Journal-like, textured' },
  { id: 'retro', name: 'Retro', desc: 'Playful, soft, rounded' },
];

const FONT_SIZES = [
  { id: 'small', label: 'Small' },
  { id: 'normal', label: 'Default' },
  { id: 'large', label: 'Large' },
  { id: 'extra-large', label: 'Extra Large' },
];

function getInitialState() {
  try {
    const stored = localStorage.getItem('modu_theme') || '';
    const fontStored = localStorage.getItem('modu_font_size') || 'normal';
    let theme = 'space';
    let mode = 'dark';

    if (stored === 'light') {
      theme = 'space'; mode = 'light';
    } else if (stored === 'dark') {
      theme = 'space'; mode = 'dark';
    } else if (stored.includes('-')) {
      const parts = stored.split('-');
      theme = parts[0] || 'space';
      mode = parts[1] || 'dark';
    }

    const font = ['small', 'normal', 'large', 'extra-large'].includes(fontStored) ? fontStored : 'normal';
    return { theme, mode, font };
  } catch {
    return { theme: 'space', mode: 'dark', font: 'normal' };
  }
}

function applyTheme(theme, mode, font) {
  const combined = `${theme}-${mode}`;
  localStorage.setItem('modu_theme', combined);
  document.documentElement.setAttribute('data-theme', combined);
  localStorage.setItem('modu_font_size', font);
  document.documentElement.setAttribute('data-font-size', font === 'normal' ? '' : font);
}

export default function Appearance() {
  const navigate = useNavigate();
  const init = getInitialState();
  const [theme, setTheme] = useState(init.theme);
  const [mode, setMode] = useState(init.mode);
  const [font, setFont] = useState(init.font);
  const [savedMsg, setSavedMsg] = useState('');

  const showMsg = (msg) => {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const handleSave = () => {
    applyTheme(theme, mode, font);
    showMsg('Settings Saved');
  };

  const previewStyle = (t) => {
    const isLight = mode === 'light';
    const previewThemes = {
      space: { bg: '#F7F7F8', card: '#FFFFFF', border: '#E8E8EC', primary: '#5B5BD6' },
      aurora: { bg: '#F5F7FA', card: '#FFFFFF', border: '#E2E8F0', primary: '#6366F1' },
      forest: { bg: '#F8F7F4', card: '#FEFCF6', border: '#E6E3D8', primary: '#6B8F71' },
      paper: { bg: '#F5F0E8', card: '#FAF6EE', border: '#E5DDD0', primary: '#8B7E6B' },
      retro: { bg: '#F8F0F8', card: '#FFFFFF', border: '#E8D8E8', primary: '#D47EB5' },
    };
    const darkThemes = {
      space: { bg: '#0F0F12', card: '#17171C', border: '#2A2A35', primary: '#7C7CF8' },
      aurora: { bg: '#0B0F1A', card: '#131822', border: '#1E293B', primary: '#818CF8' },
      forest: { bg: '#121410', card: '#1A1D17', border: '#2C3028', primary: '#8BB894' },
      paper: { bg: '#1A1712', card: '#221F1A', border: '#36322C', primary: '#A39884' },
      retro: { bg: '#1A1218', card: '#221A20', border: '#362A32', primary: '#E89BC8' },
    };
    return isLight ? previewThemes[t] : darkThemes[t];
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
          <div style={{ padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '8px', textAlign: 'center', fontSize: '14px', fontWeight: 500, marginBottom: '24px' }}>
            {savedMsg}
          </div>
        )}
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>Choose how the app looks for you.</p>

        {/* Theme Selection */}
        <label className="section-label" style={{ marginBottom: '12px' }}>Theme</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '28px' }}>
          {THEMES.map(t => {
            const p = previewStyle(t.id);
            const selected = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  border: selected ? '2px solid var(--primary-color)' : `1px solid var(--border-color)`,
                  backgroundColor: p.card,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.15s ease, transform 0.1s ease',
                  transform: selected ? 'scale(1.02)' : 'scale(1)',
                  outline: 'none',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: p.bg, border: '1px solid ' + p.border }} />
                  <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: p.card, border: '1px solid ' + p.border }} />
                  <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: p.primary }} />
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: p.bg === '#0F0F12' || p.bg === '#0B0F1A' || p.bg === '#121410' || p.bg === '#1A1712' || p.bg === '#1A1218' ? '#F8FAFC' : '#111827', marginBottom: '2px' }}>{t.name}</div>
                <div style={{ fontSize: '11px', color: p.bg === '#0F0F12' || p.bg === '#0B0F1A' || p.bg === '#121410' || p.bg === '#1A1712' || p.bg === '#1A1218' ? '#CBD5E1' : '#6B7280' }}>{t.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Light / Dark Toggle */}
        <label className="section-label" style={{ marginBottom: '12px' }}>Mode</label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
          <button
            onClick={() => setMode('light')}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: mode === 'light' ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
              backgroundColor: mode === 'light' ? 'var(--primary-glow)' : 'var(--card-bg)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: 600,
              fontSize: '14px',
              color: 'var(--text-color)',
              fontFamily: 'var(--font-sans)',
              transition: 'border-color 0.15s ease, background-color 0.15s ease',
            }}
          >
            <Sun size={18} /> Light
          </button>
          <button
            onClick={() => setMode('dark')}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: mode === 'dark' ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
              backgroundColor: mode === 'dark' ? 'var(--primary-glow)' : 'var(--card-bg)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: 600,
              fontSize: '14px',
              color: 'var(--text-color)',
              fontFamily: 'var(--font-sans)',
              transition: 'border-color 0.15s ease, background-color 0.15s ease',
            }}
          >
            <Moon size={18} /> Dark
          </button>
        </div>

        {/* Font Size */}
        <label className="section-label" style={{ marginBottom: '12px' }}>Font Size</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
          {FONT_SIZES.map(f => (
            <label
              key={f.id}
              className={`checkbox-item ${font === f.id ? 'selected' : ''}`}
              style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'var(--card-bg)' }}
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
              padding: '12px 24px',
              backgroundColor: 'var(--primary-color)',
              color: 'white',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
