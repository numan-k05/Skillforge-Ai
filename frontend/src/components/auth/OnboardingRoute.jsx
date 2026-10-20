import StartupLoader from "../ui/StartupLoader.jsx";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/auth.js";

/**
 * Wrap the /onboarding route. Requires a logged-in user (like
 * ProtectedRoute) and additionally bounces a user who has already
 * completed onboarding straight to /dashboard, so a finished onboarding
 * flow can't be re-entered.
 */
export default function OnboardingRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) { return <StartupLoader message="Preparing your workspace…" />; }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.onboardingCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
