import { useAuth } from '../context/AuthContext';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { ArrowLeft, Send, Plus, X, Hash, Image } from 'lucide-react';

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

export default function Community() {
  const { communityId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [community, setCommunity] = useState(null);
  const [hub, setHub] = useState(null);
  const [activeChannel, setActiveChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChannelCreate, setShowChannelCreate] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [channelDesc, setChannelDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [messageImage, setMessageImage] = useState(null);
  const [messagePreview, setMessagePreview] = useState('');
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const load = useCallback(async () => {
    try {
      const hubsRes = await fetch('/api/hubs');
      if (hubsRes.ok) {
        const hubs = await hubsRes.json();
        for (const h of hubs) {
          const commRes = await fetch(`/api/hubs/${h._id}/communities`);
          if (commRes.ok) {
            const communities = await commRes.json();
            const match = communities.find(c => c._id === communityId);
            if (match) {
              setCommunity(match);
              setHub(h);
              if (match.channels?.length > 0 && !activeChannel) setActiveChannel(match.channels[0].name);
              break;
            }
          }
        }
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
        body: JSON.stringify({
          senderUsername: user.username,
          message: messageText.trim(),
          image: messageImage
        })
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
        setShowChannelCreate(false);
        setChannelName('');
        setChannelDesc('');
      }
    } catch {}
    setCreating(false);
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading community...</div>;
  }

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', padding: 0 }}>
      {/* Header */}
      <div className="page-header" style={{ flexShrink: 0 }}>
        <div className="page-header-left">
          <button onClick={() => navigate('/hubs')} style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer', display: 'flex', padding: '4px' }}>
            <ArrowLeft size={22} />
          </button>
          <span className="page-title">{community?.name || 'Community'}</span>
        </div>
      </div>

      {/* Community Info + Channels */}
      {community && (
        <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
              {hub?.icon || '💬'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-color)' }}>{community.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{hub?.name} · {community.memberCount} members</div>
            </div>
          </div>

          {/* Channels Bar */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '4px 0 8px', scrollbarWidth: 'none', alignItems: 'center' }}>
            {community.channels?.map(ch => (
              <button
                key={ch.name}
                onClick={() => setActiveChannel(ch.name)}
                style={{
                  padding: '6px 14px', whiteSpace: 'nowrap', flexShrink: 0,
                  backgroundColor: activeChannel === ch.name ? 'var(--primary-color)' : 'var(--bg-color)',
                  border: `1px solid ${activeChannel === ch.name ? 'var(--primary-color)' : 'var(--border-color)'}`,
                  borderRadius: '16px', color: activeChannel === ch.name ? '#fff' : 'var(--text-color)',
                  fontSize: '12px', fontWeight: activeChannel === ch.name ? 600 : 400,
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                # {ch.name}
              </button>
            ))}
            <button onClick={() => setShowChannelCreate(true)} style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-color)', border: '1px dashed var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Plus size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px', backgroundColor: 'var(--bg-color)' }}>
        {!activeChannel ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Select a channel to start chatting
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            <div style={{ fontSize: '13px', marginBottom: '4px' }}>No messages in #{activeChannel} yet</div>
            <div>Be the first to say something!</div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={m._id || i} style={{ display: 'flex', gap: '10px', marginBottom: '12px', alignItems: 'flex-start' }}>
              <Avatar username={m.senderUsername} size={32} onClick={() => navigate(`/profile/${m.senderUsername}`)} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-color)', cursor: 'pointer' }}
                    onClick={() => navigate(`/profile/${m.senderUsername}`)}>{m.senderUsername}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{timeAgo(m.createdAt)}</span>
                </div>
                {m.message && <div style={{ fontSize: '14px', color: 'var(--text-color)', lineHeight: 1.4 }}>{m.message}</div>}
                {m.image && <div style={{ marginTop: '6px', borderRadius: '8px', overflow: 'hidden', maxWidth: '300px', backgroundColor: 'var(--border-color)' }}>
                  <img src={m.image} alt="" style={{ width: '100%', display: 'block' }} />
                </div>}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      {activeChannel && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', flexShrink: 0 }}>
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

      {/* Create Channel Modal */}
      {showChannelCreate && (
        <div className="modal-overlay" onClick={() => setShowChannelCreate(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div className="modal-title" style={{ margin: 0 }}>Create Channel</div>
              <button onClick={() => setShowChannelCreate(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <input className="form-input" placeholder="Channel name" value={channelName} onChange={e => setChannelName(e.target.value)} autoFocus />
            <input className="form-input" placeholder="Description (optional)" value={channelDesc} onChange={e => setChannelDesc(e.target.value)} />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowChannelCreate(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreateChannel} disabled={!channelName.trim() || creating}>
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
