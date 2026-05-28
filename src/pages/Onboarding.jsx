import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Sparkles, Check } from 'lucide-react';
import { CONTENT_TYPES } from '../constants/contentTypes';

const categories = [...new Set(CONTENT_TYPES.map(t => t.category))];

export default function Onboarding() {
  const [selected, setSelected] = useState([]);
  const { updateUserSettings } = useAuth();
  const navigate = useNavigate();

  const toggleSelection = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleComplete = () => {
    updateUserSettings({ interests: selected, feedPreference: 'Friends' });
    navigate('/');
  };

  const grouped = useMemo(() => {
    const map = {};
    for (const cat of categories) {
      map[cat] = CONTENT_TYPES.filter(t => t.category === cat);
    }
    return map;
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ maxWidth: '520px', width: '100%', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: '36px 28px', boxShadow: 'var(--elevated-shadow)' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-color)' }}>
            Welcome to <span style={{ fontWeight: 900 }}>M</span>od<span style={{ fontWeight: 900 }}>U</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5', maxWidth: '360px', margin: '0 auto' }}>
            What topics interest you? Select a few to personalize your feed and discover communities.
          </p>
        </div>

        {categories.map(cat => (
          <div key={cat} style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{cat}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {grouped[cat].map(type => {
                const active = selected.includes(type.id);
                return (
                  <button key={type.id} onClick={() => toggleSelection(type.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '20px', border: `1px solid ${active ? 'var(--primary-color)' : 'var(--border-color)'}`, backgroundColor: active ? 'rgba(0,149,246,0.08)' : 'var(--bg-color)', color: active ? 'var(--primary-color)' : 'var(--text-color)', fontSize: '14px', fontWeight: active ? 600 : 500, cursor: 'pointer', transition: 'all 0.2s ease' }}>
                    {active && <Check size={14} />}
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px', padding: '14px 18px', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--primary-color)" />
            <span style={{ fontSize: '14px', color: 'var(--text-color)' }}>Selected</span>
          </div>
          <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-color)' }}>{selected.length} / {CONTENT_TYPES.length}</span>
        </div>

        <button onClick={handleComplete}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', marginTop: '20px', padding: '14px', backgroundColor: 'var(--primary-color)', border: 'none', borderRadius: 'var(--radius-md)', color: 'white', fontWeight: 600, fontSize: '16px', cursor: 'pointer', transition: 'all 0.2s' }}>
          <CheckCircle2 size={20} />
          Complete Setup
        </button>
      </div>
    </div>
  );
}
