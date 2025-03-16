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

// Protected Route component with role check
const RoleProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles: string[] }> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
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
          <main className="flex-grow pt-16">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/subscribers" element={<Subscribers />} />
              <Route path="/emails" element={<EmailApproval />} />
              <Route path="/events" element={<Events />} />
              <Route path="/articles" element={<Articles />} />
              <Route path="/team" element={<Team />} />
              <Route
                path="/users/:id/edit"
                element={
                  <ProtectedRoute>
                    <EditUser />
                  </ProtectedRoute>
                }
              />
              <Route path="/edit-profile" element={<EditProfile />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
