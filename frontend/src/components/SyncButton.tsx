/**
 * SyncButton component for offline-first vocabulary synchronization
 * 
 * Minimal sync button with unified status indicator
 */

import { useState, useEffect } from "react";
import { Modal } from "./Modal";
import type { SyncStatus, SyncConflict } from "../db/syncService";
import { syncUseCase } from "../sync/syncGatewayAdapter";
import type { ConflictResolution } from "../db/types";
import { useAuth } from "../auth/useAuth";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { storage } from "../core/storage";

type SyncButtonProps = {
  onSyncSuccess?: () => void;
};

export default function SyncButton({ onSyncSuccess }: SyncButtonProps = {}) {
  const { state } = useAuth();
  const isAuthenticated = state.status === "authed";
  const isOnline = useOnlineStatus(); // Use the hook
  const [status, setStatus] = useState<Omit<SyncStatus, "online"> | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [conflict, setConflict] = useState<SyncConflict | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState<ConflictResolution>("fetch-server");

  // Load sync metadata on mount and when authentication changes
  useEffect(() => {
    void loadStatus();
  }, [isAuthenticated]);

  // Auto-sync after login if there was a pending sync and we are online
  useEffect(() => {
    if (isAuthenticated && isOnline) {
      void (async () => {
        const pendingSync = await storage.get("pendingSync");
        if (pendingSync !== "true") {
          return;
        }

        await storage.remove("pendingSync");
        // Execute sync automatically after a short delay to ensure auth is fully ready
        const timer = setTimeout(() => {
          void handleSync();
        }, 100);
        return () => clearTimeout(timer);
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- handleSync depends on state
  }, [isAuthenticated, isOnline]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadStatus = async () => {
    try {
      // We get the full status, but only store the parts we need, ignoring 'online'
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { online, ...rest } = await syncUseCase.getStatus();
      setStatus(rest);
    } catch (err: unknown) {
      console.error("Failed to load sync status:", err);
    }
  };

  const handleSync = async () => {
    // Prevent sync if offline
    if (!isOnline) {
      console.log("Sync prevented: You are offline.");
      return;
    }

    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      void storage.set("pendingSync", "true");
      return;
    }

    setSyncing(true);
    setSuccessMessage(null);

    try {
      const result = await syncUseCase.sync();

      if (result.status === "success") {
        // Success
        await loadStatus();
        setSuccessMessage("Sync completed successfully");
        // Notify parent component to refresh data
        if (onSyncSuccess) {
          onSyncSuccess();
        }
      } else if (result.status === "conflict") {
        // Conflict - show resolution dialog
        setConflict(result);
      }
      // Errors are now handled by the API client layer setting online status
    } catch (err: unknown) {
      // Check if authentication error
      const error = err as { status?: number };
      if (error.status === 401) {
        setShowLoginPrompt(true);
        void storage.set("pendingSync", "true");
      }
      // Other errors are now more gracefully handled by the online status store
      console.error("Sync failed:", err);
    } finally {
      setSyncing(false);
    }
  };

  const handleResolveConflict = async () => {
    setSyncing(true);
    setSuccessMessage(null);

    if (!isOnline) {
      console.log("Conflict resolution prevented: You are offline.");
      setSyncing(false);
      return;
    }

    try {
      await syncUseCase.resolve(selectedResolution);
      setConflict(null);
      setSelectedResolution("fetch-server"); // Reset to default
      await loadStatus();
      setSuccessMessage("Conflict resolved successfully");
      // Notify parent component to refresh data
      if (onSyncSuccess) {
        onSyncSuccess();
      }
    } catch (err: unknown) {
      // Errors are silently ignored in this minimal button
      console.error("Failed to resolve conflict:", err);
    } finally {
      setSyncing(false);
    }
  };

  if (!status) {
    return null;
  }

  // Determine status badge color: yellow (dirty) takes priority over green (online)
  const statusColor = status.dirty ? "warning" : isOnline ? "success" : "secondary";
  const statusTitle = status.dirty 
    ? "Unsaved changes" 
    : isOnline 
    ? "Online" 
    : "Offline";

  return (
    <>
      {/* Minimal sync button with unified status indicator */}
      <button
        className="btn btn-sm btn-outline-secondary position-relative"
        onClick={handleSync}
        disabled={syncing || !isOnline}
        title={statusTitle}
      >
        {syncing ? (
          <span className="spinner-border spinner-border-sm" role="status" />
        ) : (
          <i className="fas fa-sync-alt" />
        )}
        
        {/* Unified status dot indicator (yellow > green > gray) */}
        <span
          className={`position-absolute top-0 start-100 translate-middle p-1 border border-dark rounded-circle bg-${statusColor}`}
          style={{ marginLeft: "-0.5rem" }}
        >
          <span className="visually-hidden">{statusTitle}</span>
        </span>
      </button>

      {/* Success toast (minimal) */}
      {successMessage && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
          <div className="toast show bg-success text-white" role="alert">
            <div className="toast-body">
              <i className="fas fa-check-circle me-2" />
              {successMessage}
            </div>
          </div>
        </div>
      )}

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <Modal
          show={showLoginPrompt}
          onClose={() => {
            setShowLoginPrompt(false);
            void storage.remove("pendingSync");
          }}
          title="Login Required"
        >
          <p>You need to login to sync your data.</p>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowLoginPrompt(false);
                void storage.remove("pendingSync");
              }}
            >
              Cancel
            </button>
            <a href="/login" className="btn btn-primary">
              Go to Login
            </a>
          </div>
        </Modal>
      )}

      {/* Conflict Resolution Modal */}
      {conflict && (
        <Modal
          show={true}
          onClose={() => setConflict(null)}
          title="Sync Conflict Detected"
        >
          <div>
            <p>
              The server data has been updated from another device.
              Select which version to keep:
            </p>

            <div className="alert alert-warning">
              <strong>Warning:</strong> The unselected version will be lost.
            </div>

            {/* Version Selection Cards with Radio Buttons */}
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <div
                  className={`card h-100 cursor-pointer ${
                    selectedResolution === "force-local" ? "border-primary border-2" : ""
                  }`}
                  onClick={() => setSelectedResolution("force-local")}
                  style={{ cursor: "pointer" }}
                >
                  <div className="card-body">
                    <div className="d-flex align-items-start gap-2 mb-2">
                      <input
                        type="radio"
                        className="form-check-input mt-1"
                        checked={selectedResolution === "force-local"}
                        onChange={() => setSelectedResolution("force-local")}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-grow-1">
                        <h6 className="card-title mb-0">Local Version</h6>
                      </div>
                    </div>
                    <p className="small text-muted mb-0">
                      Words: {conflict.localFile.words.length}
                      <br />
                      Updated:{" "}
                      {new Date(
                        conflict.localFile.updatedAt
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div
                  className={`card h-100 cursor-pointer ${
                    selectedResolution === "fetch-server" ? "border-primary border-2" : ""
                  }`}
                  onClick={() => setSelectedResolution("fetch-server")}
                  style={{ cursor: "pointer" }}
                >
                  <div className="card-body">
                    <div className="d-flex align-items-start gap-2 mb-2">
                      <input
                        type="radio"
                        className="form-check-input mt-1"
                        checked={selectedResolution === "fetch-server"}
                        onChange={() => setSelectedResolution("fetch-server")}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-grow-1">
                        <h6 className="card-title mb-0">Server Version</h6>
                      </div>
                    </div>
                    <p className="small text-muted mb-0">
                      Words: {conflict.serverData.file.words.length}
                      <br />
                      Updated:{" "}
                      {new Date(
                        conflict.serverData.updatedAt
                      ).toLocaleString()}
                      <br />
                      Client: {conflict.serverData.updatedByClientId.slice(0, 8)}...
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer mt-3">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConflict(null)}
                disabled={syncing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleResolveConflict}
                disabled={syncing}
              >
                {syncing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Resolving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check me-2" />
                    Resolve Conflict
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
