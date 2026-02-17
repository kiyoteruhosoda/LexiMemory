import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { RequireAuth } from "./auth/RequireAuth";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { WordListPage } from "./pages/WordListPage";
import { WordCreatePage } from "./pages/WordCreatePage";
import { WordDetailPage } from "./pages/WordDetailPage";
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
                  <Layout><WordListPage /></Layout>
                </RequireAuth>
              }
            />

            <Route
              path="/words/create"
              element={
                <RequireAuth>
                  <Layout><WordCreatePage /></Layout>
                </RequireAuth>
              }
            />

            <Route
              path="/words/:id"
              element={
                <RequireAuth>
                  <Layout><WordDetailPage /></Layout>
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
