import React, { useRef } from 'react';

export default function ImageUpload({ onImage }) {
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB.');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        if (reader.result) {
          onImage(reader.result);
        }
      } catch (err) {
        console.error('Image read error:', err);
      }
    };

    reader.onerror = () => {
      console.error('FileReader error:', reader.error);
      alert('Failed to read image. Please try another file.');
    };

    reader.readAsDataURL(file);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        style={{ display: 'none' }}
        id="voya-image-upload"
      />
      <button
        onClick={() => fileRef.current?.click()}
        title="Upload an image"
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.06)',
          background: 'none',
          color: 'var(--ivory-faint, #8A8070)',
          fontSize: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          flexShrink: 0,
        }}
        onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(201,165,90,0.25)'; e.currentTarget.style.color = '#C9A55A'; }}
        onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#8A8070'; }}
      >
        📷
      </button>
    </>
  );
}
