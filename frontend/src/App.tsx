import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
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
  // Initialize IndexedDB on app load
  useEffect(() => {
    ensureInitialized().catch((err) => {
      console.error("Failed to initialize IndexedDB:", err);
    });
  }, []);

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
