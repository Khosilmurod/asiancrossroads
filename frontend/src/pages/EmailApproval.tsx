import React, { useEffect, useState } from 'react';
import axios from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  FiRefreshCw,
  FiMail,
  FiCheck,
  FiX,
  FiInbox,
  FiPaperclip,
  FiLink,
  FiTrash2,
} from 'react-icons/fi';

interface Email {
  id: number;
  sender_email: string;
  subject: string;
  content: string;
  html_content: string | null;
  received_at: string;
  status: string;
  status_display: string;
  approved_by_name: string | null;
  approved_at: string | null;
  sent_at: string | null;
  has_attachments: boolean;
  attachments: Array<{
    filename: string;
    size: number;
    content_type: string;
    url: string;
  }>;
}

export const EmailApproval: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingAttachment, setDownloadingAttachment] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const canManageEmails = user?.role === 'ADMIN' || user?.role === 'PRESIDENT';

  const fetchEmails = async (pageNum = 1, append = false) => {
    try {
      const response = await axios.get(`/api/emails/?page=${pageNum}`);
      console.log('Email response:', response.data);
      if (append) {
        setEmails(prev => [...prev, ...(response.data.results || [])]);
      } else {
        setEmails(response.data.results || []);
      }
      setHasMore(!!response.data.next);
    } catch (err: any) {
      if (err.response?.status === 403) {
        navigate('/');
      } else {
        setError('Failed to load emails');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchEmails(nextPage, true);
  };

  const checkNewEmails = async () => {
    setRefreshing(true);
    try {
      await axios.post('/api/emails/check_new/');
      await fetchEmails();
    } catch (err) {
      console.error('Error checking new emails:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async (emailId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this email?')) {
      try {
        await axios.post(`/api/emails/${emailId}/delete_email/`);
        await fetchEmails();
      } catch (err) {
        console.error('Error deleting email:', err);
      }
    }
  };

  const handleApprove = async (emailId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await axios.post(`/api/emails/${emailId}/approve/`);
      await fetchEmails();
    } catch (err) {
      console.error('Error approving email:', err);
    }
  };

  const handleReject = async (emailId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await axios.post(`/api/emails/${emailId}/reject/`);
      await fetchEmails();
    } catch (err) {
      console.error('Error rejecting email:', err);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      setDownloadingAttachment(filename);
      console.log('Starting download for:', filename, 'from URL:', url);

      const response = await axios.get(url, {
        responseType: 'blob',
        headers: { 'Accept': '*/*' },
        timeout: 30000, // 30 second timeout
      });

      console.log('Download response received:', {
        type: response.headers['content-type'],
        size: response.data.size,
        status: response.status,
      });

      if (!response.data || response.data.size === 0) {
        throw new Error('Empty response received');
      }

      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/octet-stream',
      });

      console.log('Created blob:', {
        size: blob.size,
        type: blob.type,
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      console.log('Download initiated successfully');
    } catch (err: any) {
      console.error('Download error:', err);
      let errorMessage = 'Failed to download attachment. Please try again.';

      if (err.response) {
        if (err.response.status === 404) {
          errorMessage = 'Attachment not found. It may have expired.';
        } else if (err.response.status === 403) {
          errorMessage = 'You do not have permission to download this attachment.';
        } else if (err.response.status === 500) {
          errorMessage = 'Server error while downloading attachment. Please try again later.';
        }

        if (err.response.data && err.response.data.error) {
          console.error('Server error details:', err.response.data.error);
        }
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Download timed out. Please try again.';
      }

      alert(errorMessage);
    } finally {
      setDownloadingAttachment(null);
    }
  };

  useEffect(() => {
    if (!user) {
      return;
    }
    if (!canManageEmails) {
      navigate('/');
      return;
    }
    fetchEmails();
  }, [canManageEmails, navigate, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Main content area */}
      <div className="flex-grow">
        <div className="px-4 py-8">
          {/* Two-column layout: left (email list), right (email detail) */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left column: email list */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
              {/* Check New button on top of the inbox column */}
              <div className="h-16 flex items-center justify-center px-4 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200">
                <button
                  onClick={checkNewEmails}
                  disabled={refreshing}
                  className="w-full h-12 flex items-center justify-center gap-2 text-sm font-medium text-gray-600 disabled:opacity-70 disabled:cursor-not-allowed bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-200 transition-all"
                >
                  {refreshing ? (
                    <FiRefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <FiRefreshCw className="w-5 h-5" />
                  )}
                  Check New
                </button>
              </div>
              
              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto">
                {(!emails || emails.length === 0) ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <FiInbox className="w-12 h-12 text-gray-400 mb-3" />
                    <div className="text-gray-600 font-medium">No emails to review</div>
                  </div>
                ) : (
                  <div>
                    {emails.map((email) => (
                      <div
                        key={email.id}
                        onClick={() => setSelectedEmail(email.id)}
                        className={`px-4 py-3 cursor-pointer transition-all border-l-[3px] ${
                          selectedEmail === email.id
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
                          {email.status === 'PENDING' && (
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => handleReject(email.id, e)}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded"
                                title="Reject"
                              >
                                <FiX className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => handleApprove(email.id, e)}
                                className="p-1 text-gray-400 hover:text-green-500 transition-colors rounded"
                                title="Approve"
                              >
                                <FiCheck className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {hasMore && (
                      <div className="flex justify-center mt-4 mb-8">
                        <button
                          onClick={loadMore}
                          className="px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
                        >
                          Show More
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right column: selected email details */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
              {selectedEmail ? (
                <div className="max-w-4xl mx-auto p-6">
                  {emails
                    .filter((e) => e.id === selectedEmail)
                    .map((email) => (
                      <div key={email.id}>
                        {/* Email header */}
                        <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-300">
                          <div className="flex-1 pr-8">
                            <h2 className="text-xl font-medium text-gray-900 mb-4">
                              {email.subject}
                            </h2>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-gray-500">From: </span>
                                <span className="text-gray-900 font-medium">
                                  {email.sender_email}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Received: </span>
                                <span className="text-gray-700">
                                  {new Date(email.received_at).toLocaleString()}
                                </span>
                              </div>
                              {email.has_attachments && email.attachments && (
                                <div className="flex items-center gap-4 mt-2 text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <FiPaperclip className="w-4 h-4" />
                                    <span>
                                      {email.attachments.length} attachment
                                      {email.attachments.length !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {email.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={(e) => handleReject(email.id, e)}
                                  className="px-3 py-1.5 border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-1.5 text-sm font-medium"
                                >
                                  <FiX className="w-4 h-4" />
                                  <span>Reject</span>
                                </button>
                                <button
                                  onClick={(e) => handleApprove(email.id, e)}
                                  className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1.5 text-sm font-medium"
                                >
                                  <FiCheck className="w-4 h-4" />
                                  <span>Approve</span>
                                </button>
                              </>
                            )}
                            <button
                              onClick={(e) => handleDelete(email.id, e)}
                              className="px-3 py-1.5 border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-1.5 text-sm font-medium"
                              title="Delete Email"
                            >
                              <FiTrash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>

                        {/* Email body (in iframe to avoid style leaks) */}
                        <div className="text-gray-800 mb-6 bg-white rounded-lg shadow-sm">
                          {email.html_content ? (
                            <iframe
                              srcDoc={email.html_content}
                              title="Email Content"
                              className="w-full rounded-lg"
                              style={{
                                width: '100%',
                                minHeight: '500px',
                                border: 'none',
                                background: '#fff',
                              }}
                              sandbox="allow-same-origin"
                            />
                          ) : (
                            <div className="p-6">
                              <pre className="whitespace-pre-wrap font-sans text-gray-800">
                                {email.content}
                              </pre>
                            </div>
                          )}
                        </div>

                        {/* Attachments Section */}
                        {(email.has_attachments || email.attachments?.length > 0) && (
                          <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                            <div className="text-sm font-medium text-gray-700 mb-3">
                              Attachments
                            </div>
                            <div className="space-y-2">
                              {email.attachments?.map((attachment, index) => (
                                <button
                                  key={index}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDownload(attachment.url, attachment.filename);
                                  }}
                                  className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 rounded transition-colors group text-left cursor-pointer"
                                  type="button"
                                  title={`Download ${attachment.filename}`}
                                  disabled={downloadingAttachment === attachment.filename}
                                >
                                  {downloadingAttachment === attachment.filename ? (
                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <FiPaperclip className="w-4 h-4 text-gray-500 group-hover:text-blue-500" />
                                  )}
                                  <span className="text-sm text-blue-600 group-hover:text-blue-700 group-hover:underline flex-1">
                                    {attachment.filename}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    ({Math.round(attachment.size / 1024)}KB)
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Approval/Reject Footer */}
                        {email.status !== 'PENDING' && (
                          <div className="mt-6 text-sm text-gray-500 border-t border-gray-300 pt-4">
                            {email.approved_by_name && (
                              <div className="flex items-center gap-2">
                                {email.status === 'APPROVED' ? (
                                  <FiCheck className="w-4 h-4 text-green-500" />
                                ) : (
                                  <FiX className="w-4 h-4 text-red-500" />
                                )}
                                <span>
                                  {email.status === 'APPROVED' ? 'Approved' : 'Rejected'} by{' '}
                                  <span className="font-medium">{email.approved_by_name}</span>
                                </span>
                              </div>
                            )}
                            {email.sent_at && (
                              <div className="mt-2 flex items-center gap-2">
                                <FiMail className="w-4 h-4 text-gray-400" />
                                <span>Sent: {new Date(email.sent_at).toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                // No email selected
                <div className="flex flex-col items-center h-full text-gray-500 pt-32">
                  <div className="flex flex-col items-center">
                    <FiMail className="w-12 h-12 mb-4 text-gray-400" />
                    <span className="font-medium text-gray-600">Select an email to view its content</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
