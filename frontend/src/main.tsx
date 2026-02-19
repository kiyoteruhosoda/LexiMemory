import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "@fortawesome/fontawesome-free/css/all.min.css";

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./hover-shim.css";
import { initializeHoverModeShim } from "./domain/ui/hoverModeShim";

// Global error handlers for debugging
window.onerror = (message, source, lineno, colno, error) => {
  console.error("Global error:", { message, source, lineno, colno, error });
  return false; // Let default handler run
};

window.onunhandledrejection = (event) => {
  console.error("Unhandled promise rejection:", event.reason);
};

initializeHoverModeShim();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
