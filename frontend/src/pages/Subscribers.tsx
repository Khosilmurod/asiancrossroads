import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Subscriber {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  university?: string;
  interests?: string;
  subscribed_at: string;
  is_active: boolean;
  is_student: boolean;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Subscriber[];
}

export const Subscribers: React.FC = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const canDelete = user?.role === 'ADMIN' || user?.role === 'PRESIDENT';
  console.log('Current user role:', user?.role); // Debug log
  console.log('Can delete:', canDelete); // Debug log

  const handleDelete = async (id: number) => {
    if (!canDelete) {
      console.log('User does not have delete permission'); // Debug log
      return;
    }
    
    try {
      // Log the raw ID value
      console.log('Raw ID value:', id);
      console.log('ID type:', typeof id);
      
      // Convert ID to number if it's a string
      const subscriberId = Number(id);
      console.log('Converted ID:', subscriberId);
      
      if (typeof subscriberId !== 'number' || isNaN(subscriberId) || subscriberId <= 0) {
        console.error('Invalid subscriber ID:', {
          original: id,
          converted: subscriberId,
          type: typeof subscriberId,
          isNaN: isNaN(subscriberId),
          isPositive: subscriberId > 0
        });
        alert('Error: Invalid subscriber ID');
        return;
      }

      console.log('Attempting to delete subscriber with ID:', subscriberId); // Debug log

      const response = await axios.delete(`/api/subscribers/${subscriberId}/`);
      console.log('Delete response:', response); // Debug log
      
      if (response.status === 204) {
        console.log('Successfully deleted subscriber:', subscriberId);
        setSubscribers(prev => prev.filter(sub => sub.id !== subscriberId));
      } else {
        console.error('Unexpected response status:', response.status);
        alert('Error: Unexpected response from server');
      }
    } catch (err: any) {
      console.error('Error deleting subscriber:', err);
      console.error('Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        originalId: id,
        convertedId: Number(id)
      });
      
      let errorMessage = 'Failed to delete subscriber';
      if (err.response?.status === 404) {
        errorMessage = 'Subscriber not found. The page will refresh to show current data.';
        // Refresh the subscribers list
        window.location.reload();
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      alert(`Error: ${errorMessage}`);
    }
  };

  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        const response = await axios.get<PaginatedResponse>('/api/subscribers/');
        console.log('API Response:', response.data); // Debug log
        
        if (response.data.results) {
          // Log each subscriber's ID
          response.data.results.forEach(sub => {
            console.log(`Subscriber ${sub.first_name} ${sub.last_name} ID:`, {
              id: sub.id,
              type: typeof sub.id
            });
          });
          setSubscribers(response.data.results);
        } else if (Array.isArray(response.data)) {
          // Log each subscriber's ID
          response.data.forEach(sub => {
            console.log(`Subscriber ${sub.first_name} ${sub.last_name} ID:`, {
              id: sub.id,
              type: typeof sub.id
            });
          });
          setSubscribers(response.data);
        } else {
          console.error('Unexpected response format:', response.data);
          setError('Invalid data format received from server');
        }
      } catch (err: any) {
        console.error('Error fetching subscribers:', err);
        if (err.response?.status === 403) {
          navigate('/');
        } else {
          setError('Failed to load subscribers');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSubscribers();
  }, [navigate]);

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

  if (!Array.isArray(subscribers)) {
    console.error('subscribers is not an array:', subscribers);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">Error: Invalid data format</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-padded">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Mailing List Subscribers</h1>
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
              <span className="text-gray-600">Total Subscribers: </span>
              <span className="font-medium">{subscribers.length}</span>
            </div>
          </div>

          {subscribers.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No subscribers yet
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subscribers.map((subscriber) => {
                console.log('Rendering subscriber card:', {
                  id: subscriber.id,
                  type: typeof subscriber.id,
                  name: `${subscriber.first_name} ${subscriber.last_name}`
                });
                
                return (
                  <motion.div
                    key={subscriber.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow-sm p-6 relative group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-medium">
                          {subscriber.first_name} {subscriber.last_name}
                        </h3>
                        <p className="text-gray-600 mt-1">{subscriber.email}</p>
                      </div>
                      <div className={`h-2 w-2 rounded-full ${subscriber.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </div>
                    {subscriber.university && (
                      <p className="mt-2 text-sm text-gray-500">
                        {subscriber.university}
                      </p>
                    )}
                    {subscriber.interests && (
                      <p className="mt-2 text-sm text-gray-500">
                        Interests: {subscriber.interests}
                      </p>
                    )}
                    <div className="flex justify-between items-center mt-4">
                      <p className="text-xs text-gray-400">
                        Subscribed on {new Date(subscriber.subscribed_at).toLocaleDateString()}
                      </p>
                      {canDelete && (
                        <button
                          onClick={() => {
                            console.log('Delete button clicked for:', {
                              id: subscriber.id,
                              type: typeof subscriber.id,
                              subscriber: subscriber
                            });
                            if (window.confirm(`Are you sure you want to remove ${subscriber.first_name} ${subscriber.last_name}?`)) {
                              handleDelete(subscriber.id);
                            }
                          }}
                          className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors duration-200"
                          title="Delete subscriber"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Subscribers; 