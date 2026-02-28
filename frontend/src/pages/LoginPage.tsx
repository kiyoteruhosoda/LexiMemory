// frontend/src/pages/LoginPage.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/useAuth";
import type { AuthCommand, AuthIntent } from "../core/auth/authSessionService";
import { RnwInlineNotice } from "../rnw/components/RnwInlineNotice";
import { RnwButton } from "../rnw/components/RnwButton";
import { RnwTextField } from "../rnw/components/RnwTextField";
import { RnwSurfaceCard } from "@leximemory/ui";
import { Text, View } from "../rnw/react-native";
import { StyleSheet } from "../rnw/stylesheet";

type LoginMode = "login" | "register";

type AuthModeViewModel = {
  intent: AuthIntent;
  title: string;
  subtitle: string;
  submitLabel: string;
  submitIconClass: string;
  passwordAutoComplete: string;
};

const authModeViewModels: Record<LoginMode, AuthModeViewModel> = {
  login: {
    intent: "login",
    title: "Login",
    subtitle: "Sign in to continue.",
    submitLabel: "Login",
    submitIconClass: "fa-solid fa-right-to-bracket",
    passwordAutoComplete: "current-password",
  },
  register: {
    intent: "register",
    title: "Create account",
    subtitle: "Register once, then you can sign in.",
    submitLabel: "Register & Login",
    submitIconClass: "fa-solid fa-user-plus",
    passwordAutoComplete: "new-password",
  },
};

export function LoginPage() {
  const { state, authenticate } = useAuth();
  const nav = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<LoginMode>("login");
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);

  const viewModel = useMemo(() => authModeViewModels[mode], [mode]);

  useEffect(() => {
    if (state.status === "authed") {
      nav("/words", { replace: true });
    }
  }, [state.status, nav]);

  async function submit(): Promise<void> {
    const normalizedUsername = username.trim();
    const authCommand: AuthCommand = {
      intent: viewModel.intent,
      username: normalizedUsername,
      password,
    };

    setError(null);
    setBusy(true);
    try {
      await authenticate(authCommand);
      nav("/words", { replace: true });
    } catch (caughtError: unknown) {
      setError(caughtError instanceof ApiError ? caughtError : new ApiError(0, "Unexpected error"));
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    await submit();
  }

  return (
    <View style={styles.pageWrap}>
      <RnwSurfaceCard testID="rnw-login-card">
        <View style={styles.headingWrap}>
          <h1 style={styles.heading}>
            <i className="fa-solid fa-lock" aria-hidden="true" style={styles.headingIcon} />
            {viewModel.title}
          </h1>
          <Text style={styles.subtitle}>{viewModel.subtitle}</Text>
        </View>

        {error ? (
          <RnwInlineNotice
            tone="error"
            message={error.message}
            icon={<i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />}
          />
        ) : null}

        {(error?.requestId || error?.errorCode) && (
          <Text style={styles.errorMeta}>
            {error.errorCode ? `code: ${error.errorCode} ` : ""}
            {error.requestId ? `request_id: ${error.requestId}` : ""}
          </Text>
        )}

        <form onSubmit={(event) => void onSubmit(event)} style={styles.form}>
          <RnwTextField
            label="Username"
            value={username}
            onChange={setUsername}
            autoComplete="username"
            icon={<i className="fa-solid fa-user" aria-hidden="true" />}
            testID="rnw-login-username"
          />

          <RnwTextField
            label="Password"
            value={password}
            onChange={setPassword}
            secureTextEntry
            autoComplete={viewModel.passwordAutoComplete}
            icon={<i className="fa-solid fa-key" aria-hidden="true" />}
            testID="rnw-login-password"
          />

          <RnwButton
            label={busy ? "Processing..." : viewModel.submitLabel}
            onPress={() => void submit()}
            disabled={busy || !username.trim() || !password.trim()}
            fullWidth
            icon={<i className={viewModel.submitIconClass} aria-hidden="true" />}
            testID="rnw-login-submit"
            kind="solid"
            tone="primary"
          />

          <RnwButton
            label={mode === "login" ? "Switch to Register" : "Switch to Login"}
            onPress={() => setMode(mode === "login" ? "register" : "login")}
            fullWidth
            testID="rnw-login-toggle-mode"
            kind="outline"
            tone="secondary"
          />
        </form>
      </RnwSurfaceCard>
    </View>
  );
}

const styles = StyleSheet.create({
  pageWrap: {
    display: "flex",
    justifyContent: "center",
    paddingInline: 8,
  },
  headingWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "0.375rem",
  },

  // ★ここを row にする
  heading: {
    margin: 0,
    display: "flex",
    flexDirection: "row",      // column → row
    alignItems: "center",      // 同列で中央揃え
    gap: 8,                    // 6でも良いが少し広めが自然
    fontSize: 24,
    fontWeight: 500,
    color: "#212529",
    lineHeight: 1.2,
  },

  // ★アイコンも安定させる
  headingIcon: {
    display: "inline-flex",    // i 要素の縦ズレ対策
    alignItems: "center",
    justifyContent: "center",
    color: "#0d6efd",
    fontSize: 22,
    lineHeight: 1,             // 余計な上下を消す
  },

  subtitle: {
    fontSize: 14,
    color: "#6c757d",
  },
  errorMeta: {
    fontSize: 12,
    color: "#6c757d",
    paddingInline: 4,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
});