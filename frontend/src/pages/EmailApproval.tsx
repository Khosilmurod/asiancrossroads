import React, { useEffect, useState } from 'react';
import axios from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiInbox } from 'react-icons/fi';
import { CheckNewButton } from '../components/emails/CheckNewButton';
import { EmailListItem } from '../components/emails/EmailListItem';
import { EmailDetails } from '../components/emails/EmailDetails';
import { EmptyState } from '../components/emails/EmptyState';

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
    id: number;
    filename: string;
  }>;
}

export const EmailApproval: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingAttachment, setDownloadingAttachment] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const canManageEmails = user?.role === 'ADMIN' || user?.role === 'PRESIDENT' || user?.role === 'BOARD';
  const canApproveEmails = user?.role === 'ADMIN' || user?.role === 'PRESIDENT';

  const fetchEmails = async (pageNum = 1, append = false) => {
    try {
      const response = await axios.get(`/api/emails/?page=${pageNum}`);
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

  const handleDelete = async (emailId: number) => {
    if (window.confirm('Are you sure you want to delete this email?')) {
      try {
        await axios.post(`/api/emails/${emailId}/delete_email/`);
        await fetchEmails();
      } catch (err) {
        console.error('Error deleting email:', err);
      }
    }
  };

  const handleApprove = async (emailId: number) => {
    try {
      await axios.post(`/api/emails/${emailId}/approve/`);
      await fetchEmails();
    } catch (err) {
      console.error('Error approving email:', err);
    }
  };

  const handleReject = async (emailId: number) => {
    try {
      await axios.post(`/api/emails/${emailId}/reject/`);
      await fetchEmails();
    } catch (err) {
      console.error('Error rejecting email:', err);
    }
  };

  const handleDownloadAttachment = async (emailId: number, attachmentId: number) => {
    try {
      setDownloadingAttachment(true);
      const response = await axios.get(`/api/emails/attachment/${emailId}_${attachmentId}/`, {
        responseType: 'blob',
        headers: { 'Accept': '*/*' },
        timeout: 30000,
      });

      if (!response.data || response.data.size === 0) {
        throw new Error('Empty response received');
      }

      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/octet-stream',
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const filename = response.headers['content-disposition']?.split('filename=')[1]?.replace(/"/g, '') || 'attachment';
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      let errorMessage = 'Failed to download attachment. Please try again.';
      if (err.response?.status === 404) {
        errorMessage = 'Attachment not found. It may have expired.';
      } else if (err.response?.status === 403) {
        errorMessage = 'You do not have permission to download this attachment.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error while downloading attachment. Please try again later.';
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Download timed out. Please try again.';
      }
      alert(errorMessage);
    } finally {
      setDownloadingAttachment(false);
    }
  };

  useEffect(() => {
    if (!user) return;
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-grow">
        <div className="h-full">
          <div className="flex flex-1 overflow-hidden">
            {/* Left column: email list */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-[calc(100vh-72px)] sticky top-[72px]">
              <CheckNewButton onCheck={checkNewEmails} refreshing={refreshing} />
              
              <div className="flex-1 overflow-y-auto">
                {(!emails || emails.length === 0) ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <FiInbox className="w-12 h-12 text-gray-400 mb-3" />
                    <div className="text-gray-600 font-medium">
                      {user?.role === 'BOARD' 
                        ? "You haven't sent any emails yet"
                        : "No emails to review"}
                    </div>
                  </div>
                ) : (
                  <div>
                    {emails.map((email) => (
                      <EmailListItem
                        key={email.id}
                        email={email}
                        isSelected={selectedEmail === email.id}
                        onSelect={setSelectedEmail}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        canApprove={user?.role === 'ADMIN' || user?.role === 'PRESIDENT' || email.sender_email.toLowerCase() === user?.email?.toLowerCase()}
                      />
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
            <div className="flex-1 overflow-y-auto bg-gray-50 h-[calc(100vh-72px)]">
              <div className="h-full p-6">
                {selectedEmail ? (
                  emails
                    .filter((e) => e.id === selectedEmail)
                    .map((email) => (
                      <EmailDetails
                        key={email.id}
                        email={email}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onDelete={handleDelete}
                        onDownloadAttachment={handleDownloadAttachment}
                        downloadingAttachment={!!downloadingAttachment}
                        canApprove={user?.role === 'ADMIN' || user?.role === 'PRESIDENT' || email.sender_email.toLowerCase() === user?.email?.toLowerCase()}
                      />
                    ))
                ) : (
                  <EmptyState />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
