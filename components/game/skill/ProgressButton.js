import React from 'react';

const ProgressButton = ({ id, x, y, width, height, progress, backgroundColor, progressColor }) => {
  const isActive = progress > 0;

  const buttonStyle = {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    width: `${width}px`,
    height: `${height}px`,
    backgroundColor: backgroundColor || 'rgba(0, 0, 255, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '20px',
    overflow: 'hidden',
    borderRadius: '10px',
    boxShadow: isActive ? '0 0 10px 5px rgba(255, 255, 255, 0.5)' : 'none',
    transform: isActive ? 'scale(1.05)' : 'scale(1)',
    transition: 'all 0.3s ease',
  };

  const progressStyle = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: `${progress * 100}%`,
    height: '100%',
    backgroundColor: progressColor || 'rgba(249, 11, 134, 0.8)',
    transition: 'width 0.1s',
  };

  const textStyle = {
    position: 'relative',
    zIndex: 1,
    textShadow: isActive ? '0 0 5px #fff' : 'none',
  };

  return (
    <div style={buttonStyle}>
      <div style={progressStyle} />
      <span className="skill-button" style={textStyle}>{id}</span>
      {isActive && (
        <div style={{
          position: 'absolute',
          top: '-20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          color: '#000',
          padding: '2px 6px',
          borderRadius: '5px',
          fontSize: '14px',
        }}>
          Activating...
        </div>
      )}
    </div>
  );
};

export default ProgressButton;