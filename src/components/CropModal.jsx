import { useState, useRef, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, Check, X } from 'lucide-react';

export default function CropModal({ image, onSave, onClose }) {
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState(280);
  const [naturalImg, setNaturalImg] = useState(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setNaturalImg(img);
      const size = Math.min(img.naturalWidth, img.naturalHeight, 400);
      setContainerSize(Math.max(240, size));
    };
    img.src = image;
  }, [image]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const maxW = Math.min(window.innerWidth - 48, 400);
        setContainerSize(Math.max(240, maxW));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = useCallback((e) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  }, [offset]);

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [dragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.5, Math.min(5, prev + delta)));
  }, []);

  const extractCrop = useCallback(() => {
    if (!naturalImg || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const size = containerSize;
    canvas.width = 400;
    canvas.height = 400;

    const displaySize = size;
    const imgDisplayW = naturalImg.naturalWidth * zoom;
    const imgDisplayH = naturalImg.naturalHeight * zoom;
    const cropCenterX = displaySize / 2 - offset.x;
    const cropCenterY = displaySize / 2 - offset.y;
    const ratio = 400 / displaySize;

    const sx = (cropCenterX - displaySize / 2) / zoom;
    const sy = (cropCenterY - displaySize / 2) / zoom;
    const sw = displaySize / zoom;
    const sh = displaySize / zoom;

    ctx.drawImage(
      naturalImg,
      Math.max(0, sx), Math.max(0, sy),
      Math.min(sw, naturalImg.naturalWidth - Math.max(0, sx)),
      Math.min(sh, naturalImg.naturalHeight - Math.max(0, sy)),
      0, 0, 400, 400
    );
    onSave(canvas.toDataURL('image/jpeg', 0.92));
  }, [naturalImg, zoom, offset, containerSize, onSave]);

  const imgDisplayW = naturalImg ? naturalImg.naturalWidth * zoom : containerSize;
  const imgDisplayH = naturalImg ? naturalImg.naturalHeight * zoom : containerSize;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.7)'
    }}>
      <div style={{
        backgroundColor: 'var(--card-bg)', borderRadius: '16px',
        width: '90%', maxWidth: '420px', overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border-color)' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
          <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-color)' }}>Crop Photo</span>
          <button onClick={extractCrop}
            style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', padding: '4px', fontWeight: 600, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Check size={18} /> Save
          </button>
        </div>

        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          {/* Crop area */}
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{
              width: containerSize, height: containerSize, borderRadius: '50%',
              overflow: 'hidden', position: 'relative', cursor: dragging ? 'grabbing' : 'grab',
              boxShadow: '0 0 0 3px var(--primary-color)',
              backgroundColor: '#000', userSelect: 'none', touchAction: 'none'
            }}
          >
            {naturalImg && (
              <img
                ref={imageRef}
                src={image} alt=""
                draggable={false}
                style={{
                  position: 'absolute',
                  left: `calc(50% - ${imgDisplayW / 2}px + ${offset.x}px)`,
                  top: `calc(50% - ${imgDisplayH / 2}px + ${offset.y}px)`,
                  width: imgDisplayW, height: imgDisplayH,
                  pointerEvents: 'none'
                }}
              />
            )}
          </div>

          {/* Preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden',
              border: '2px solid var(--border-color)', flexShrink: 0,
              backgroundImage: `url(${image})`,
              backgroundSize: `${zoom * 100}%`,
              backgroundPosition: `${50 - (offset.x / (containerSize / 2)) * 50}% ${50 - (offset.y / (containerSize / 2)) * 50}%`,
              backgroundColor: '#000'
            }} />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Preview</span>
          </div>

          {/* Zoom slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', maxWidth: '300px' }}>
            <ZoomOut size={18} color="var(--text-secondary)" />
            <input
              type="range"
              min="0.5" max="5" step="0.01"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--primary-color)' }}
            />
            <ZoomIn size={18} color="var(--text-secondary)" />
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
            Drag to reposition · Scroll or use slider to zoom
          </div>
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
}
