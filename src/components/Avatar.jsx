function getAccent() {
  return 'var(--primary-color)';
}

export default function Avatar({ username, size = 32, image, style = {}, onClick }) {
  const accent = getAccent();
  const fontSize = Math.max(size * 0.42, 10);
  const { borderRadius: _ignored, ...restStyle } = style;
  const circleStyle = { width: size, height: size, borderRadius: '50%', flexShrink: 0 };

  if (image) {
    return (
      <div
        onClick={onClick}
        style={{
          ...circleStyle,
          backgroundImage: `url(${image})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          cursor: onClick ? 'pointer' : undefined,
          ...restStyle
        }}
      />
    );
  }

  return (
    <div
      onClick={onClick}
      style={{
        ...circleStyle,
        backgroundColor: accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 600, fontSize,
        cursor: onClick ? 'pointer' : undefined,
        ...restStyle
      }}
    >
      {(username || '?')[0].toUpperCase()}
    </div>
  );
}
