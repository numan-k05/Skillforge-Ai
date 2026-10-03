import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/auth.js";

/**
 * Wrap routes that should only be reachable once onboarding is done
 * (e.g. /dashboard). Use inside ProtectedRoute, which already handles
 * the "not logged in" and "still loading" cases:
 *
 *   <ProtectedRoute>
 *     <RequireOnboarding>
 *       <DashboardPage />
 *     </RequireOnboarding>
 *   </ProtectedRoute>
 */
export default function RequireOnboarding({ children }) {
  const { user } = useAuth();
  const location=useLocation();

  if (user && !user.onboardingCompleted) {
    return <Navigate to="/onboarding" state={{from:location}} replace />;
  }

  return children;
}
