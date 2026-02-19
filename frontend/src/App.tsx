import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AuthProvider } from "./auth/AuthContext";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { WordListPage } from "./pages/WordListPage";
import { WordCreatePage } from "./pages/WordCreatePage";
import { WordDetailPage } from "./pages/WordDetailPage";
import { StudyPage } from "./pages/StudyPage";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ensureInitialized } from "./db/localRepository";

export default function App() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Initialize IndexedDB on app load
  useEffect(() => {
    ensureInitialized()
      .then(() => setDbInitialized(true))
      .catch((err) => {
        console.error("Failed to initialize IndexedDB:", err);
        setInitError(err.message || "Database initialization failed");
      });
  }, []);

  // Show loading screen while initializing
  if (!dbInitialized && !initError) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div>Initializing database...</div>
        </div>
      </div>
    );
  }

  // Show error screen if initialization failed
  if (initError) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
        <div className="alert alert-danger">
          <h4>Database Initialization Error</h4>
          <p>{initError}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Layout><LoginPage /></Layout>} />

            {/* All pages are accessible offline without authentication */}
            <Route path="/words" element={<Layout><WordListPage /></Layout>} />
            <Route path="/words/create" element={<Layout><WordCreatePage /></Layout>} />
            <Route path="/words/:id" element={<Layout><WordDetailPage /></Layout>} />
            <Route path="/study" element={<Layout><StudyPage /></Layout>} />

            <Route path="/" element={<Navigate to="/words" replace />} />
            <Route path="*" element={<Navigate to="/words" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
