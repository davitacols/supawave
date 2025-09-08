import React from 'react';

const Logo = ({ size = "large", className = "" }) => {
  const isLarge = size === "large";
  
  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex flex-col items-center">
        <div className={`font-black tracking-tight text-center ${
          isLarge ? 'text-4xl' : 'text-2xl'
        }`}>
          <span className="text-blue-600 font-extrabold">S</span>
          <span className="text-blue-600 font-extrabold italic">u</span>
          <span className="text-blue-600 font-extrabold">p</span>
          <span className="text-blue-600 font-extrabold italic">a</span>
          <span className="text-blue-600 font-black uppercase">W</span>
          <span className="text-blue-600 font-extrabold italic">a</span>
          <span className="text-blue-600 font-extrabold">v</span>
          <span className="text-blue-600 font-extrabold italic">e</span>
        </div>
        {isLarge && (
          <div className="text-sm text-gray-500 font-medium tracking-wider uppercase mt-2">
            Inventory Management
          </div>
        )}
      </div>
    </div>
  );
};

export default Logo;