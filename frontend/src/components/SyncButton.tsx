/**
 * SyncButton component for offline-first vocabulary synchronization
 * 
 * Minimal sync button with unified status indicator
 */

import { useState, useEffect } from "react";
import { Modal } from "./Modal";
import {
  getSyncStatus,
  syncToServer,
  resolveConflict,
  type SyncStatus,
  type SyncConflict,
} from "../db/syncService";
import type { ConflictResolution } from "../db/types";
import { useAuth } from "../auth/AuthContext";

export default function SyncButton() {
  const { state } = useAuth();
  const isAuthenticated = state.status === "authed";
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [conflict, setConflict] = useState<SyncConflict | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Load sync status on mount and when authentication changes
  useEffect(() => {
    loadStatus();
  }, [isAuthenticated]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadStatus = async () => {
    try {
      const s = await getSyncStatus();
      setStatus(s);
    } catch (err: any) {
      console.error("Failed to load sync status:", err);
    }
  };

  const handleSync = async () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }

    setSyncing(true);
    setSuccessMessage(null);

    try {
      const result = await syncToServer();

      if (result.status === "success") {
        // Success
        await loadStatus();
        setSuccessMessage("Sync completed successfully");
      } else if (result.status === "conflict") {
        // Conflict - show resolution dialog
        setConflict(result);
      }
      // Errors are silently ignored in this minimal button
    } catch (err: any) {
      // Check if authentication error
      if (err.status === 401) {
        setShowLoginPrompt(true);
      }
      // Other errors are silently ignored
    } finally {
      setSyncing(false);
    }
  };

  const handleResolveConflict = async (strategy: ConflictResolution) => {
    setSyncing(true);
    setSuccessMessage(null);

    try {
      await resolveConflict(strategy);
      setConflict(null);
      await loadStatus();
      setSuccessMessage("Conflict resolved successfully");
    } catch (err: any) {
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
  const statusColor = status.dirty ? "warning" : status.online ? "success" : "secondary";
  const statusTitle = status.dirty 
    ? "Unsaved changes" 
    : status.online 
    ? "Online" 
    : "Offline";

  return (
    <>
      {/* Minimal sync button with unified status indicator */}
      <button
        className="btn btn-sm btn-outline-secondary position-relative"
        onClick={handleSync}
        disabled={syncing || !status.online}
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
          onClose={() => setShowLoginPrompt(false)}
          title="Login Required"
        >
          <p>You need to login to sync your data.</p>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowLoginPrompt(false)}
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
              Which version would you like to keep?
            </p>

            <div className="alert alert-warning">
              <strong>Warning:</strong> The unselected version will be lost.
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-body">
                    <h6 className="card-title">Local Version</h6>
                    <p className="small">
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
                <div className="card">
                  <div className="card-body">
                    <h6 className="card-title">Server Version</h6>
                    <p className="small">
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
                onClick={() => handleResolveConflict("fetch-server")}
                disabled={syncing}
              >
                Use Server Version
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleResolveConflict("force-local")}
                disabled={syncing}
              >
                Use Local Version
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
