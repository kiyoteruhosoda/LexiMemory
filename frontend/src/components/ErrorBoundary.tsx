// src/components/ErrorBoundary.tsx
import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { logger } from "../utils/logger";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("React Error Boundary caught:", error, errorInfo);
    logger.error("React Error Boundary caught uncaught error", {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mt-5">
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-heading">
              <i className="fa-solid fa-bug me-2" />
              Something went wrong
            </h4>
            <p className="mb-2">{this.state.error?.message || "Unknown error"}</p>
            {this.state.errorInfo && (
              <details className="mt-3">
                <summary className="btn btn-sm btn-outline-danger">
                  Show details
                </summary>
                <pre className="mt-2 p-3 bg-light border rounded">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <hr />
            <button
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
