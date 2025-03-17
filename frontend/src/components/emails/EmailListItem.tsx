import React from 'react';
import { FiCheck, FiX } from 'react-icons/fi';
import { formatDate } from '../../utils/dateUtils';

interface EmailListItemProps {
  email: {
    id: number;
    sender_email: string;
    subject: string;
    content: string;
    received_at: string;
    status: string;
    status_display: string;
  };
  isSelected: boolean;
  onSelect: (id: number) => void;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  canApprove: boolean;
}

export const EmailListItem: React.FC<EmailListItemProps> = ({
  email,
  isSelected,
  onSelect,
  onApprove,
  onReject,
  canApprove,
}) => {
  const handleApprove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onApprove(email.id);
  };

  const handleReject = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReject(email.id);
  };

  return (
    <div
      onClick={() => onSelect(email.id)}
      className={`px-4 py-3 cursor-pointer transition-all border-l-[3px] ${
        isSelected
          ? 'bg-blue-50 border-l-blue-500'
          : 'hover:bg-gray-50 border-l-transparent'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-medium text-gray-900 text-sm truncate max-w-[160px]">
          {email.sender_email}
        </span>
        <span className="text-xs text-gray-500 flex-shrink-0">
          {formatDate(email.received_at)}
        </span>
      </div>
      <div className="text-sm font-medium text-gray-800 truncate mb-1">
        {email.subject}
      </div>
      <div className="text-xs text-gray-500 truncate mb-2">
        {email.content.substring(0, 100)}...
      </div>
      <div className="flex items-center justify-between">
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            email.status === 'PENDING'
              ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
              : email.status === 'APPROVED'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {email.status_display}
        </span>
        {canApprove && email.status === 'PENDING' && (
          <div className="flex gap-1">
            <button
              onClick={handleReject}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded"
              title="Reject"
            >
              <FiX className="w-4 h-4" />
            </button>
            <button
              onClick={handleApprove}
              className="p-1 text-gray-400 hover:text-green-500 transition-colors rounded"
              title="Approve"
            >
              <FiCheck className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}; 