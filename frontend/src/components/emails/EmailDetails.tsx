import React from 'react';
import {
  FiCheck,
  FiX,
  FiMail,
  FiPaperclip,
  FiTrash2,
  FiLoader,
  FiDownload,
} from 'react-icons/fi';

interface EmailDetailsProps {
  email: {
    id: number;
    subject: string;
    sender_email: string;
    received_at: string;
    content: string;
    html_content: string | null;
    status: string;
    status_display: string;
    approved_by_name: string | null;
    sent_at: string | null;
    has_attachments: boolean;
    attachments: Array<{
      id: number;
      filename: string;
    }>;
  };
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onDelete: (id: number) => void;
  onDownloadAttachment: (emailId: number, attachmentId: number) => void;
  downloadingAttachment: boolean;
  canApprove: boolean;
}

export const EmailDetails: React.FC<EmailDetailsProps> = ({
  email,
  onApprove,
  onReject,
  onDelete,
  onDownloadAttachment,
  downloadingAttachment,
  canApprove,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm h-full flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{email.subject}</h2>
          <div className="flex items-center gap-2">
            {canApprove && email.status === 'PENDING' && (
              <>
                <button
                  onClick={() => onReject(email.id)}
                  className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded hover:bg-red-100 transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => onApprove(email.id)}
                  className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 rounded hover:bg-green-100 transition-colors"
                >
                  Approve
                </button>
              </>
            )}
            <button
              onClick={() => onDelete(email.id)}
              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded"
              title="Delete"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span>From: {email.sender_email}</span>
          <span>Received: {new Date(email.received_at).toLocaleString()}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {email.html_content ? (
          <iframe
            srcDoc={email.html_content}
            className="w-full h-full border-0"
            title="Email content"
          />
        ) : (
          <div className="prose max-w-none">
            <p className="whitespace-pre-wrap">{email.content}</p>
          </div>
        )}
      </div>

      {email.attachments.length > 0 && (
        <div className="border-t border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Attachments</h3>
          <div className="space-y-2">
            {email.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between bg-gray-50 p-3 rounded"
              >
                <span className="text-sm text-gray-700">{attachment.filename}</span>
                <button
                  onClick={() => onDownloadAttachment(email.id, attachment.id)}
                  disabled={downloadingAttachment}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloadingAttachment ? (
                    <FiLoader className="w-4 h-4 animate-spin" />
                  ) : (
                    <FiDownload className="w-4 h-4" />
                  )}
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-gray-200 p-6">
        <div className="flex items-center justify-between text-sm">
          <span
            className={`px-2 py-0.5 rounded-full font-medium ${
              email.status === 'PENDING'
                ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                : email.status === 'APPROVED'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {email.status_display}
          </span>
          {email.sent_at && (
            <span className="text-gray-500">
              Sent: {new Date(email.sent_at).toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}; 