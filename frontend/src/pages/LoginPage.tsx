import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../api/client";
import { authApi } from "../api/auth";

export function LoginPage() {
  const { state, login } = useAuth();
  const nav = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<ApiError | null>(null); // ★変更
  const [busy, setBusy] = useState(false);

  if (state.status === "authed") {
    nav("/words", { replace: true });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "register") {
        await authApi.register(username, password);
      }
      await login(username, password);
      nav("/words", { replace: true });
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError(0, "Unexpected error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-7 col-lg-5">
        <div className="card shadow-sm">
          <div className="card-body p-4">
            <h4 className="card-title mb-1">
              <i className="fa-solid fa-lock me-2 text-primary" />
              {mode === "login" ? "Login" : "Create account"}
            </h4>
            <p className="text-secondary small mb-4">
              {mode === "login"
                ? "Sign in to continue."
                : "Register once, then you can sign in."}
            </p>

            {error ? (
              <div className="alert alert-danger" role="alert">
                <div className="d-flex align-items-start">
                  <i className="fa-solid fa-triangle-exclamation me-2 mt-1" />
                  <div className="flex-grow-1">
                    <div>{error.message}</div>

                    {/* ★運用向け：request_id / error_code を表示 */}
                    {(error.requestId || error.errorCode) ? (
                      <div className="small text-muted mt-1">
                        {error.errorCode ? (
                          <span className="me-2">code: <span className="mono">{error.errorCode}</span></span>
                        ) : null}
                        {error.requestId ? (
                          <span>request_id: <span className="mono">{error.requestId}</span></span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="vstack gap-3">
              <div>
                <label className="form-label">Username</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fa-solid fa-user" />
                  </span>
                  <input
                    className="form-control"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Password</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fa-solid fa-key" />
                  </span>
                  <input
                    className="form-control"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    required
                  />
                </div>
              </div>

              <button className="btn btn-primary" disabled={busy} type="submit">
                {busy ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Processing...
                  </>
                ) : mode === "login" ? (
                  <>
                    <i className="fa-solid fa-right-to-bracket me-2" />
                    Login
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-user-plus me-2" />
                    Register & Login
                  </>
                )}
              </button>

              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
              >
                {mode === "login" ? "Switch to Register" : "Switch to Login"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
