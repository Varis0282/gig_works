import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useSocket } from './hooks/useSocket';
import Notification from './components/Notification';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CreateGig from './pages/CreateGig';
import GigDetail from './pages/GigDetail';
import { useState } from 'react';
import './App.css';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return user ? children : <Navigate to="/login" />;
}

// App Layout with Socket.io
function AppLayout({ children }) {
  const { user } = useAuth();
  const [notification, setNotification] = useState(null);
  const [showNotification, setShowNotification] = useState(false);

  // Initialize Socket.io connection when user is logged in
  useSocket(
    user?._id?.toString() || user?._id,
    (data) => {
      // Handle freelancer-hired notification
      setNotification(data);
      setShowNotification(true);
    },
    null, // onNewBid
    (data) => {
      // Handle new-gig notification
      setNotification({
        message: data.message,
        gigId: data.gigId,
        gigTitle: data.gigTitle,
      });
      setShowNotification(true);
    }
  );

  const handleCloseNotification = () => {
    setShowNotification(false);
    setTimeout(() => setNotification(null), 300);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>{children}</main>
      {notification && (
        <Notification
          message={notification.message}
          visible={showNotification}
          onClose={handleCloseNotification}
          gigId={notification.gigId}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-gig"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CreateGig />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gig/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <GigDetail />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}