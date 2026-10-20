import StartupLoader from "../ui/StartupLoader.jsx";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/auth.js";

/**
 * Wrap any route element that requires a logged-in user, e.g.:
 * <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) { return <StartupLoader message="Preparing your workspace…" />; }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
