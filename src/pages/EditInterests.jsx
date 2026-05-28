import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Layers, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CONTENT_TYPES } from '../constants/contentTypes';

const categories = [...new Set(CONTENT_TYPES.map(t => t.category))];

export default function EditInterests() {
  const navigate = useNavigate();
  const { user, updateUserSettings } = useAuth();

  const [selectedInterests, setSelectedInterests] = useState(() => user?.interests || []);
  const [savedMsg, setSavedMsg] = useState('');

  const showMsg = (msg) => {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const handleSave = async () => {
    await updateUserSettings({ interests: selectedInterests, feedPreference: user?.feedPreference });
    showMsg('Interests saved successfully');
  };

  const toggleInterest = (id) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const grouped = useMemo(() => {
    const map = {};
    for (const cat of categories) {
      map[cat] = CONTENT_TYPES.filter(t => t.category === cat);
    }
    return map;
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', paddingBottom: '100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate('/settings')} style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer', padding: '4px', marginRight: '12px', display: 'flex' }}>
          <ArrowLeft size={22} />
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-color)', flex: 1 }}>Edit Interests</h1>
        <button onClick={handleSave}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', backgroundColor: 'var(--primary-color)', border: 'none', borderRadius: 'var(--radius-md)', color: 'white', fontWeight: 600, fontSize: '14px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', transition: 'all 0.2s' }}>
          <Save size={16} />
          Save
        </button>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {savedMsg && (
          <div style={{ padding: '12px 16px', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-md)', color: '#10b981', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Check size={18} /> {savedMsg}
          </div>
        )}

        <div style={{ padding: '14px 18px', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.7' }}>
          Your Discover feed prioritizes the topics you select, communities you follow, and the discussions you engage with. Keep your interests focused so recommendations stay relevant.
        </div>

        <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: '20px', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            <Layers size={16} />
            <span>YOUR INTERESTS</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Select topics you want to see in your Discover feed and recommendations.
          </p>

          {categories.map(cat => (
            <div key={cat} style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{cat}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {grouped[cat].map(type => {
                  const selected = selectedInterests.includes(type.id);
                  return (
                    <button key={type.id} onClick={() => toggleInterest(type.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '20px', border: `1px solid ${selected ? 'var(--primary-color)' : 'var(--border-color)'}`, backgroundColor: selected ? 'rgba(0,149,246,0.08)' : 'var(--card-bg)', color: selected ? 'var(--primary-color)' : 'var(--text-color)', fontSize: '13px', fontWeight: selected ? 600 : 500, cursor: 'pointer', transition: 'all 0.2s ease' }}>
                      {selected && <Check size={14} />}
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Selection count */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--primary-color)" />
            <span style={{ fontSize: '14px', color: 'var(--text-color)' }}>Selected Interests</span>
          </div>
          <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-color)' }}>{selectedInterests.length} / {CONTENT_TYPES.length}</span>
        </div>

        <button onClick={handleSave}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '14px', backgroundColor: 'var(--primary-color)', border: 'none', borderRadius: 'var(--radius-md)', color: 'white', fontWeight: 600, fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,0.1)', transition: 'all 0.2s' }}>
          <Save size={18} />
          Save Changes
        </button>
      </div>
    </div>
  );
}
