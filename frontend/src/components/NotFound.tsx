import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <img
        src="/logo1.png"
        alt="Asian Crossroads Logo"
        className="w-24 h-24 mb-8"
      />
      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-lg text-gray-600 mb-8">Page not found</p>
      <Link
        to="/"
        className="px-6 py-3 bg-[#2563EB] text-white rounded-[3px] text-sm font-medium hover:bg-[#1d4ed8] transition-colors"
      >
        Go back home
      </Link>
    </div>
  );
}; 