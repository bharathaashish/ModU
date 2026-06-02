import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { ArrowLeft, Send, MessageCircle, Image, X, MoreVertical, BellOff, Ban, User, Check, Users, Globe, Lock, LogOut, ChevronRight, Edit3 } from 'lucide-react';

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
  const [needsAcceptance, setNeedsAcceptance] = useState(false);
  const [acceptanceDone, setAcceptanceDone] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [targetUser, setTargetUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [targetLoading, setTargetLoading] = useState(false);
  const [dmImage, setDmImage] = useState(null);
  const [dmPreview, setDmPreview] = useState('');
  const fileInputRef = useRef(null);
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [showConvOptions, setShowConvOptions] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDmMuted, setIsDmMuted] = useState(false);
  const [showDmMuteOptions, setShowDmMuteOptions] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [joinedCommunities, setJoinedCommunities] = useState([]);
  const [joinedLoading, setJoinedLoading] = useState(false);
  const [leavingId, setLeavingId] = useState(null);
  const [activeTab, setActiveTab] = useState('inbox');
  const [nicknames, setNicknames] = useState({});
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [showMsgMenu, setShowMsgMenu] = useState(false);
  const [editingMsg, setEditingMsg] = useState(null);
  const [editContent, setEditContent] = useState('');
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
    if (user) {
      fetch(`/api/users/${user.username}/nicknames`)
        .then(res => res.json())
        .then(data => {
          const map = {};
          (data || []).forEach(n => { map[n.partner] = n.nickname; });
          setNicknames(map);
        })
        .catch(() => {});
    }
  }, [user]);

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

      fetch(`/api/users/${user.username}/block-check/${selectedUser}`)
        .then(res => res.ok ? res.json() : {})
        .then(data => setIsBlocked(data.blockedByMe || false))
        .catch(() => {});

      fetch(`/api/messages/${user.username}/${selectedUser}`)
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data.messages)) {
            setMessages(data.messages);
            setNeedsAcceptance(data.needsAcceptance);
            setAcceptanceDone(false);
          }
        })
        .catch(() => {});

      fetch(`/api/users/${user.username}/dm-muted`)
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          setIsDmMuted(!!data.find(m => m.username === selectedUser));
        })
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
        const result = await res.json();
        setMessages(prev => [...prev, result.data]);
        setNewMessage('');
        setDmImage(null);
        setDmPreview('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setErrorMsg('Message could not be delivered.');
        setTimeout(() => setErrorMsg(''), 3000);
      }
    } catch {
      setErrorMsg('Message could not be delivered.');
      setTimeout(() => setErrorMsg(''), 3000);
    }
    setLoading(false);
  };

  const keyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleAcceptMessages = async () => {
    if (!user || !selectedUser) return;
    try {
      const res = await fetch(`/api/users/${user.username}/accept-messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUsername: selectedUser })
      });
      if (res.ok) {
        setNeedsAcceptance(false);
        setAcceptanceDone(true);
      }
    } catch {}
  };

  const handleIgnore = () => {
    setNeedsAcceptance(false);
    setAcceptanceDone(true);
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

  const getDisplayName = (partnerUsername) => {
    return nicknames[partnerUsername] || partnerUsername;
  };

  const handleDeleteForMe = async (msgId) => {
    const res = await fetch(`/api/messages/${msgId}/delete/${user.username}`, { method: 'POST' });
    if (res.ok) {
      setMessages(prev => prev.filter(m => m._id !== msgId));
      setShowMsgMenu(false);
    }
  };

  const handleDeleteForEveryone = async (msgId) => {
    const res = await fetch(`/api/messages/${msgId}/delete-everyone`, { method: 'POST' });
    if (res.ok) {
      setMessages(prev => prev.map(m => m._id === msgId ? { ...m, isDeleted: true, content: 'This message was deleted', image: null } : m));
      setShowMsgMenu(false);
    }
  };

  const handleEditMessage = async (msgId) => {
    if (!editContent.trim()) return;
    const res = await fetch(`/api/messages/${msgId}/edit`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editContent.trim() })
    });
    if (res.ok) {
      const data = await res.json();
      setMessages(prev => prev.map(m => m._id === msgId ? data.data : m));
      setEditingMsg(null);
      setEditContent('');
      setShowMsgMenu(false);
    }
  };

  const openMsgMenu = (msg, e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedMsg(msg);
    setShowMsgMenu(true);
  };

  const msgAge = (msg) => Date.now() - new Date(msg.timestamp).getTime();
  const canDeleteEveryone = (msg) => msg.sender === user.username && msgAge(msg) <= 30 * 60 * 1000;
  const canEdit = (msg) => msg.sender === user.username && msgAge(msg) <= 30 * 60 * 1000;

  if (!user) {
    return <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>Please log in</div>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', paddingBottom: '100px' }}>
      {selectedUser ? (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', maxWidth: '720px', margin: '0 auto', width: '100%' }}>
          {/* Chat header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'var(--card-bg)' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', color: 'var(--text-color)' }}>
              <ArrowLeft size={22} />
            </button>
            <Avatar username={selectedUser} image={targetUser?.profilePhoto} size={42} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {targetLoading ? 'Loading...' : getDisplayName(selectedUser)}
                {nicknames[selectedUser] && <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 400 }}>(@{selectedUser})</span>}
                {isDmMuted && <BellOff size={12} color="var(--text-tertiary)" />}
              </div>
              {targetUser?.name && targetUser?.username !== targetUser?.name && (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>@{targetUser.username}</div>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowConvOptions(!showConvOptions)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: 'var(--text-secondary)', display: 'flex', borderRadius: '8px' }}>
                <MoreVertical size={20} />
              </button>
              {showConvOptions && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => { setShowConvOptions(false); setShowDmMuteOptions(false); }} />
                  <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 51, backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', minWidth: '200px', overflow: 'hidden', marginTop: '4px' }}>
                    <button onClick={() => { setShowConvOptions(false); navigate(`/profile/${selectedUser}`); }}
                      style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', color: 'var(--text-color)', fontSize: '13px', cursor: 'pointer', textAlign: 'left', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={14} /> View Profile
                    </button>
                    <button onClick={() => { setShowConvOptions(false); setNicknameInput(nicknames[selectedUser] || ''); setShowNicknameModal(true); }}
                      style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', color: 'var(--text-color)', fontSize: '13px', cursor: 'pointer', textAlign: 'left', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Edit3 size={14} /> {nicknames[selectedUser] ? 'Change Nickname' : 'Set Nickname'}
                    </button>
                    <div style={{ height: '1px', backgroundColor: 'var(--border-color)' }} />
                    {isDmMuted ? (
                      <button onClick={async () => {
                        const res = await fetch(`/api/users/${user.username}/dm-unmute`, {
                          method: 'POST', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ targetUsername: selectedUser })
                        });
                        if (res.ok) { setIsDmMuted(false); setShowConvOptions(false); }
                      }}
                        style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', color: 'var(--text-color)', fontSize: '13px', cursor: 'pointer', textAlign: 'left', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BellOff size={14} /> Unmute Notifications
                      </button>
                    ) : (
                      <button onClick={() => setShowDmMuteOptions(true)}
                        style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', color: 'var(--text-color)', fontSize: '13px', cursor: 'pointer', textAlign: 'left', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BellOff size={14} /> Mute Notifications
                      </button>
                    )}
                    <div style={{ height: '1px', backgroundColor: 'var(--border-color)' }} />
                    {isBlocked ? (
                      <button onClick={async () => {
                        const res = await fetch(`/api/users/${user.username}/unblock`, {
                          method: 'POST', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ targetUsername: selectedUser })
                        });
                        if (res.ok) { setIsBlocked(false); setShowConvOptions(false); }
                      }}
                        style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', color: 'var(--text-color)', fontSize: '13px', cursor: 'pointer', textAlign: 'left', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Ban size={14} /> Unblock @{selectedUser}
                      </button>
                    ) : (<>
                      <button onClick={() => { setShowConvOptions(false); setShowBlockConfirm(true); }}
                        style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', color: 'var(--text-color)', fontSize: '13px', cursor: 'pointer', textAlign: 'left', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Ban size={14} /> Block @{selectedUser}
                    </button>
                    <div style={{ height: '1px', backgroundColor: 'var(--border-color)' }} />
                    <button onClick={async () => {
                      const res = await fetch(`/api/conversations/${user.username}/${selectedUser}/delete`, { method: 'POST' });
                      if (res.ok) { setShowConvOptions(false); navigate(-1); }
                    }}
                      style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', color: '#e74c3c', fontSize: '13px', cursor: 'pointer', textAlign: 'left', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <X size={14} /> Delete Chat
                    </button>
                    </>)}
                  </div>
                </>
              )}
              {showDmMuteOptions && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 52 }} onClick={() => setShowDmMuteOptions(false)} />
                  <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 53, backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', minWidth: '200px', overflow: 'hidden', marginTop: '4px' }}>
                    <div style={{ padding: '8px 14px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>Mute for</div>
                    {['8h', '24h', '7d', 'forever'].map(dur => (
                      <button key={dur} onClick={async () => {
                        const res = await fetch(`/api/users/${user.username}/dm-mute`, {
                          method: 'POST', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ targetUsername: selectedUser, duration: dur })
                        });
                        if (res.ok) { setIsDmMuted(true); setShowDmMuteOptions(false); setShowConvOptions(false); }
                      }}
                        style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', color: 'var(--text-color)', fontSize: '13px', cursor: 'pointer', textAlign: 'left', fontWeight: 500 }}>
                        {dur === '8h' ? '8 hours' : dur === '24h' ? '24 hours' : dur === '7d' ? '7 days' : 'Forever'}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Messages area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', backgroundColor: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
            {needsAcceptance ? (
              <div style={{ padding: '16px', marginBottom: '16px', backgroundColor: 'var(--surface-alt)', borderRadius: '12px', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
                  This user is not in your following list.
                </p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={handleAcceptMessages}
                    style={{ padding: '8px 20px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: 'none', background: "var(--text-color)", color: 'var(--active-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={14} /> Accept Messages
                  </button>
                  <button onClick={handleIgnore}
                    style={{ padding: '8px 20px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-color)', cursor: 'pointer' }}>
                    Ignore
                  </button>
                  <button onClick={() => setShowBlockConfirm(true)}
                    style={{ padding: '8px 20px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Ban size={14} /> Block
                  </button>
                </div>
              </div>
            ) : null}
            {isBlocked ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '80px 20px', marginTop: 'auto', marginBottom: 'auto', maxWidth: '360px', marginLeft: 'auto', marginRight: 'auto' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Ban size={32} style={{ opacity: 0.5 }} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-color)' }}>Messaging unavailable</h3>
                <p style={{ fontSize: '14px', lineHeight: '1.5' }}>You cannot send messages to this user.</p>
              </div>
            ) : messages.length === 0 && !needsAcceptance ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '80px 20px', marginTop: 'auto', marginBottom: 'auto' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <MessageCircle size={32} style={{ opacity: 0.6 }} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-color)' }}>No messages yet</h3>
                <p style={{ fontSize: '14px' }}>Send a message to start the conversation.</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMine = msg.sender === user.username;
                return (
                  <div key={msg._id || i} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: '16px' }}
                    onContextMenu={(e) => { if (!msg.isDeleted) openMsgMenu(msg, e); }}>
                    <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                      {!isMine && (
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', paddingLeft: '4px' }}>
                          {msg.sender}
                        </div>
                      )}
                      <div style={{
                        padding: '12px 18px',
                        backgroundColor: isMine ? 'var(--text-color)' : 'var(--card-bg)',
                        borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        color: isMine ? 'var(--active-text)' : 'var(--text-color)',
                        border: isMine ? 'none' : '1px solid var(--border-color)',
                        boxShadow: isMine ? '0 2px 8px rgba(0,0,0,0.08)' : '0 1px 4px rgba(0,0,0,0.04)',
                        wordWrap: 'break-word',
                        fontSize: '15px',
                        lineHeight: '1.45',
                        opacity: msg.isDeleted ? 0.6 : 1,
                        fontStyle: msg.isDeleted ? 'italic' : 'normal'
                      }}>
                        {msg.isDeleted ? 'This message was deleted' : msg.content}
                        {!msg.isDeleted && msg.image && (
                          <div style={{ marginTop: '8px', borderRadius: '12px', overflow: 'hidden', maxWidth: '280px', backgroundColor: 'var(--border-color)' }}>
                            <img src={msg.image} alt="" style={{ width: '100%', display: 'block' }} />
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', padding: '0 4px', display: 'flex', gap: '4px' }}>
                        {timeAgo(msg.timestamp)}
                        {msg.editedAt && <span>· Edited</span>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            {/* Message context menu */}
            {showMsgMenu && selectedMsg && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => { setShowMsgMenu(false); setSelectedMsg(null); }} />
                <div style={{ position: 'absolute', bottom: '80px', right: '20px', zIndex: 91, backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', minWidth: '200px', overflow: 'hidden' }}>
                  <button onClick={() => { handleDeleteForMe(selectedMsg._id); }}
                    style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', color: '#e74c3c', fontSize: '13px', cursor: 'pointer', textAlign: 'left', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <X size={14} /> Delete For Me
                  </button>
                  {canDeleteEveryone(selectedMsg) && (
                    <button onClick={() => { handleDeleteForEveryone(selectedMsg._id); }}
                      style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', color: '#e74c3c', fontSize: '13px', cursor: 'pointer', textAlign: 'left', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <X size={14} /> Delete For Everyone
                    </button>
                  )}
                  {canEdit(selectedMsg) && (
                    <button onClick={() => { setEditingMsg(selectedMsg._id); setEditContent(selectedMsg.content); setShowMsgMenu(false); }}
                      style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', color: 'var(--text-color)', fontSize: '13px', cursor: 'pointer', textAlign: 'left', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Edit3 size={14} /> Edit
                    </button>
                  )}
                </div>
              </>
            )}
            {/* Edit message modal */}
            {editingMsg && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}
                onClick={() => { setEditingMsg(null); setEditContent(''); }}>
                <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '12px', padding: '24px', maxWidth: '420px', width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-color)' }}>Edit Message</h3>
                  <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
                    rows="3"
                    style={{ width: '100%', padding: '10px 12px', backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-color)', fontSize: '14px', outline: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box', resize: 'none', marginBottom: '16px' }} />
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={() => { setEditingMsg(null); setEditContent(''); }}
                      style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-color)', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={() => handleEditMessage(editingMsg)}
                      style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: 'none', background: "var(--text-color)", color: 'var(--active-text)', cursor: 'pointer' }}>Save</button>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          {!isBlocked && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
            {errorMsg && (
              <div style={{ marginBottom: '8px', padding: '8px 12px', backgroundColor: 'var(--surface-alt)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                {errorMsg}
              </div>
            )}
            {dmPreview && (
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '10px' }}>
                <img src={dmPreview} alt="" style={{ height: '64px', borderRadius: '10px', border: '1px solid var(--border-color)' }} />
                <button onClick={() => { setDmPreview(''); setDmImage(null); }}
                  style={{ position: 'absolute', top: '-8px', right: '-8px', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', color: 'var(--active-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                  style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: loading || (!newMessage.trim() && !dmImage) ? 'var(--surface-alt)' : 'var(--text-color)', border: 'none', color: 'var(--active-text)', cursor: loading || (!newMessage.trim() && !dmImage) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 'auto', transition: 'all 0.2s' }}>
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
          )}
          {/* Block Confirm Modal */}
          {showBlockConfirm && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '12px', padding: '24px', maxWidth: '380px', width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-color)' }}>Block @{selectedUser}?</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>They will no longer be able to view your profile, posts, stories, or contact you.</p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowBlockConfirm(false)}
                    style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-color)', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={async () => {
                    const res = await fetch(`/api/users/${user.username}/block`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ targetUsername: selectedUser })
                    });
                    if (res.ok) { setIsBlocked(true); setShowBlockConfirm(false); }
                  }}
                    style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: 'none', background: 'var(--active-color)', color: 'var(--active-text)', cursor: 'pointer' }}>Block</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* === SIDEBAR / TAB LAYOUT === */
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 16px' }}>
          {/* Header */}
          <div style={{ padding: '24px 0 16px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-color)', margin: 0 }}>Messages</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>Your conversations and communities</p>
          </div>

          {/* Tabs — pill style */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', backgroundColor: 'var(--surface-alt)', borderRadius: '12px', padding: '4px' }}>
            <button onClick={() => setActiveTab('inbox')}
              style={{ flex: 1, padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '14px', backgroundColor: activeTab === 'inbox' ? 'var(--card-bg)' : 'transparent', color: activeTab === 'inbox' ? 'var(--text-color)' : 'var(--text-secondary)', boxShadow: activeTab === 'inbox' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none', transition: 'all 0.2s' }}>
              <MessageCircle size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Inbox
            </button>
            <button onClick={() => setActiveTab('communities')}
              style={{ flex: 1, padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '14px', backgroundColor: activeTab === 'communities' ? 'var(--card-bg)' : 'transparent', color: activeTab === 'communities' ? 'var(--text-color)' : 'var(--text-secondary)', boxShadow: activeTab === 'communities' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none', transition: 'all 0.2s' }}>
              <Users size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Communities
            </button>
          </div>

          {activeTab === 'inbox' ? (
            /* === INBOX TAB === */
            conversationsLoading ? (
              <div style={{ padding: '64px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '2px solid var(--border-color)', borderTopColor: 'var(--text-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: '80px 20px', textAlign: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
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
                  const displayName = nicknames[partnerName] || partnerName;
                  const time = timeAgo(conv.lastTimestamp);
                  const isOnline = conv.lastTimestamp && (Date.now() - new Date(conv.lastTimestamp).getTime() < 300000);
                  return (
                    <div key={partnerName} onClick={() => navigate(`/messages/${partnerName}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', backgroundColor: 'var(--card-bg)', borderRadius: '14px', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s ease' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; ; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = ''; ; }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <Avatar username={partnerName} image={conv.partnerInfo?.profilePhoto} size={50} />
                        {isOnline && <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: 'var(--text-secondary)', border: '3px solid var(--card-bg)' }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {conv.partnerInfo?.name && (
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '1px' }}>{conv.partnerInfo.name}</div>
                        )}
                        <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-color)', marginBottom: '3px' }}>
                          {displayName}
                          {nicknames[partnerName] && <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 400, marginLeft: '4px' }}>@{partnerName}</span>}
                          {conv.needsAcceptance && <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 400, marginLeft: '6px' }}>· Pending</span>}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {conv.lastMessage || 'No messages yet'}
                        </div>
                      </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{time}</div>
                      {conv.dmMuted && <BellOff size={12} color="var(--text-tertiary)" />}
                      {conv.needsAcceptance && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: "var(--active-color)" }} />}
                    </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* === COMMUNITIES TAB === */
            joinedLoading ? (
              <div style={{ padding: '64px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '2px solid var(--border-color)', borderTopColor: 'var(--text-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : joinedCommunities.length === 0 ? (
              <div style={{ padding: '80px 20px', textAlign: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
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
                    style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', backgroundColor: 'var(--card-bg)', borderRadius: '14px', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s ease' }}
                    onClick={() => navigate(`/community/${c._id}`)}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; ; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; ; }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, border: '1px solid var(--border-color)' }}>
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

      {/* Nickname Modal */}
      {showNicknameModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '12px', padding: '24px', maxWidth: '360px', width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-color)' }}>
              {nicknames[selectedUser] ? 'Change Nickname' : 'Set Nickname'}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
              Assign a personal nickname for <strong>@{selectedUser}</strong>. Only you can see this.
            </p>
            <input
              type="text"
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              placeholder="Enter nickname..."
              style={{ width: '100%', padding: '10px 12px', backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-color)', fontSize: '14px', outline: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              {nicknames[selectedUser] && (
                <button onClick={async () => {
                  const res = await fetch(`/api/users/${user.username}/nicknames/${selectedUser}`, { method: 'DELETE' });
                  if (res.ok) {
                    const data = await res.json();
                    const map = {};
                    (data || []).forEach(n => { map[n.partner] = n.nickname; });
                    setNicknames(map);
                    setShowNicknameModal(false);
                  }
                }}
                  style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-color)', cursor: 'pointer' }}>
                  Remove
                </button>
              )}
              <button onClick={() => setShowNicknameModal(false)}
                style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-color)', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={async () => {
                const res = await fetch(`/api/users/${user.username}/nicknames`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ partner: selectedUser, nickname: nicknameInput })
                });
                if (res.ok) {
                  const data = await res.json();
                  const map = {};
                  (data || []).forEach(n => { map[n.partner] = n.nickname; });
                  setNicknames(map);
                  setShowNicknameModal(false);
                }
              }}
                style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: 'none', background: "var(--text-color)", color: 'var(--active-text)', cursor: 'pointer' }}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
