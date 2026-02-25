import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "@fortawesome/fontawesome-free/css/all.min.css";

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "../../../src/hover-shim.css";
import { initializeHoverModeShim } from "../../../src/domain/ui/hoverModeShim";
import { onlineStatusStore } from "../../../src/utils/onlineStatusStore";
import { api } from "../../../src/api/client";

window.onerror = (message, source, lineno, colno, error) => {
  console.error("Global error:", { message, source, lineno, colno, error });
  return false;
};

window.onunhandledrejection = (event) => {
  console.error("Unhandled promise rejection:", event.reason);
};

onlineStatusStore.registerHealthCheck(async () => {
  try {
    await api.healthCheck();
    return true;
  } catch {
    return false;
  }
});

initializeHoverModeShim();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
