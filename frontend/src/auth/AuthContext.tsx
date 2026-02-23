// frontend/src/auth/AuthContext.tsx

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { authApi } from "../api/auth";
import { tokenManager } from "../api/client";
import { logger } from "../utils/logger";
import { AuthContext, type AuthState } from "./context";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  const refresh = useCallback(async () => {
    try {
      const me = await authApi.me();

      if (me) {
        setState({ status: "authed", me });
        logger.setUserId(me.userId);
      } else {
        setState({ status: "guest" });
        logger.setUserId(null);
        tokenManager.clearToken();
      }
    } catch (error) {
      logger.error("Failed to fetch user info", { error });
      setState({ status: "guest" });
      logger.setUserId(null);
      tokenManager.clearToken();
    }
  }, []);

  const handleUnauthorized = useCallback(async () => {
    logger.info("Token expired, attempting refresh");
    const refreshed = await authApi.refresh();
    
    if (refreshed) {
      logger.info("Token refreshed successfully");
      await refresh();
    } else {
      logger.info("Refresh failed, logging out");
      setState({ status: "guest" });
      logger.setUserId(null);
    }
  }, [refresh]);

  useEffect(() => {
    // Register unauthorized callback
    tokenManager.onUnauthorized(handleUnauthorized);
  }, [handleUnauthorized]);

  const initialize = useCallback(async () => {
    try {
      // Check authentication status (access token and refresh token)
      logger.info("Checking authentication status");
      const status = await authApi.status();
      
      if (status.authenticated && status.userId && status.username) {
        // We have a valid access token
        logger.info("Valid access token found");
        setState({ 
          status: "authed", 
          me: { userId: status.userId, username: status.username } 
        });
        logger.setUserId(status.userId);
      } else if (status.canRefresh) {
        // No access token, but we have a refresh token - try to restore session
        logger.info("No access token, but refresh token exists - attempting refresh");
        const refreshed = await authApi.refresh();
        
        if (refreshed) {
          logger.info("Session restored successfully");
          await refresh();
        } else {
          logger.info("Refresh failed, starting as guest");
          setState({ status: "guest" });
        }
      } else {
        // No tokens at all - start as guest
        logger.info("No tokens found, starting as guest");
        setState({ status: "guest" });
      }
    } catch (error) {
      logger.error("Failed to initialize auth", { error });
      setState({ status: "guest" });
    }
  }, [refresh]);

  const login = useCallback(async (username: string, password: string) => {
    try {
      await authApi.login(username, password);
      await refresh();
      logger.info("User logged in successfully", { username });
    } catch (error) {
      logger.error("Login failed", { username, error });
      throw error;
    }
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
      logger.info("User logged out");
    } catch (error) {
      logger.error("Logout failed", { error });
    } finally {
      setState({ status: "guest" });
      logger.setUserId(null);
    }
  }, []);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const value = useMemo(() => ({ state, login, logout, refresh }), [state, login, logout, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
