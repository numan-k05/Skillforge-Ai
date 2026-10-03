import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/auth.js';
export default function OwnerRoute({children}) {
  const {user,loading}=useAuth();
  if(loading) return <p>Loading account…</p>;
  return user?.isOwnerAdmin ? children : <Navigate to="/dashboard" replace/>;
}
