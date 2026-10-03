import { useEffect, useState, useCallback } from "react";
import { getToken, setToken as persistToken } from "../services/apiClient.js";
import * as authApi from "../services/authService.js";

import { AuthContext } from "./auth.js";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, if a token exists, verify it and hydrate the user.
  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const currentUser = await authApi.fetchCurrentUser();
        if (active && getToken() === token) setUser(currentUser);
      } catch (error) {
        if (active && getToken() === token) {
          if (error.status === 401) persistToken(null);
          setUser(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const clearSession = () => setUser(null);
    window.addEventListener("skillforge:unauthorized", clearSession);
    return () => window.removeEventListener("skillforge:unauthorized", clearSession);
  }, []);

  const signup = useCallback(async (fields) => {
    const newUser = await authApi.signup(fields);
    setUser(newUser);
    return newUser;
  }, []);

  const login = useCallback(async (fields) => {
    const loggedInUser = await authApi.login(fields);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    signup,
    login,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
