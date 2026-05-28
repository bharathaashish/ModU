import { useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Image, Type as TypeIcon, Smile, Send } from 'lucide-react';

const EMOJIS = ['😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','🥰','😘','😜','🤪','😝','🤑','🤗','🤭','🤔','🤐','😐','😑','😶','😏','😒','🙄','😬','😮','😯','😲','😳','🥺','😢','😭','😤','😡','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾','💖','💗','💔','❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💕','💞','💓','💝','✨','🌟','⭐','🔥','💯','🎉','🎊','🎈','🎁','🏆','💪','🤝','🙏','👋','🤚','✋','👌','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝'];

const STICKERS = ['🔥','✨','❤️','💯','⭐','🎉','💪','🚀','🌈','👑','💎','🦋','🌸','🌺','🍀','🌊','☀️','🌙','⚡','🕊️'];

export default function StoryCreator({ isOpen, onClose, onPostSuccess }) {
  const { user } = useAuth();
  const [media, setMedia] = useState(null);
  const [preview, setPreview] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [overlays, setOverlays] = useState([]);
  const [overlayType, setOverlayType] = useState(null);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
        setMedia(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const addOverlay = (emoji) => {
    setOverlays(prev => [...prev, {
      id: Date.now(),
      type: 'emoji',
      content: emoji,
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 60,
      size: 36,
      rotation: 0
    }]);
  };

  const addSticker = (sticker) => {
    setOverlays(prev => [...prev, {
      id: Date.now(),
      type: 'sticker',
      content: sticker,
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 60,
      size: 40,
      rotation: 0
    }]);
  };

  const addTextOverlay = () => {
    setOverlays(prev => [...prev, {
      id: Date.now(),
      type: 'text',
      content: 'Your text',
      x: 10,
      y: 50,
      size: 24,
      color: '#ffffff',
      rotation: 0
    }]);
  };

  const removeOverlay = (id) => {
    setOverlays(prev => prev.filter(o => o.id !== id));
  };

  const updateOverlay = (id, updates) => {
    setOverlays(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const handleSend = async () => {
    if (!media || !user) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: user.username, media, caption })
      });
      if (res.ok) {
        setMedia(null);
        setPreview('');
        setCaption('');
        setOverlays([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onPostSuccess?.();
        onClose();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = useCallback((e, overlayId) => {
    const startX = e.clientX;
    const startY = e.clientY;
    const overlay = overlays.find(o => o.id === overlayId);
    if (!overlay) return;
    const startOverlayX = overlay.x;
    const startOverlayY = overlay.y;

    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      updateOverlay(overlayId, { x: startOverlayX + dx, y: startOverlayY + dy });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [overlays]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: '#000',
      display: 'flex', flexDirection: 'column',
      zIndex: 1000
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px', flexShrink: 0
      }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}>
          <X size={24} />
        </button>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: '16px' }}>New Story</span>
        <button
          onClick={handleSend}
          disabled={!media || loading}
          style={{
            padding: '8px 20px',
            backgroundColor: loading || !media ? 'rgba(255,255,255,0.2)' : '#4f6ef7',
            border: 'none', borderRadius: '8px', color: '#fff',
            fontWeight: 600, fontSize: '14px',
            cursor: loading || !media ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'all 0.2s'
          }}
        >
          <Send size={16} />
          {loading ? 'Posting...' : 'Share'}
        </button>
      </div>

      {/* Editor Area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {!preview ? (
          <div style={{ textAlign: 'center', color: '#888' }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '120px', height: '120px', borderRadius: '50%',
                border: '2px dashed #555', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                cursor: 'pointer', transition: 'border-color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#4f6ef7'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#555'}
            >
              <Image size={40} />
            </div>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Choose a photo</div>
            <div style={{ fontSize: '13px' }}>PNG, JPG, GIF</div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
          </div>
        ) : (
          <div style={{ position: 'relative', width: '100%', maxWidth: '400px', margin: '0 auto' }} ref={canvasRef}>
            <img src={preview} alt="" style={{ width: '100%', display: 'block', borderRadius: '8px', maxHeight: '70vh', objectFit: 'contain' }} />
            {overlays.map(overlay => (
              <div
                key={overlay.id}
                onMouseDown={(e) => handleDragStart(e, overlay.id)}
                onDoubleClick={() => removeOverlay(overlay.id)}
                style={{
                  position: 'absolute',
                  left: `${overlay.x}%`, top: `${overlay.y}%`,
                  transform: `translate(-50%, -50%) rotate(${overlay.rotation}deg)`,
                  fontSize: overlay.type === 'emoji' ? `${overlay.size}px` : overlay.type === 'sticker' ? `${overlay.size}px` : `${overlay.size}px`,
                  color: overlay.color || '#fff',
                  cursor: 'grab', userSelect: 'none',
                  textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                  fontWeight: overlay.type === 'text' ? 700 : 'normal',
                  fontFamily: overlay.type === 'text' ? 'Inter, sans-serif' : 'inherit',
                  whiteSpace: 'nowrap',
                  transition: 'font-size 0.2s'
                }}
              >
                {overlay.content}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tools Bar */}
      {preview && (
        <div style={{
          padding: '12px 16px', display: 'flex', gap: '16px', justifyContent: 'center',
          borderTop: '1px solid rgba(255,255,255,0.1)', flexShrink: 0
        }}>
          <button onClick={() => { setShowEmoji(!showEmoji); setShowStickers(false); }}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '11px', opacity: showEmoji ? 1 : 0.6, transition: 'opacity 0.2s' }}>
            <Smile size={22} /> Emoji
          </button>
          <button onClick={() => { setShowStickers(!showStickers); setShowEmoji(false); }}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '11px', opacity: showStickers ? 1 : 0.6, transition: 'opacity 0.2s' }}>
            <span style={{ fontSize: '22px' }}>✨</span> Stickers
          </button>
          <button onClick={addTextOverlay}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '11px', opacity: 0.6, transition: 'opacity 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}>
            <TypeIcon size={22} /> Text
          </button>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmoji && (
        <div style={{
          padding: '12px 16px', maxHeight: '180px', overflowY: 'auto',
          borderTop: '1px solid rgba(255,255,255,0.1)', flexShrink: 0
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {EMOJIS.map((emoji, i) => (
              <button key={i} onClick={() => { addOverlay(emoji); }}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', padding: '4px', borderRadius: '6px', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stickers Picker */}
      {showStickers && (
        <div style={{
          padding: '12px 16px', maxHeight: '180px', overflowY: 'auto',
          borderTop: '1px solid rgba(255,255,255,0.1)', flexShrink: 0
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {STICKERS.map((sticker, i) => (
              <button key={i} onClick={() => { addSticker(sticker); }}
                style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', padding: '4px', borderRadius: '6px', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                {sticker}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <div style={{ padding: '12px 16px', color: '#ef4444', fontSize: '13px', textAlign: 'center', flexShrink: 0 }}>{error}</div>}
    </div>
  );
}
