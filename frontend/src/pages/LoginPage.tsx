import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/useAuth";
import { RnwInlineNotice } from "../rnw/components/RnwInlineNotice";
import { RnwOutlineButton } from "../rnw/components/RnwOutlineButton";
import { RnwPrimaryButton } from "../rnw/components/RnwPrimaryButton";
import { RnwTextField } from "../rnw/components/RnwTextField";
import { Text, View } from "../rnw/react-native";
import { StyleSheet } from "../rnw/stylesheet";

export function LoginPage() {
  const { state, login, registerAndLogin } = useAuth();
  const nav = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (state.status === "authed") {
      nav("/words", { replace: true });
    }
  }, [state.status, nav]);

  async function submit(): Promise<void> {
    setError(null);
    setBusy(true);
    try {
      if (mode === "register") {
        await registerAndLogin(username, password);
      } else {
        await login(username, password);
      }
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

  const title = mode === "login" ? "Login" : "Create account";
  const subtitle = mode === "login" ? "Sign in to continue." : "Register once, then you can sign in.";

  return (
    <View style={styles.pageWrap}>
      <View style={styles.card} testID="rnw-login-card">
        <View style={styles.headingWrap}>
          <h1 style={styles.heading}>
            <i className="fa-solid fa-lock" aria-hidden="true" style={styles.headingIcon} />
            {title}
          </h1>
          <Text style={styles.subtitle}>{subtitle}</Text>
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
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            icon={<i className="fa-solid fa-key" aria-hidden="true" />}
            testID="rnw-login-password"
          />

          <RnwPrimaryButton
            label={busy ? "Processing..." : mode === "login" ? "Login" : "Register & Login"}
            onPress={() => void submit()}
            disabled={busy || !username.trim() || !password.trim()}
            fullWidth
            icon={
              mode === "login" ? (
                <i className="fa-solid fa-right-to-bracket" aria-hidden="true" />
              ) : (
                <i className="fa-solid fa-user-plus" aria-hidden="true" />
              )
            }
            testID="rnw-login-submit"
          />

          <RnwOutlineButton
            label={mode === "login" ? "Switch to Register" : "Switch to Login"}
            onPress={() => setMode(mode === "login" ? "register" : "login")}
            fullWidth
            testID="rnw-login-toggle-mode"
          />
        </form>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pageWrap: {
    display: "flex",
    justifyContent: "center",
    paddingInline: 8,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    borderColor: "#dee2e6",
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    padding: 24,
    marginInline: "auto",
    boxShadow: "0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)",
    display: "flex",
    gap: 12,
  },
  headingWrap: {
    display: "flex",
    gap: 4,
  },
  heading: {
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 24,
    fontWeight: 500,
    color: "#212529",
    lineHeight: 1.2,
  },
  headingIcon: {
    color: "#0d6efd",
    fontSize: 24,
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
    gap: 12,
  },
});
