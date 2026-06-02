import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';

const FONT_SIZES = [
  { id: 'small', label: 'Small' },
  { id: 'normal', label: 'Default' },
  { id: 'large', label: 'Large' },
  { id: 'extra-large', label: 'Extra Large' },
];

function getInitialState() {
  try {
    const stored = localStorage.getItem('modu_theme') || 'system';
    const fontStored = localStorage.getItem('modu_font_size') || 'normal';
    const isSystem = stored === 'system';
    const mode = isSystem ? 'system' : (stored === 'light' ? 'light' : 'dark');
    const font = ['small', 'normal', 'large', 'extra-large'].includes(fontStored) ? fontStored : 'normal';
    return { mode, font };
  } catch {
    return { mode: 'system', font: 'normal' };
  }
}

function applyTheme(mode) {
  if (mode === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    document.documentElement.setAttribute('data-theme', mode);
  }
}

export default function Appearance() {
  const navigate = useNavigate();
  const init = getInitialState();
  const [mode, setMode] = useState(init.mode);
  const [font, setFont] = useState(init.font);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (mode === 'system') {
        applyTheme('system');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  const showMsg = (msg) => {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    localStorage.setItem('modu_theme', newMode);
    applyTheme(newMode);
    showMsg('Settings Saved');
  };

  const handleFontChange = (newFont) => {
    setFont(newFont);
    localStorage.setItem('modu_font_size', newFont);
    document.documentElement.setAttribute('data-font-size', newFont === 'normal' ? '' : newFont);
    showMsg('Settings Saved');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: '0.5px solid var(--divider-color)', backgroundColor: 'var(--card-bg)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate('/settings')} style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer', padding: '4px', marginRight: '16px', display: 'flex' }}>
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ fontSize: 'var(--fs-lg)', margin: 0, fontWeight: 500, color: 'var(--text-color)' }}>Appearance</h2>
      </div>

      {savedMsg && (
        <div style={{ padding: '12px 16px', textAlign: 'center', fontSize: 'var(--fs-xs)', color: 'var(--text-color)', fontWeight: 500, borderBottom: '0.5px solid var(--divider-color)' }}>
          {savedMsg}
        </div>
      )}

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Mode Section */}
        <div>
          <span className="section-label" style={{ paddingLeft: 0, marginBottom: '12px' }}>Mode</span>
          <div className="segmented-control" style={{ maxWidth: '320px' }}>
            {['light', 'dark', 'system'].map((m) => (
              <button
                key={m}
                className={mode === m ? 'active' : ''}
                onClick={() => handleModeChange(m)}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Theme Section */}
        <div>
          <span className="section-label" style={{ paddingLeft: 0, marginBottom: '12px' }}>Theme</span>
          <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderBottom: '0.5px solid var(--divider-color)' }}>
              <div className="theme-preview-swatch">
                <div className="theme-preview-header" />
                <div className="theme-preview-body">
                  <div className="theme-preview-line short" />
                  <div className="theme-preview-line long" />
                  <div className="theme-preview-line short" />
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 'var(--fs-md)', color: 'var(--text-color)' }}>Minimalist</div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', marginTop: '1px' }}>Clean monochrome, no colour</div>
              </div>
              <Check size={18} color="var(--text-color)" />
            </div>
            <div style={{ padding: '10px 16px', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>
              More themes coming soon
            </div>
          </div>
        </div>

        {/* Font Size Section */}
        <div>
          <span className="section-label" style={{ paddingLeft: 0, marginBottom: '12px' }}>Font Size</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {FONT_SIZES.map(f => (
              <label
                key={f.id}
                onClick={() => handleFontChange(f.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: '2px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'border-color 0.15s',
                  ...(font === f.id ? { borderColor: 'var(--text-color)' } : {}),
                }}>
                  {font === f.id && (
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--active-color)',
                    }} />
                  )}
                </div>
                <span style={{ fontWeight: 500, fontSize: 'var(--fs-md)', color: 'var(--text-color)' }}>{f.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
