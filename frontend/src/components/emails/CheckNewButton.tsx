import React from 'react';
import { FiRefreshCw } from 'react-icons/fi';

interface CheckNewButtonProps {
  onCheck: () => void;
  refreshing: boolean;
}

export const CheckNewButton: React.FC<CheckNewButtonProps> = ({ onCheck, refreshing }) => {
  return (
    <div className="h-16 flex items-center justify-center bg-gray-50 border-b border-gray-200">
      <button
        onClick={onCheck}
        disabled={refreshing}
        className="w-full h-16 flex items-center justify-center gap-2 text-sm font-medium text-gray-600 disabled:opacity-70 disabled:cursor-not-allowed bg-white hover:bg-gray-100 transition-all"
      >
        <div className={`${refreshing ? 'animate-spin' : ''}`}>
          <FiRefreshCw className="w-4 h-4" />
        </div>
        <span>Check New</span>
      </button>
    </div>
  );
}; 