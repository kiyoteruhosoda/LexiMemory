import React, { useEffect, useMemo, useState, useCallback } from "react";
import { tokenManager } from "../api/client";
import { logger } from "../utils/logger";
import { AuthContext, type AuthState } from "./context";
import { AuthSessionService, type AuthStateSnapshot } from "../core/auth/authSessionService";
import { authGatewayAdapter } from "./authGatewayAdapter";

const authSessionService = new AuthSessionService(authGatewayAdapter);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  const applyAuthState = useCallback((snapshot: AuthStateSnapshot) => {
    if (snapshot.status === "authed") {
      setState({ status: "authed", me: snapshot.me });
      logger.setUserId(snapshot.me.userId);
      return;
    }

    setState({ status: "guest" });
    logger.setUserId(null);
    tokenManager.clearToken();
  }, []);

  const refresh = useCallback(async () => {
    try {
      const snapshot = await authSessionService.refreshUserState();
      applyAuthState(snapshot);
    } catch (error) {
      logger.error("Failed to fetch user info", { error });
      applyAuthState({ status: "guest" });
    }
  }, [applyAuthState]);

  const handleUnauthorized = useCallback(async () => {
    logger.info("Token expired, attempting refresh");
    const snapshot = await authSessionService.recoverFromUnauthorized();
    applyAuthState(snapshot);
    if (snapshot.status === "authed") {
      logger.info("Token refreshed successfully");
      return;
    }
    logger.info("Refresh failed, logging out");
  }, [applyAuthState]);

  useEffect(() => {
    tokenManager.onUnauthorized(handleUnauthorized);
  }, [handleUnauthorized]);

  const initialize = useCallback(async () => {
    try {
      logger.info("Checking authentication status");
      const snapshot = await authSessionService.initialize();
      applyAuthState(snapshot);

      if (snapshot.status === "authed") {
        logger.info("Valid access token found");
      } else {
        logger.info("No tokens found, starting as guest");
      }
    } catch (error) {
      logger.error("Failed to initialize auth", { error });
      applyAuthState({ status: "guest" });
    }
  }, [applyAuthState]);

  const login = useCallback(
    async (username: string, password: string) => {
      try {
        const snapshot = await authSessionService.login(username, password);
        applyAuthState(snapshot);
        logger.info("User logged in successfully", { username });
      } catch (error) {
        logger.error("Login failed", { username, error });
        throw error;
      }
    },
    [applyAuthState]
  );

  const registerAndLogin = useCallback(
    async (username: string, password: string) => {
      try {
        const snapshot = await authSessionService.registerAndLogin(username, password);
        applyAuthState(snapshot);
        logger.info("User registered and logged in successfully", { username });
      } catch (error) {
        logger.error("Register and login failed", { username, error });
        throw error;
      }
    },
    [applyAuthState]
  );

  const logout = useCallback(async () => {
    try {
      const snapshot = await authSessionService.logout();
      applyAuthState(snapshot);
      logger.info("User logged out");
    } catch (error) {
      logger.error("Logout failed", { error });
      applyAuthState({ status: "guest" });
    }
  }, [applyAuthState]);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const value = useMemo(() => ({ state, login, registerAndLogin, logout, refresh }), [state, login, registerAndLogin, logout, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
