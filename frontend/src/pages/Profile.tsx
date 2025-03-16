import React, { useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import UserList from '../components/UserList';
import { DEFAULT_AVATAR } from '../constants/images';

const Profile = () => {
  const { user, logout, isAdmin, isPresident, updateProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRegisterNewUser = () => {
    navigate('/register');
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        await updateProfile({ profile_picture: base64String });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error updating profile picture:', error);
      alert('Failed to update profile picture. Please try again.');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Profile Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and information.</p>
            </div>
            <button
              onClick={() => navigate('/edit-profile')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Edit Profile
            </button>
          </div>
          {/* Header with background and profile picture */}
          <div className="relative h-48 bg-gradient-to-r from-indigo-600 to-purple-600">
            <div className="absolute -bottom-16 left-8">
              <div className="relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <img
                  src={user.profile_picture || DEFAULT_AVATAR}
                  alt={`${user.first_name} ${user.last_name}`}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={handleImageClick}
                />
                {user.is_main && (
                  <span className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-green-400 border-2 border-white" />
                )}
                <div 
                  className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                  onClick={handleImageClick}
                >
                  <div className="bg-black bg-opacity-50 rounded-full w-full h-full flex items-center justify-center">
                    <span className="text-white text-sm">Change Photo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="pt-20 px-8 pb-8">
            {/* Name and Title Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                {user.first_name} {user.last_name}
              </h1>
              <div className="mt-2 flex items-center space-x-4">
                <span className="text-xl text-gray-600">{user.title}</span>
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-800">
                  {user.role}
                </span>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Academic Information</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-500">Major</span>
                      <p className="text-gray-900">{user.major}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Class of</span>
                      <p className="text-gray-900">{user.graduating_year}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-500">Email</span>
                      <p className="text-gray-900">{user.email}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Username</span>
                      <p className="text-gray-900">{user.username}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {user.description || "No description provided."}
                </p>
              </div>
            </div>

            {/* Admin Actions */}
            {isAdmin() && (
              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Administrative Actions</h3>
                <div className="flex space-x-4">
                  <button
                    onClick={handleRegisterNewUser}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Register New User
                  </button>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Management Section */}
        {(isAdmin() || isPresident()) && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
              <button
                onClick={handleRegisterNewUser}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Register New User
              </button>
            </div>
            <UserList />
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile; 