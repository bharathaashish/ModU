import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, ChevronRight, Plus, Search } from 'lucide-react';

export default function Hubs() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialHub = searchParams.get('hub');
  const [hubs, setHubs] = useState([]);
  const [hubData, setHubData] = useState({});
  const [expandedHubs, setExpandedHubs] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/hubs');
      if (res.ok) {
        const list = await res.json();
        setHubs(list);
        if (initialHub && list.some(h => h._id === initialHub)) {
          setExpandedHubs(prev => ({ ...prev, [initialHub]: true }));
          const commRes = await fetch(`/api/hubs/${initialHub}/communities`);
          if (commRes.ok) {
            const data = await commRes.json();
            setHubData(prev => ({ ...prev, [initialHub]: data }));
          }
        }
      }
      setLoading(false);
    }
    load();
  }, [initialHub]);

  const toggleHub = async (hubId) => {
    if (expandedHubs[hubId]) {
      setExpandedHubs(prev => ({ ...prev, [hubId]: !prev[hubId] }));
      return;
    }
    if (!hubData[hubId]) {
      const res = await fetch(`/api/hubs/${hubId}/communities`);
      if (res.ok) {
        const data = await res.json();
        setHubData(prev => ({ ...prev, [hubId]: data }));
      }
    }
    setExpandedHubs(prev => ({ ...prev, [hubId]: true }));
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <button onClick={() => navigate('/discover')} style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer', display: 'flex', padding: '4px' }}>
            <ArrowLeft size={22} />
          </button>
          <span className="page-title">Interest Hubs</span>
        </div>
        <button className="create-btn" onClick={() => navigate('/communities')} style={{ fontSize: '13px', padding: '8px 14px' }}>
          <Search size={16} />
          <span>Browse</span>
        </button>
        <button className="create-btn" onClick={() => navigate('/community/create')} style={{ fontSize: '13px', padding: '8px 14px' }}>
          <Plus size={16} />
          <span>Create</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading hubs...</div>
      ) : hubs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 20px', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏠</div>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-color)' }}>No hubs yet</div>
          <div style={{ fontSize: '14px' }}>Hubs will appear here once they're available.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {hubs.map(hub => (
            <div key={hub._id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'var(--card-bg)' }}>
              <div
                onClick={() => toggleHub(hub._id)}
                style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px 20px', cursor: 'pointer', backgroundColor: 'var(--bg-color)', transition: 'background-color 0.2s' }}
              >
                <span style={{ fontSize: '32px' }}>{hub.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-color)' }}>{hub.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{hub.description}</div>
                </div>
                {expandedHubs[hub._id] ? <ChevronUp size={20} color="var(--text-secondary)" /> : <ChevronDown size={20} color="var(--text-secondary)" />}
              </div>

              {expandedHubs[hub._id] && (
                <div style={{ padding: '8px 20px 20px' }}>
                  {(hubData[hub._id] || []).length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      Loading communities...
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(hubData[hub._id] || []).map(community => (
                        <div
                          key={community._id}
                          className="card-item"
                          style={{ padding: '14px 16px' }}
                          onClick={() => navigate(`/community/${community._id}`)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                              {hub.icon}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="card-item-title">{community.name}</div>
                              <div className="card-item-sub">{community.description}</div>
                              <div className="card-item-meta">
                                <span>{community.memberCount?.toLocaleString()} members</span>
                                <span>·</span>
                                <span>{community.channels?.length || 0} channels</span>
                              </div>
                            </div>
                            <ChevronRight size={18} color="var(--text-secondary)" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
