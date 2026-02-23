import { useContext } from "react";
import { AuthContext } from "./context";

export function useAuth() {
  const v = useContext(AuthContext);
  if (!v) throw new Error("AuthProvider is missing");
  return v;
}
