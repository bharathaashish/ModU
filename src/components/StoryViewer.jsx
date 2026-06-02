import { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

const IMAGE_DURATION = 5000;
const TICK_INTERVAL = 50;

export default function StoryViewer({ stories, initialIndex = 0, onClose }) {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [paused, setPaused] = useState(false);
  const [viewedSet, setViewedSet] = useState(new Set());
  const progressRef = useRef(0);
  const intervalRef = useRef(null);
  const videoRef = useRef(null);
  const pauseTimeoutRef = useRef(null);
  const navigatingRef = useRef(false);
  const holdPausedRef = useRef(false);

  const currentStory = stories[currentIndex];
  const hasMultiple = stories.length > 1;

  const trackView = useCallback((story) => {
    if (!story || !user || viewedSet.has(story._id)) return;
    setViewedSet(prev => new Set([...prev, story._id]));
    fetch(`/api/stories/${story._id}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.username })
    }).catch(() => {});
  }, [user, viewedSet]);

  const advance = useCallback(() => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    trackView(currentStory);
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
    setTimeout(() => { navigatingRef.current = false; }, 100);
  }, [currentIndex, stories.length, onClose, trackView, currentStory]);

  const retreat = useCallback(() => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
    setTimeout(() => { navigatingRef.current = false; }, 100);
  }, [currentIndex]);

  // Reset progress on story change
  useEffect(() => {
    progressRef.current = 0;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }, [currentIndex]);

  // Progress interval for image stories
  useEffect(() => {
    if (!currentStory || paused) return;
    if (currentStory.mediaType === 'video') return;

    intervalRef.current = setInterval(() => {
      progressRef.current += (TICK_INTERVAL / IMAGE_DURATION) * 100;
      forceUpdate();

      if (progressRef.current >= 100) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        progressRef.current = 0;
        advance();
      }
    }, TICK_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [currentStory, paused, advance]);

  // Force re-render for progress bar updates
  const [, setTick] = useState(0);
  const forceUpdate = useCallback(() => setTick(t => t + 1), []);

  // Audio context for silent playback (iOS requires user gesture)
  useEffect(() => {
    if (currentStory?.mediaType === 'video' && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [currentIndex]);

  // Video progress tracking
  const handleTimeUpdate = () => {
    if (!videoRef.current || !currentStory || currentStory.mediaType !== 'video') return;
    const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    progressRef.current = progress;
    forceUpdate();
  };

  const handleVideoEnded = () => {
    trackView(currentStory);
    advance();
  };

  // Tap handling
  const handleTap = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const third = rect.width / 3;

    if (x < third) {
      retreat();
    } else if (x > rect.width - third) {
      advance();
    } else {
      setPaused(prev => !prev);
    }
  };

  const handleMouseDown = () => {
    holdPausedRef.current = true;
    setPaused(true);
    clearTimeout(pauseTimeoutRef.current);
    if (videoRef.current) videoRef.current.pause();
  };

  const handleMouseUp = () => {
    holdPausedRef.current = false;
    pauseTimeoutRef.current = setTimeout(() => {
      if (!holdPausedRef.current) {
        setPaused(false);
        if (videoRef.current && currentStory?.mediaType === 'video') {
          videoRef.current.play().catch(() => {});
        }
      }
    }, 300);
  };

  useEffect(() => {
    return () => clearTimeout(pauseTimeoutRef.current);
  }, []);

  // Track view after 1 second of display
  useEffect(() => {
    if (!currentStory || !user || paused) return;
    const timer = setTimeout(() => trackView(currentStory), 1000);
    return () => clearTimeout(timer);
  }, [currentIndex, paused, trackView, currentStory, user]);

  if (!currentStory) return null;

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getProgressWidth = (i) => {
    if (i < currentIndex) return '100%';
    if (i === currentIndex) return `${progressRef.current}%`;
    return '0%';
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      backgroundColor: '#000',
      display: 'flex', flexDirection: 'column',
      userSelect: 'none'
    }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Progress bars */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        display: 'flex', gap: '4px', padding: hasMultiple ? '8px 8px 0' : '4px 8px 0',
        zIndex: 10
      }}>
        {stories.map((story, i) => (
          <div key={story._id} style={{
            flex: 1, height: '3px', borderRadius: '2px',
            backgroundColor: 'rgba(255,255,255,0.3)',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%', borderRadius: '2px',
              backgroundColor: '#fff',
              width: getProgressWidth(i),
              transition: i === currentIndex && currentStory?.mediaType !== 'video' ? 'none' : 'none'
            }} />
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{
        position: 'absolute', top: hasMultiple ? '18px' : '14px', left: 0, right: 0,
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '0 12px',
        zIndex: 10,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 100%)'
      }}>
        <Avatar username={currentStory.author} image={currentStory.profilePhoto} size={32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600, lineHeight: 1.2 }}>
            {currentStory.author}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', lineHeight: 1.2 }}>
            {timeAgo(currentStory.createdAt)}
          </div>
        </div>
        <button onClick={onClose}
          style={{
            background: 'none', border: 'none', color: '#fff', cursor: 'pointer',
            padding: '4px', display: 'flex', opacity: 0.8
          }}>
          <X size={22} />
        </button>
      </div>

      {/* Media + tap zones */}
      <div
        onClick={handleTap}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', cursor: 'pointer'
        }}
      >
        {currentStory.mediaType === 'video' ? (
          <video
            ref={videoRef}
            src={currentStory.media}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnded}
            onLoadedMetadata={() => {
              if (videoRef.current) videoRef.current.play().catch(() => {});
            }}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            playsInline
          />
        ) : (
          <img
            src={currentStory.media}
            alt=""
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            draggable={false}
          />
        )}

        {paused && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '48px', height: '48px', borderRadius: '50%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="18" height="22" viewBox="0 0 18 22" fill="none">
              <rect x="1" y="1" width="5" height="20" rx="1" fill="white" />
              <rect x="12" y="1" width="5" height="20" rx="1" fill="white" />
            </svg>
          </div>
        )}
      </div>

      {currentStory.caption && (
        <div style={{
          position: 'absolute', bottom: '40px', left: 0, right: 0,
          textAlign: 'center', padding: '12px 20px', zIndex: 10,
          color: 'rgba(255,255,255,0.9)', fontSize: '14px'
        }}>
          {currentStory.caption}
        </div>
      )}
    </div>
  );
}
