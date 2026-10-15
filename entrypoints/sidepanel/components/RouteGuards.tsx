import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface RouteGuardProps {
  children: React.ReactNode;
}

// Protected Route - only accessible when logged in
export function ProtectedRoute({ children }: RouteGuardProps) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public Route - only accessible when NOT logged in
export function PublicRoute({ children }: RouteGuardProps) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
