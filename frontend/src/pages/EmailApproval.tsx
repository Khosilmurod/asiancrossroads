import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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
}

export const EmailApproval: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const canManageEmails = user?.role === 'ADMIN' || user?.role === 'PRESIDENT';

  const fetchEmails = async () => {
    try {
      const response = await axios.get('/api/emails/');
      setEmails(response.data);
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

  useEffect(() => {
    if (!canManageEmails) {
      navigate('/');
      return;
    }
    fetchEmails();
  }, [canManageEmails, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#004aab]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-padded">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Email Approval</h1>
            <button
              onClick={checkNewEmails}
              disabled={refreshing}
              className={`px-4 py-2 bg-[#004aab] text-white rounded-lg hover:bg-[#003d8f] transition-colors ${
                refreshing ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {refreshing ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Checking...
                </div>
              ) : (
                'Check New Emails'
              )}
            </button>
          </div>

          {emails.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No emails to review
            </div>
          ) : (
            <div className="space-y-6">
              {emails.map((email) => (
                <motion.div
                  key={email.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-sm overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-medium">{email.subject}</h2>
                        <p className="text-gray-500 mt-1">From: {email.sender_email}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm ${
                        email.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        email.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {email.status_display}
                      </div>
                    </div>

                    <div className="prose max-w-none">
                      {email.html_content ? (
                        <div dangerouslySetInnerHTML={{ __html: email.html_content }} />
                      ) : (
                        <pre className="whitespace-pre-wrap font-sans">{email.content}</pre>
                      )}
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Received: {new Date(email.received_at).toLocaleString()}
                      </div>
                      
                      {email.status === 'PENDING' && (
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => handleReject(email.id)}
                            className="px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-50 transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleApprove(email.id)}
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                          >
                            Approve & Send
                          </button>
                        </div>
                      )}

                      {email.status !== 'PENDING' && (
                        <div className="text-sm text-gray-500">
                          {email.approved_by_name && (
                            <span>
                              {email.status === 'APPROVED' ? 'Approved' : 'Rejected'} by{' '}
                              {email.approved_by_name}
                            </span>
                          )}
                          {email.sent_at && (
                            <span className="ml-4">
                              Sent: {new Date(email.sent_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 