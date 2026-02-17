import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "@fortawesome/fontawesome-free/css/all.min.css";

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Global error handlers for debugging
window.onerror = (message, source, lineno, colno, error) => {
  console.error("Global error:", { message, source, lineno, colno, error });
  return false; // Let default handler run
};

window.onunhandledrejection = (event) => {
  console.error("Unhandled promise rejection:", event.reason);
};

// Auto-blur buttons after tap on touch devices (prevents sticky focus/hover)
if ('ontouchstart' in window) {
  document.addEventListener('touchend', (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button') || target.classList.contains('btn')) {
      const button = target.tagName === 'BUTTON' ? target : target.closest('button');
      if (button) {
        setTimeout(() => button.blur(), 100);
      }
    }
  }, { passive: true });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
