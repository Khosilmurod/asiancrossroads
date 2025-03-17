import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Events } from './pages/Events';
import { Articles } from './pages/Articles';
import { Team } from './pages/Team';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Profile from './pages/Profile';
import Register from './pages/Register';
import EditUser from './pages/EditUser';
import EditProfile from './pages/EditProfile';
import { Subscribers } from './pages/Subscribers';
import { EmailApproval } from './pages/EmailApproval';
import { NotFound } from './components/NotFound';

// Protected Route component with role check
const RoleProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles: string[] }> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <NotFound />;
  }

  return <>{children}</>;
};

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-white">
          <Navigation />
          <main className="flex-grow pt-[72px]">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/register"
                element={
                  <RoleProtectedRoute allowedRoles={['ADMIN', 'PRESIDENT']}>
                    <Register />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subscribers"
                element={
                  <RoleProtectedRoute allowedRoles={['ADMIN', 'PRESIDENT', 'BOARD']}>
                    <Subscribers />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/emails"
                element={
                  <RoleProtectedRoute allowedRoles={['ADMIN', 'PRESIDENT', 'BOARD']}>
                    <EmailApproval />
                  </RoleProtectedRoute>
                }
              />
              <Route path="/events" element={<Events />} />
              <Route path="/articles" element={<Articles />} />
              <Route path="/team" element={<Team />} />
              <Route
                path="/users/:id/edit"
                element={
                  <RoleProtectedRoute allowedRoles={['ADMIN', 'PRESIDENT']}>
                    <EditUser />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/edit-profile"
                element={
                  <ProtectedRoute>
                    <EditProfile />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
