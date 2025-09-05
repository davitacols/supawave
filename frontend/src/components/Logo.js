import React from 'react';

const Logo = ({ size = 32, className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Cart body */}
      <path
        d="M6 4h2l1.68 8.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L25 6H10"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Cart wheels */}
      <circle cx="12" cy="26" r="2" fill="currentColor" />
      <circle cx="22" cy="26" r="2" fill="currentColor" />
      
      {/* Wave elements */}
      <path
        d="M2 8c2-2 4 2 6 0s4 2 6 0 4 2 6 0 4 2 6 0"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      
      <path
        d="M4 16c1.5-1.5 3 1.5 4.5 0s3 1.5 4.5 0 3 1.5 4.5 0 3 1.5 4.5 0"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
};

export default Logo;