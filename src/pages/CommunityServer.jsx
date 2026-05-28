import { useAuth } from '../context/AuthContext';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { ArrowLeft, Send, Plus, X, Hash, Users, Settings, Link, LogOut, Shield, ChevronRight, Copy, Check, UserPlus, Image } from 'lucide-react';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

const ROLE_COLORS = { owner: '#f5a623', admin: '#e74c3c', moderator: '#2ecc71', member: 'var(--text-secondary)' };
const ROLE_BADGES = { owner: '👑', admin: '🛡️', moderator: '⚡', member: '' };

export default function CommunityServer() {
  const { communityId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [community, setCommunity] = useState(null);
  const [activeChannel, setActiveChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [channelName, setChannelName] = useState('');
  const [channelDesc, setChannelDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  // Channel messages
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [messageImage, setMessageImage] = useState(null);
  const [messagePreview, setMessagePreview] = useState('');
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const currentMember = community?.members?.find(m => m.username === user?.username);
  const userRole = currentMember?.role || null;
  const canManage = ['owner', 'admin'].includes(userRole);
  const canModerate = ['owner', 'admin', 'moderator'].includes(userRole);
  const isMember = !!currentMember;

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const load = useCallback(async () => {
    try {
      const communityRes = await fetch(`/api/community/${communityId}`);
      if (communityRes.ok) {
        const c = await communityRes.json();
        setCommunity(c);
        if (c.channels?.length > 0 && !activeChannel) setActiveChannel(c.channels[0].name);
      }
    } catch {}
    setLoading(false);
  }, [communityId, activeChannel]);

  useEffect(() => { load(); }, [communityId]);

  // Fetch messages when channel changes
  useEffect(() => {
    if (!communityId || !activeChannel) return;
    (async () => {
      try {
        const res = await fetch(`/api/channel-messages/${communityId}/${encodeURIComponent(activeChannel)}`);
        if (res.ok) setMessages(await res.json());
      } catch {}
    })();
  }, [communityId, activeChannel]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleCreateChannel = async () => {
    if (!channelName.trim() || !user) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/community/${communityId}/channel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: channelName.trim(), description: channelDesc.trim() })
      });
      if (res.ok) {
        const updated = await res.json();
        setCommunity(updated);
        setActiveChannel(channelName.trim());
        setShowCreateChannel(false);
        setChannelName('');
        setChannelDesc('');
      }
    } catch {}
    setCreating(false);
  };

  const handleJoin = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/community/${communityId}/join`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
      });
      if (res.ok) { const updated = await res.json(); setCommunity(updated); }
    } catch {}
  };

  const handleLeave = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/community/${communityId}/leave`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
      });
      if (res.ok) { const updated = await res.json(); setCommunity(updated); }
    } catch {}
  };

  const handleGenerateInvite = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/community/${communityId}/invite`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
      });
      if (res.ok) { const data = await res.json(); setInviteLink(`${window.location.origin}/community/join/${data.code}`); }
    } catch {}
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChangeRole = async (targetUsername, newRole) => {
    if (!user || !canManage) return;
    try {
      await fetch(`/api/community/${communityId}/member/${targetUsername}/role`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, role: newRole })
      });
    } catch {}
    load();
  };

  const handleKickMember = async (targetUsername) => {
    if (!user || !canManage) return;
    try {
      const res = await fetch(`/api/community/${communityId}/member/${targetUsername}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
      });
      if (res.ok) {
        const updated = await res.json();
        setCommunity(updated);
      }
    } catch {}
    load();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => { setMessagePreview(e.target.result); setMessageImage(e.target.result); };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!messageText.trim() && !messageImage) || !user || !activeChannel) return;
    setSending(true);
    try {
      const res = await fetch(`/api/channel-messages/${communityId}/${encodeURIComponent(activeChannel)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderUsername: user.username, message: messageText.trim(), image: messageImage })
      });
      if (res.ok) {
        const newMsg = await res.json();
        setMessages(prev => [...prev, newMsg]);
        setMessageText('');
        setMessageImage(null);
        setMessagePreview('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch {}
    setSending(false);
  };

  const keyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading community...</div>;
  }

  if (!community) {
    return <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Community not found.</div>;
  }

  // Private community lock screen
  if (community.isPrivate && !isMember) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div className="page-header-left">
            <button onClick={() => navigate('/hubs')} style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer', display: 'flex', padding: '4px' }}>
              <ArrowLeft size={22} />
            </button>
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <Shield size={48} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
          <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-color)' }}>{community.name}</div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>This is a private community. You need an invite to join.</div>
          <button className="btn-primary" onClick={() => navigate('/hubs')}>Back to Hubs</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cs-layout">
      {/* Mobile sidebar toggle */}
      <div className="cs-mobile-top">
        <button onClick={() => setShowSidebar(!showSidebar)} style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer', padding: '8px' }}>
          <Hash size={20} />
        </button>
        <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-color)' }}>#{activeChannel}</span>
        <button onClick={() => navigate('/hubs')} style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer', padding: '8px' }}>
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="cs-body">
        {/* Channel Sidebar */}
        <div className={`cs-sidebar ${showSidebar ? 'cs-sidebar-open' : ''}`}>
          <div className="cs-sidebar-header">
            <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-color)' }}>{community.name}</span>
          </div>
          <div style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Channels
          </div>
          <div className="cs-channel-list">
            {community.channels?.map(ch => (
              <div
                key={ch.name}
                className={`cs-channel ${activeChannel === ch.name ? 'cs-channel-active' : ''}`}
                onClick={() => { setActiveChannel(ch.name); setShowSidebar(false); }}
              >
                <Hash size={16} />
                <span>{ch.name}</span>
              </div>
            ))}
            {canManage && (
              <div className="cs-channel cs-channel-add" onClick={() => setShowCreateChannel(true)}>
                <Plus size={16} />
                <span>Add Channel</span>
              </div>
            )}
          </div>

          {isMember && (
            <div style={{ marginTop: 'auto', padding: '12px', borderTop: '1px solid var(--border-color)' }}>
              {canModerate && (
                <div className="cs-sidebar-action" onClick={handleGenerateInvite}>
                  <Link size={16} />
                  <span>Get Invite Link</span>
                </div>
              )}
              <div className="cs-sidebar-action" onClick={() => setShowMembers(true)}>
                <Users size={16} />
                <span>Members ({community.memberCount})</span>
              </div>
              <div className="cs-sidebar-action" onClick={handleLeave}>
                <LogOut size={16} />
                <span>Leave</span>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="cs-main">
          {/* Channel header */}
          <div className="cs-channel-header">
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Hash size={20} /> {activeChannel}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {community.channels?.find(c => c.name === activeChannel)?.description || ''}
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="cs-posts" style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
            {!activeChannel ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
                Select a channel to start chatting
              </div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
                <Hash size={36} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-color)' }}>
                  {isMember ? `No messages in #${activeChannel} yet` : 'Join to start chatting'}
                </div>
                <div style={{ fontSize: '13px' }}>
                  {isMember ? 'Say something!' : 'Become a member to participate.'}
                </div>
                {!isMember && (
                  <button className="btn-primary" style={{ marginTop: '16px' }} onClick={handleJoin}>
                    <UserPlus size={16} />
                    <span>Join Community</span>
                  </button>
                )}
              </div>
            ) : (
              <>
                {messages.map((m, i) => (
                  <div key={m._id || i} style={{ display: 'flex', gap: '10px', marginBottom: '14px', alignItems: 'flex-start' }}>
                    <Avatar username={m.senderUsername} size={34} onClick={() => navigate(`/profile/${m.senderUsername}`)} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-color)', cursor: 'pointer' }}
                          onClick={() => navigate(`/profile/${m.senderUsername}`)}>{m.senderUsername}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{timeAgo(m.createdAt)}</span>
                      </div>
                      {m.message && <div style={{ fontSize: '14px', color: 'var(--text-color)', lineHeight: 1.4 }}>{m.message}</div>}
                      {m.image && (
                        <div style={{ marginTop: '6px', borderRadius: '8px', overflow: 'hidden', maxWidth: '320px', backgroundColor: 'var(--border-color)' }}>
                          <img src={m.image} alt="" style={{ width: '100%', display: 'block' }} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Chat Input Bar */}
          {isMember && activeChannel && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
              {messagePreview && (
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: '8px' }}>
                  <img src={messagePreview} alt="" style={{ height: '60px', borderRadius: '6px' }} />
                  <button onClick={() => { setMessagePreview(''); setMessageImage(null); }} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.7)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                    <X size={12} />
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <button onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px', flexShrink: 0 }}>
                  <Image size={20} />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                <textarea
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  onKeyDown={keyPress}
                  placeholder={`Message #${activeChannel}`}
                  rows={1}
                  style={{
                    flex: 1, minHeight: '40px', maxHeight: '100px', padding: '10px 14px',
                    borderRadius: '20px', border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--card-bg)', color: 'var(--text-color)',
                    resize: 'none', outline: 'none', fontSize: '14px', fontFamily: 'inherit', lineHeight: 1.4
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || (!messageText.trim() && !messageImage)}
                  style={{
                    width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                    backgroundColor: sending || (!messageText.trim() && !messageImage) ? 'var(--border-color)' : 'var(--primary-color)',
                    border: 'none', color: 'white', cursor: sending || (!messageText.trim() && !messageImage) ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Non-member prompt */}
          {!isMember && activeChannel && messages.length > 0 && (
            <div style={{ textAlign: 'center', padding: '16px', borderTop: '1px solid var(--border-color)' }}>
              <button className="btn-primary" onClick={handleJoin}>
                <UserPlus size={16} />
                <span>Join Community to Chat</span>
              </button>
            </div>
          )}
        </div>

        {/* Member sidebar */}
        {showMembers && (
          <div className="cs-members">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '12px 16px 0' }}>
              <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-color)' }}>Members ({community.memberCount})</span>
              <button onClick={() => setShowMembers(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ padding: '0 16px' }}>
              {community.members?.map(m => (
                <div key={m.username} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', cursor: 'pointer' }} onClick={() => navigate(`/profile/${m.username}`)}>
                  <Avatar username={m.username} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {m.username}
                      {ROLE_BADGES[m.role] && <span style={{ fontSize: '12px' }}>{ROLE_BADGES[m.role]}</span>}
                    </div>
                    <div style={{ fontSize: '11px', color: ROLE_COLORS[m.role] || 'var(--text-secondary)' }}>
                      {m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                    </div>
                  </div>
                  {canManage && m.username !== user?.username && m.role !== 'owner' && (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <select value={m.role} onChange={e => handleChangeRole(m.username, e.target.value)}
                        onClick={e => e.stopPropagation()}
                        style={{ fontSize: '11px', padding: '2px 4px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-color)', cursor: 'pointer' }}>
                        <option value="member">Member</option>
                        <option value="moderator">Mod</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={e => { e.stopPropagation(); handleKickMember(m.username); }}
                        style={{ fontSize: '11px', padding: '6px 10px', background: 'transparent', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', cursor: 'pointer' }}>
                        Kick
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Channel Modal */}
      {showCreateChannel && (
        <div className="modal-overlay" onClick={() => setShowCreateChannel(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div className="modal-title" style={{ margin: 0 }}>Create Channel</div>
              <button onClick={() => setShowCreateChannel(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <input className="form-input" placeholder="Channel name" value={channelName} onChange={e => setChannelName(e.target.value)} autoFocus />
            <input className="form-input" placeholder="Description (optional)" value={channelDesc} onChange={e => setChannelDesc(e.target.value)} />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCreateChannel(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreateChannel} disabled={!channelName.trim() || creating}>{creating ? 'Creating...' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Link Modal */}
      {inviteLink && (
        <div className="modal-overlay" onClick={() => setInviteLink('')}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div className="modal-title" style={{ margin: 0 }}>Invite Link</div>
              <button onClick={() => setInviteLink('')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '12px', backgroundColor: 'var(--bg-color)', borderRadius: '8px', marginBottom: '16px' }}>
              <span style={{ flex: 1, fontSize: '13px', color: 'var(--text-color)', wordBreak: 'break-all' }}>{inviteLink}</span>
              <button onClick={handleCopyInvite} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', flexShrink: 0 }}>
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
            <button className="btn-primary" style={{ width: '100%' }} onClick={() => setInviteLink('')}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
