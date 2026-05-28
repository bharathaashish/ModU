import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Compass, User, Heart, Menu, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const unreadCount = user?.notifications?.filter(n => !n.isRead).length || 0;

  const renderTopBar = () => {
    if (location.pathname === '/') {
      return (
        <div className="top-bar-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
          <h1 className="logo-text" style={{ margin: 0, fontSize: '24px' }}><span style={{ fontWeight: 900 }}>M</span>od<span style={{ fontWeight: 900 }}>U</span></h1>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button onClick={() => navigate('/notifications')} style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer', padding: 0, position: 'relative' }}>
              <Heart size={24} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: '#ed4956',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 600,
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
<button onClick={() => navigate('/messages')} style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer', padding: 0 }}>
              <MessageCircle size={24} />
            </button>
          </div>
        </div>
      );
    }
    
    if (location.pathname === '/profile') {
      return (
        <div className="top-bar-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>{user?.username}</h2>
          <button onClick={() => navigate('/settings')} style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}>
            <Menu size={24} />
          </button>
        </div>
      );
    }

    if (location.pathname === '/notifications') {
      return (
        <div className="top-bar-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Notifications</h2>
        </div>
      );
    }
    
    // Default top bar
    return (
      <div className="top-bar-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px' }}>
        <h1 className="logo-text" style={{ margin: 0, fontSize: '24px' }}><span style={{ fontWeight: 900 }}>M</span>od<span style={{ fontWeight: 900 }}>U</span></h1>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      {renderTopBar()}
      
      <div className="layout-content" style={{ flex: 1, paddingBottom: '70px' }}>
        <Outlet />
      </div>

      <nav className="bottom-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Home size={24} />
        </NavLink>
        <NavLink to="/discover" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Compass size={24} />
        </NavLink>
        <NavLink to="/messages" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <MessageCircle size={24} />
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <User size={24} />
        </NavLink>
      </nav>
    </div>
  );
}
