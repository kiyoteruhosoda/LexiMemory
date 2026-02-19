// frontend/src/components/Layout.tsx

import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import SyncButton from "./SyncButton";

export function Layout({ children }: { children: React.ReactNode }) {
  const { state, logout } = useAuth();
  const nav = useNavigate();
  const appVersion = import.meta.env.VITE_APP_VERSION ?? "unknown";

  async function onLogout() {
    await logout();
    nav("/login", { replace: true });
  }

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/words">
            LexiMemory
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarsExample"
            aria-controls="navbarsExample"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse" id="navbarsExample">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <NavLink className="nav-link" to="/words">
                  Words
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/study">
                  Study
                </NavLink>
              </li>
            </ul>

            {state.status === "authed" ? (
              <div className="d-flex align-items-center gap-3">
                <span className="text-light small">
                  <i className="fa-solid fa-user me-1" />
                  {state.me.username}
                </span>
                <button className="btn btn-outline-light btn-sm" onClick={() => void onLogout()}>
                  <i className="fa-solid fa-right-from-bracket me-1" />
                  Logout
                </button>
              </div>
            ) : (
              <span className="text-secondary small">Guest</span>
            )}
          </div>
        </div>
      </nav>

      <div className="container my-4">
        {/* Sync panel at the top */}
        <div className="row mb-3">
          <div className="col-12">
            <SyncButton />
          </div>
        </div>
        
        {children}
      </div>
      <footer className="text-center mt-4">
        LexiMemory <span className="ms-2 badge text-bg-secondary">v{appVersion}</span>
      </footer>
    </>
  );
}
