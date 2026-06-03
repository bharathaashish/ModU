import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Heart, UserPlus, Bell, UserCheck, X, FileText, MessageCircle, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';

export default function Notifications() {
  const { user, updateUser, refreshNotifications } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifs, setFilteredNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/users/${user.username}/notifications`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.username]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Filter notifications from blocked users and check DM mutes
  useEffect(() => {
    const filter = async () => {
      if (!user || notifications.length === 0) { setFilteredNotifs(notifications); return; }
      try {
        const res = await fetch(`/api/users/${user.username}/blocked`);
        const blocked = res.ok ? await res.json() : [];
        const blockedSet = new Set(blocked.map(b => b.username));
        setFilteredNotifs(notifications.filter(n => !blockedSet.has(n.fromUser)));
      } catch {
        setFilteredNotifs(notifications);
      }
    };
    filter();
  }, [notifications, user]);

  const markAsRead = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/users/${user.username}/notifications/read`, {
        method: 'POST'
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        refreshNotifications();
      }
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  }, [user, refreshNotifications]);

  useEffect(() => {
    if (notifications.length > 0 && notifications.some(n => !n.isRead)) {
      markAsRead();
    }
  }, [notifications, notifications.length, markAsRead]);

  const handleAccept = async (fromUsername, notifId) => {
    setProcessing(prev => ({ ...prev, [notifId]: 'accepting' }));
    try {
      const res = await fetch(`/api/users/${user.username}/follow-requests/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromUsername })
      });
      if (res.ok) {
        const userRes = await fetch(`/api/users/${user.username}`);
        if (userRes.ok) {
          const updatedUser = await userRes.json();
          updateUser(updatedUser);
        }
        setNotifications(prev => prev.filter(n => n._id !== notifId));
        refreshNotifications();
      }
    } catch (err) {
      console.error('Accept error:', err);
    } finally {
      setProcessing(prev => ({ ...prev, [notifId]: undefined }));
    }
  };

  const handleReject = async (fromUsername, notifId) => {
    setProcessing(prev => ({ ...prev, [notifId]: 'rejecting' }));
    try {
      const res = await fetch(`/api/users/${user.username}/follow-requests/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromUsername })
      });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n._id !== notifId));
        refreshNotifications();
      }
    } catch (err) {
      console.error('Reject error:', err);
    } finally {
      setProcessing(prev => ({ ...prev, [notifId]: undefined }));
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart size={16} fill="var(--text-color)" color="var(--text-color)" />;
      case 'follow':
        return <UserPlus size={16} color="var(--text-color)" />;
      case 'follow_request':
        return <UserPlus size={16} color="var(--text-secondary)" />;
      case 'post':
        return <FileText size={16} color="var(--text-color)" />;
      case 'message':
        return <MessageCircle size={16} color="var(--text-color)" />;
      default:
        return <Bell size={16} color="var(--text-secondary)" />;
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', minHeight: 'calc(100vh - 120px)' }}>
        <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '2px solid var(--border-color)', borderTopColor: 'var(--text-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="app-container" style={{ padding: 0, justifyContent: 'flex-start', minHeight: 'calc(100vh - 60px)' }}>
      <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-color)', margin: 0 }}>Notifications</h2>
        </div>

        {filteredNotifs.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '64px 20px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid var(--text-color)', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 24px' }}>
              <Bell size={32} color="var(--text-color)" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-color)', marginBottom: '8px' }}>No notifications yet</h3>
            <p style={{ fontSize: '14px', maxWidth: '280px', margin: '0 auto' }}>When someone likes your post, follows you, or sends you a message, you'll see it here.</p>
          </div>
        ) : (
          <div style={{ width: '100%' }}>
            {filteredNotifs.map((notification, idx) => (
              <div 
                key={notification._id || idx}
                style={{ 
                  padding: '16px',
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: notification.isRead ? 'transparent' : 'var(--surface-alt)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: notification.type === 'post' ? 'pointer' : 'default'
                }}
                onClick={() => {
                  if (notification.type === 'post' && notification.postId) {
                    navigate(`/post/${notification.postId}`);
                  }
                }}
              >
                <Avatar username={notification?.fromUser} image={notification?.profilePhoto} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', color: 'var(--text-color)', margin: 0 }}>
                    <span style={{ fontWeight: 600, cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); navigate(`/profile/${notification.fromUser}`); }}>{notification.fromUser}</span>{' '}
                    {notification.type === 'like' && 'liked your post'}
                    {notification.type === 'follow' && 'started following you'}
                    {notification.type === 'follow_request' && 'requested to follow you'}
                    {notification.type === 'comment' && 'commented on your post'}
                    {notification.type === 'post' && (notification.postId ? 'shared a new post' : 'shared a new update')}
                    {notification.type === 'message' && 'sent you a message'}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                    {formatTime(notification.createdAt)}
                  </p>
                </div>

                {notification.type === 'follow_request' && (
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button
                      onClick={() => handleAccept(notification.fromUser, notification._id)}
                      disabled={processing[notification._id] === 'accepting'}
                      style={{
                        padding: '6px 16px', backgroundColor: "var(--active-color)", border: 'none',
                        borderRadius: '6px', color: 'var(--active-text)', fontWeight: 600, fontSize: '13px',
                        cursor: processing[notification._id] ? 'not-allowed' : 'pointer',
                        opacity: processing[notification._id] ? 0.5 : 1
                      }}
                    >
                      {processing[notification._id] === 'accepting' ? '...' : <UserCheck size={16} />}
                    </button>
                    <button
                      onClick={() => handleReject(notification.fromUser, notification._id)}
                      disabled={processing[notification._id] === 'rejecting'}
                      style={{
                        padding: '6px 16px', backgroundColor: 'transparent', border: '1px solid var(--border-color)',
                        borderRadius: '6px', color: 'var(--text-color)', fontWeight: 600, fontSize: '13px',
                        cursor: processing[notification._id] ? 'not-allowed' : 'pointer',
                        opacity: processing[notification._id] ? 0.5 : 1
                      }}
                    >
                      {processing[notification._id] === 'rejecting' ? '...' : <X size={16} />}
                    </button>
                  </div>
                )}

                {!notification.isRead && notification.type !== 'follow_request' && (
                  <div style={{ 
                    width: '8px', height: '8px', borderRadius: '50%', 
                    backgroundColor: "var(--active-color)", flexShrink: 0
                  }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
