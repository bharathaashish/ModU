import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { ArrowLeft, Send, MessageCircle, Users, LogOut, Globe, Lock, Image, X, Search, ChevronRight, Clock } from 'lucide-react';

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function Messages() {
  const { username } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [targetUser, setTargetUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [targetLoading, setTargetLoading] = useState(false);
  const [dmImage, setDmImage] = useState(null);
  const [dmPreview, setDmPreview] = useState('');
  const fileInputRef = useRef(null);
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chats');
  const [joinedCommunities, setJoinedCommunities] = useState([]);
  const [joinedLoading, setJoinedLoading] = useState(false);
  const [leavingId, setLeavingId] = useState(null);
  const messagesEndRef = useRef(null);

  const selectedUser = username || location.state?.selectedUser || null;

  useEffect(() => {
    if (!selectedUser && user) {
      setConversationsLoading(true);
      fetch(`/api/conversations/${user.username}`)
        .then(res => res.json())
        .then(setConversations)
        .catch(() => {})
        .finally(() => setConversationsLoading(false));
    }
  }, [selectedUser, user]);

  useEffect(() => {
    if (!selectedUser && user && activeTab === 'communities') {
      setJoinedLoading(true);
      fetch(`/api/community/joined/${user.username}`)
        .then(res => res.ok ? res.json() : [])
        .then(setJoinedCommunities)
        .catch(() => {})
        .finally(() => setJoinedLoading(false));
    }
  }, [selectedUser, user, activeTab]);

  useEffect(() => {
    if (selectedUser && user) {
      setTargetLoading(true);
      fetch(`/api/users/${selectedUser}`)
        .then(res => res.json())
        .then(data => { setTargetUser(data); setTargetLoading(false); })
        .catch(() => setTargetLoading(false));

      fetch(`/api/messages/${user.username}/${selectedUser}`)
        .then(res => res.json())
        .then(setMessages)
        .catch(() => {});
    }
  }, [selectedUser, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => { setDmPreview(e.target.result); setDmImage(e.target.result); };
      reader.readAsDataURL(file);
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !dmImage) || !selectedUser || !user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: user.username, receiver: selectedUser, content: newMessage.trim(), image: dmImage })
      });
      if (res.ok) {
        const message = await res.json();
        setMessages(prev => [...prev, message]);
        setNewMessage('');
        setDmImage(null);
        setDmPreview('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch {}
    setLoading(false);
  };

  const handleLeave = async (communityId) => {
    if (!user) return;
    setLeavingId(communityId);
    try {
      const res = await fetch(`/api/community/${communityId}/leave`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
      });
      if (res.ok) {
        setJoinedCommunities(prev => prev.filter(c => c._id !== communityId));
      }
    } catch {}
    setLeavingId(null);
  };

  const keyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!user) {
    return <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>Please log in</div>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', paddingBottom: '100px' }}>
      {selectedUser ? (
        /* === ACTIVE CHAT VIEW — PREMIUM LAYOUT === */
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', maxWidth: '720px', margin: '0 auto', width: '100%' }}>
          {/* Chat header with profile card feel */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'var(--card-bg)' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', color: 'var(--text-color)' }}>
              <ArrowLeft size={22} />
            </button>
            <Avatar username={selectedUser} size={42} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-color)' }}>
                {targetLoading ? 'Loading...' : targetUser?.name || targetUser?.username || selectedUser}
              </div>
              {targetUser?.name && targetUser?.username !== targetUser?.name && (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>@{targetUser.username}</div>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} />
              {messages.length > 0 && (Date.now() - new Date(messages[messages.length - 1].timestamp).getTime() < 300000) ? 'Active now' : 'Offline'}
            </div>
          </div>

          {/* Messages area with improved spacing */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', backgroundColor: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '80px 20px', marginTop: 'auto', marginBottom: 'auto' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: 'var(--hover-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <MessageCircle size={32} style={{ opacity: 0.6 }} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-color)' }}>No messages yet</h3>
                <p style={{ fontSize: '14px' }}>Send a message to start the conversation.</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMine = msg.sender === user.username;
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: '16px' }}>
                    <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                      {!isMine && (
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', paddingLeft: '4px' }}>
                          {msg.sender}
                        </div>
                      )}
                      <div style={{
                        padding: '12px 18px',
                        backgroundColor: isMine ? 'var(--primary-color)' : 'var(--card-bg)',
                        borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        color: isMine ? '#fff' : 'var(--text-color)',
                        border: isMine ? 'none' : '1px solid var(--border-color)',
                        boxShadow: isMine ? '0 2px 8px rgba(0,0,0,0.08)' : '0 1px 4px rgba(0,0,0,0.04)',
                        wordWrap: 'break-word',
                        fontSize: '15px',
                        lineHeight: '1.45'
                      }}>
                        {msg.content}
                        {msg.image && (
                          <div style={{ marginTop: '8px', borderRadius: '12px', overflow: 'hidden', maxWidth: '280px', backgroundColor: 'var(--border-color)' }}>
                            <img src={msg.image} alt="" style={{ width: '100%', display: 'block' }} />
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', padding: '0 4px' }}>
                        {timeAgo(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar with glass styling */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
            {dmPreview && (
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '10px' }}>
                <img src={dmPreview} alt="" style={{ height: '64px', borderRadius: '10px', border: '1px solid var(--border-color)' }} />
                <button onClick={() => { setDmPreview(''); setDmImage(null); }}
                  style={{ position: 'absolute', top: '-8px', right: '-8px', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={14} />
                </button>
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <button onClick={() => fileInputRef.current?.click()}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px', flexShrink: 0, borderRadius: '8px', transition: 'background 0.15s' }}>
                <Image size={22} />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
              <div style={{ flex: 1, display: 'flex', backgroundColor: 'var(--bg-color)', borderRadius: '24px', border: '1px solid var(--border-color)', padding: '4px', transition: 'border-color 0.2s' }}>
                <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={keyPress}
                  placeholder="Type a message..."
                  rows="1"
                  style={{ flex: 1, minHeight: '44px', maxHeight: '120px', padding: '10px 16px', borderRadius: '20px', border: 'none', backgroundColor: 'transparent', color: 'var(--text-color)', resize: 'none', outline: 'none', fontSize: '15px', lineHeight: '1.4' }} />
                <button onClick={sendMessage} disabled={loading || (!newMessage.trim() && !dmImage)}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: loading || (!newMessage.trim() && !dmImage) ? 'var(--hover-bg)' : 'var(--primary-color)', border: 'none', color: 'white', cursor: loading || (!newMessage.trim() && !dmImage) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 'auto', transition: 'all 0.2s' }}>
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* === SIDEBAR / TAB LAYOUT — MODULAR DESIGN === */
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 16px' }}>
          {/* Header */}
          <div style={{ padding: '24px 0 16px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-color)', margin: 0 }}>Messages</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>Your conversations and communities</p>
          </div>

          {/* Tabs — pill style */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', backgroundColor: 'var(--hover-bg)', borderRadius: '12px', padding: '4px' }}>
            <button onClick={() => setActiveTab('chats')}
              style={{ flex: 1, padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '14px', backgroundColor: activeTab === 'chats' ? 'var(--card-bg)' : 'transparent', color: activeTab === 'chats' ? 'var(--text-color)' : 'var(--text-secondary)', boxShadow: activeTab === 'chats' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none', transition: 'all 0.2s' }}>
              <MessageCircle size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Chats
            </button>
            <button onClick={() => setActiveTab('communities')}
              style={{ flex: 1, padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '14px', backgroundColor: activeTab === 'communities' ? 'var(--card-bg)' : 'transparent', color: activeTab === 'communities' ? 'var(--text-color)' : 'var(--text-secondary)', boxShadow: activeTab === 'communities' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none', transition: 'all 0.2s' }}>
              <Users size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Communities
            </button>
          </div>

          {activeTab === 'chats' ? (
            /* === CHATS TAB — modern conversation cards === */
            conversationsLoading ? (
              <div style={{ padding: '64px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '2px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: '80px 20px', textAlign: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--hover-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <MessageCircle size={36} style={{ opacity: 0.5 }} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-color)' }}>No messages yet</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '280px', margin: '0 auto' }}>
                  Find someone to talk to from their profile or communities.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {conversations.map((conv) => {
                  const partnerName = conv.partnerInfo?.username || conv.partner;
                  const time = timeAgo(conv.lastTimestamp);
                  const isOnline = conv.lastTimestamp && (Date.now() - new Date(conv.lastTimestamp).getTime() < 300000);
                  return (
                    <div key={partnerName} onClick={() => navigate(`/messages/${partnerName}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', backgroundColor: 'var(--card-bg)', borderRadius: '14px', border: '1px solid var(--border-color)', cursor: 'pointer', boxShadow: 'var(--card-shadow)', transition: 'all 0.2s ease' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--card-shadow-hover)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--card-shadow)'; }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <Avatar username={partnerName} size={50} />
                        {isOnline && <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#31c24d', border: '3px solid var(--card-bg)' }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {conv.partnerInfo?.name && (
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '1px' }}>{conv.partnerInfo.name}</div>
                        )}
                        <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-color)', marginBottom: '3px' }}>{partnerName}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {conv.lastMessage || 'No messages yet'}
                        </div>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', flexShrink: 0, alignSelf: 'flex-start', marginTop: '2px' }}>{time}</div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* === COMMUNITIES TAB — premium community cards === */
            joinedLoading ? (
              <div style={{ padding: '64px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '2px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : joinedCommunities.length === 0 ? (
              <div style={{ padding: '80px 20px', textAlign: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--hover-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <Users size={36} style={{ opacity: 0.5 }} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-color)' }}>No joined communities</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '280px', margin: '0 auto 20px' }}>
                  Discover communities that match your interests.
                </p>
                <button className="btn-primary" onClick={() => navigate('/discover')}>
                  Explore Communities
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {joinedCommunities.map(c => (
                  <div key={c._id}
                    style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', backgroundColor: 'var(--card-bg)', borderRadius: '14px', border: '1px solid var(--border-color)', cursor: 'pointer', boxShadow: 'var(--card-shadow)', transition: 'all 0.2s ease' }}
                    onClick={() => navigate(`/community/${c._id}`)}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--card-shadow-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--card-shadow)'; }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--hover-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, border: '1px solid var(--border-color)' }}>
                      {c.icon || '🏠'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-color)' }}>{c.name}</span>
                        {c.isPrivate ? <Lock size={12} color="var(--text-secondary)" /> : <Globe size={12} color="var(--text-secondary)" />}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{c.memberCount} members</span>
                        <span>·</span>
                        <span>{c.channels?.length || 0} channels</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                      <ChevronRight size={18} color="var(--text-secondary)" style={{ opacity: 0.5 }} />
                      <button onClick={(e) => { e.stopPropagation(); handleLeave(c._id); }} disabled={leavingId === c._id}
                        style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 600, borderRadius: '8px', border: '1px solid var(--border-color)', cursor: leavingId === c._id ? 'not-allowed' : 'pointer', backgroundColor: 'var(--bg-color)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', opacity: leavingId === c._id ? 0.5 : 1, transition: 'all 0.15s' }}>
                        <LogOut size={12} />
                        {leavingId === c._id ? 'Leaving...' : 'Leave'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
