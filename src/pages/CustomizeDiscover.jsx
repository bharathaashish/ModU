import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Pin, CheckCircle2, MessageCircle, Users, Hash, Layout } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const WIDGET_DEFS = [
  { id: 'interestPosts', label: 'Shared Interest Posts', icon: Hash },
  { id: 'activeDiscussions', label: 'Active Discussions', icon: MessageCircle },
  { id: 'suggestedConnections', label: 'Suggested Connections', icon: Users },
  { id: 'interestHubs', label: 'Interest Hubs', icon: Layout },
];

export default function CustomizeDiscover() {
  const navigate = useNavigate();
  const { user, updateUserSettings } = useAuth();

  const [widgets, setWidgets] = useState([]);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    if (user?.discoverWidgets && user.discoverWidgets.length > 0) {
      setWidgets(user.discoverWidgets);
    } else {
      setWidgets(WIDGET_DEFS.map(w => ({ id: w.id, visible: true, pinned: false })));
    }
  }, [user]);

  const toggleWidget = (id, key) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, [key]: !w[key] } : w));
  };

  const handleSave = async () => {
    await updateUserSettings({ discoverWidgets: widgets });
    setSavedMsg('Discover settings saved');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', paddingBottom: '100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate('/settings')} style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer', padding: '4px', marginRight: '12px', display: 'flex' }}>
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-color)' }}>Customize Discover</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>Show, hide, and pin widgets</p>
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px' }}>
          WIDGETS
        </div>

        {WIDGET_DEFS.map(({ id, label, icon: Icon }) => {
          const w = widgets.find(x => x.id === id) || { visible: true, pinned: false };
          return (
            <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 0', borderBottom: '1px solid var(--border-color)' }}>
              <Icon size={20} color="var(--text-color)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: 'var(--text-color)' }}>{label}</div>
              <button onClick={() => toggleWidget(id, 'pinned')}
                style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', color: w.pinned ? 'var(--text-color)' : 'var(--text-secondary)', transition: 'all 0.15s' }}
                title={w.pinned ? 'Unpin' : 'Pin'}>
                <Pin size={16} fill={w.pinned ? 'currentColor' : 'none'} />
              </button>
              <button onClick={() => toggleWidget(id, 'visible')}
                style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', color: w.visible ? 'var(--text-color)' : 'var(--text-secondary)', transition: 'all 0.15s' }}
                title={w.visible ? 'Hide' : 'Show'}>
                {w.visible ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          );
        })}

        <div style={{ marginTop: '24px' }}>
          <button onClick={handleSave} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Save
          </button>
        </div>

        {savedMsg && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '16px', fontSize: '13px', fontWeight: 500, color: 'var(--text-color)' }}>
            <CheckCircle2 size={16} />
            {savedMsg}
          </div>
        )}
      </div>
    </div>
  );
}
