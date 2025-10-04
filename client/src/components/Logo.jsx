import React from 'react';

const Logo = ({ size = 'w-16 h-16', className = '' }) => {
  return (
    <img 
      src="/logo.svg" 
      alt="ExpenseTracker Logo" 
      className={`${size} ${className}`}
      style={{ objectFit: 'contain' }}
    />
  );
};

export default Logo;
