import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_AVATAR } from '../constants/images';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  title: string;
  profile_picture: string;
  is_main: boolean;
  graduating_year: string;
  major: string;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: User[];
}

const UserList = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ [key: number]: File | null }>({});
  const [uploadLoading, setUploadLoading] = useState<{ [key: number]: boolean }>({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<User[] | PaginatedResponse>('http://localhost:8000/auth/users/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Check if response.data is an array
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else if ('results' in response.data && Array.isArray(response.data.results)) {
        // Handle paginated response
        setUsers(response.data.results);
      } else {
        console.error('Unexpected API response format:', response.data);
        setError('Unexpected data format received from server');
        setUsers([]);
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.detail || 'Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (userId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile({ ...selectedFile, [userId]: event.target.files[0] });
    }
  };

  const handleUpload = async (userId: number) => {
    const file = selectedFile[userId];
    if (!file) return;

    setUploadLoading({ ...uploadLoading, [userId]: true });
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const token = localStorage.getItem('token');
        
        // Create a FormData object
        const formData = new FormData();
        formData.append('profile_picture', file);
        
        await axios.patch(
          `http://localhost:8000/auth/users/${userId}/`,
          { profile_picture: base64String },
          { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            } 
          }
        );
        fetchUsers();
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload profile picture');
    } finally {
      setUploadLoading({ ...uploadLoading, [userId]: false });
      setSelectedFile({ ...selectedFile, [userId]: null });
    }
  };

  const toggleMainStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:8000/auth/users/${userId}/`,
        { is_main: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
    } catch (err) {
      setError('Failed to update user status');
    }
  };

  const deleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/auth/users/${userId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  if (loading) return <div className="text-center py-4">Loading...</div>;
  if (error) return (
    <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong className="font-bold">Error: </strong>
      <span className="block sm:inline">{error}</span>
    </div>
  );

  if (!users.length) return (
    <div className="text-center py-4 text-gray-500">
      No users found
    </div>
  );

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">User Management</h3>
      </div>
      <div className="border-t border-gray-200">
        <ul className="divide-y divide-gray-200">
          {users.map((user) => (
            <li key={user.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative group">
                    <input
                      type="file"
                      id={`photo-${user.id}`}
                      className="hidden"
                      onChange={(e) => handleFileChange(user.id, e)}
                      accept="image/*"
                    />
                    <div 
                      onClick={() => document.getElementById(`photo-${user.id}`)?.click()}
                      className="relative cursor-pointer group"
                    >
                      <img
                        src={user.profile_picture || DEFAULT_AVATAR}
                        alt={`${user.first_name} ${user.last_name}`}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      {user.is_main && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-400 border border-white" />
                      )}
                    </div>
                    {selectedFile[user.id] && (
                      <button
                        onClick={() => handleUpload(user.id)}
                        disabled={uploadLoading[user.id]}
                        className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 inline-flex items-center px-2 py-1 text-xs font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                      >
                        {uploadLoading[user.id] ? 'Uploading...' : 'Upload'}
                      </button>
                    )}
                  </div>
                  <span className="text-lg font-medium text-gray-900">
                    {`${user.first_name} ${user.last_name}`}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleMainStatus(user.id, user.is_main)}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-full ${
                      user.is_main
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    } transition-colors duration-200`}
                  >
                    {user.is_main ? '★ Main' : '☆ Not Main'}
                  </button>
                  {currentUser?.id !== user.id && (
                    <>
                      <button
                        onClick={() => navigate(`/users/${user.id}/edit`)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded text-red-600 hover:text-red-900 focus:outline-none"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default UserList; 