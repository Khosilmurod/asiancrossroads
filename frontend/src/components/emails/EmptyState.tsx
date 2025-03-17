import React from 'react';
import { FiMail } from 'react-icons/fi';

export const EmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-500">
      <div className="flex flex-col items-center">
        <FiMail className="w-16 h-16 mb-6 text-gray-400" />
        <span className="font-medium text-gray-600">
          Select an email to view its content
        </span>
      </div>
    </div>
  );
}; 