import React, { useState } from 'react';
import { useStore } from '../store/useStore';

const images = [
  '/image1.png',
  '/image2.png',
  '/image3.png',
];

export default function InfoSticker() {
  const showInfoSticker = useStore((state) => state.showInfoSticker);
  const setShowInfoSticker = useStore((state) => state.setShowInfoSticker);
  const [current, setCurrent] = useState(0);

  if (!showInfoSticker) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowInfoSticker(false);
    }
  };

  const goLeft = (e) => {
    e.stopPropagation();
    setCurrent((prev) => Math.max(prev - 1, 0));
  };
  const goRight = (e) => {
    e.stopPropagation();
    setCurrent((prev) => Math.min(prev + 1, images.length - 1));
  };

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '24px',
          boxShadow: '0 4px 32px rgba(0,0,0,0.2)',
          padding: '1vw',
          maxWidth: '80vw',
          maxHeight: '90vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Left Arrow */}
        <button
          onClick={goLeft}
          disabled={current === 0}
          style={{
            position: 'absolute',
            left: 24,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 36,
            background: 'rgba(0,0,0,0.1)',
            border: 'none',
            borderRadius: '50%',
            width: 56,
            height: 56,
            aspectRatio: '1/1',
            cursor: current === 0 ? 'not-allowed' : 'pointer',
            opacity: current === 0 ? 0.4 : 1,
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
            padding: 0,
          }}
        >
          &#8592;
        </button>
        {/* Image */}
        <img
          src={images[current]}
          alt={`Info ${current + 1}`}
          style={{
            maxWidth: '100%',
            maxHeight: '80vh',
            borderRadius: '16px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.1)',
            margin: '0 48px',
            display: 'block',
          }}
        />
        {/* Right Arrow */}
        <button
          onClick={goRight}
          disabled={current === images.length - 1}
          style={{
            position: 'absolute',
            right: 24,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 36,
            background: 'rgba(0,0,0,0.1)',
            border: 'none',
            borderRadius: '50%',
            width: 56,
            height: 56,
            aspectRatio: '1/1',
            cursor: current === images.length - 1 ? 'not-allowed' : 'pointer',
            opacity: current === images.length - 1 ? 0.4 : 1,
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
            padding: 0,
          }}
        >
          &#8594;
        </button>
      </div>
    </div>
  );
} 