import React from 'react';
import Logo from './Logo';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Logo size="small" />
          </div>
          <div className="text-sm text-gray-500">
            © 2024 SupaWave. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;