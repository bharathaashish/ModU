import { useState } from 'react';
import { X, Save, LogOut, ChevronRight, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CONTENT_TYPES } from '../constants/contentTypes';

export default function Sidebar({ isOpen, onClose }) {
  const { user, updateUserSettings, logout } = useAuth();
  
  // Interests state - initialize from user directly
  const [selectedInterests, setSelectedInterests] = useState(() => user?.interests || []);
  
  // Feed state - initialize from user directly
  const [feedPref, setFeedPref] = useState(() => user?.feedPreference || 'Friends');
  
  const [savedMsg, setSavedMsg] = useState('');
  
  // Accordion State
  const [isInterestsExpanded, setIsInterestsExpanded] = useState(false);
  const [isFeedExpanded, setIsFeedExpanded] = useState(false);

  if (!isOpen) return null;

  const showMsg = (msg) => {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const handleSaveAll = async () => {
    // Save settings & wait for async context resolution
    await updateUserSettings({ interests: selectedInterests, feedPreference: feedPref });
    showMsg('Settings Saved to Cloud');
  };

  const toggleInterest = (id) => {
    setSelectedInterests(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <>
      <div 
        style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999
        }} 
        onClick={onClose} 
      />
      <div 
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: '85%', maxWidth: '400px',
          backgroundColor: 'var(--bg-color)', zIndex: 1000, display: 'flex', flexDirection: 'column',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.2)', transition: 'transform 0.3s ease-in-out',
          color: 'var(--text-color)'
        }}
        className="glass-card"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 16px', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 600 }}>Settings and Activity</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          
          {/* A. Edit Interests */}
          <div style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div 
              onClick={() => setIsInterestsExpanded(!isInterestsExpanded)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 16px', cursor: 'pointer' }}
            >
              <h3 style={{ fontSize: '16px', margin: 0, color: 'var(--text-color)', fontWeight: 500 }}>Edit Interests</h3>
              {isInterestsExpanded ? <ChevronDown size={20} color="var(--text-secondary)" /> : <ChevronRight size={20} color="var(--text-secondary)" />}
            </div>
            {isInterestsExpanded && (
              <div style={{ padding: '0 16px 20px 16px' }}>
                <div className="checkbox-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {CONTENT_TYPES.map(type => (
                    <label 
                      key={type.id} 
                      className={`checkbox-item ${selectedInterests.includes(type.id) ? 'selected' : ''}`}
                      style={{ padding: '8px 12px', margin: 0, fontSize: '14px' }}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedInterests.includes(type.id)}
                        onChange={() => toggleInterest(type.id)}
                      />
                      <span style={{ fontWeight: 500 }}>{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* B. Feed Control */}
          <div style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div 
              onClick={() => setIsFeedExpanded(!isFeedExpanded)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 16px', cursor: 'pointer' }}
            >
              <h3 style={{ fontSize: '16px', margin: 0, color: 'var(--text-color)', fontWeight: 500 }}>Feed Control</h3>
              {isFeedExpanded ? <ChevronDown size={20} color="var(--text-secondary)" /> : <ChevronRight size={20} color="var(--text-secondary)" />}
            </div>
            {isFeedExpanded && (
              <div style={{ padding: '0 16px 20px 16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {['Friends', 'Suggested', 'Balanced'].map(pref => (
                    <label 
                      key={pref} 
                      className={`checkbox-item ${feedPref === pref ? 'selected' : ''}`}
                      style={{ padding: '12px', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}
                    >
                      <input 
                        type="radio" name="feedPreference" value={pref} 
                        checked={feedPref === pref} onChange={() => setFeedPref(pref)}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--primary-color)' }}
                      />
                      <span style={{ fontWeight: 500, fontSize: '14px' }}>{pref}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-color)' }}>
          <button className="button" onClick={handleSaveAll} style={{ width: '100%', padding: '12px', fontWeight: 600, display: 'flex', justifyContent: 'center', gap: '8px' }}>
            <Save size={18} /> Save Settings
          </button>
          
          <button 
            onClick={logout} 
            className="button"
            style={{ width: '100%', backgroundColor: 'transparent', color: 'var(--error-color)', border: '1px solid var(--error-color)', padding: '12px', fontWeight: 600, display: 'flex', justifyContent: 'center', gap: '8px' }}
          >
            <LogOut size={18} /> Log Out
          </button>

          {savedMsg && (
            <div style={{ padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '8px', textAlign: 'center', fontSize: '14px', fontWeight: 500 }}>
              {savedMsg}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
