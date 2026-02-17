// frontend/src/auth/RequireAuth.tsx

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();
  if (state.status === "loading") return <div>Loading...</div>;
  if (state.status === "guest") return <Navigate to="/login" replace />;
  return <>{children}</>;
}
