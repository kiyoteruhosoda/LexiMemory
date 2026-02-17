import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { RequireAuth } from "./auth/RequireAuth";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { WordsPage } from "./pages/WordsPage";
import { StudyPage } from "./pages/StudyPage";
import { ErrorBoundary } from "./components/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Layout><LoginPage /></Layout>} />

            <Route
              path="/words"
              element={
                <RequireAuth>
                  <Layout><WordsPage /></Layout>
                </RequireAuth>
              }
            />

            <Route
              path="/study"
              element={
                <RequireAuth>
                  <Layout><StudyPage /></Layout>
                </RequireAuth>
              }
            />

            <Route path="/" element={<Navigate to="/words" replace />} />
            <Route path="*" element={<Navigate to="/words" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
