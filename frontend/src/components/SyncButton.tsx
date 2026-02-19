/**
 * SyncButton component for offline-first vocabulary synchronization
 * 
 * Displays sync status and handles synchronization flow including conflict resolution
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
  const [error, setError] = useState<string | null>(null);
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
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await syncToServer();

      if (result.status === "success") {
        // Success
        await loadStatus();
        setError(null);
        setSuccessMessage("同期が完了しました");
      } else if (result.status === "conflict") {
        // Conflict - show resolution dialog
        setConflict(result);
      } else {
        // Error
        setError(result.message || "同期に失敗しました");
      }
    } catch (err: any) {
      // Check if authentication error
      if (err.status === 401) {
        setShowLoginPrompt(true);
      } else {
        setError(err.message || "同期に失敗しました");
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleResolveConflict = async (strategy: ConflictResolution) => {
    setSyncing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await resolveConflict(strategy);
      setConflict(null);
      await loadStatus();
      setSuccessMessage("競合を解決しました");
    } catch (err: any) {
      setError(err.message || "競合の解決に失敗しました");
    } finally {
      setSyncing(false);
    }
  };

  if (!status) {
    return null;
  }

  const formatLastSync = (lastSyncAt: string | null) => {
    if (!lastSyncAt) return "未同期";

    try {
      const date = new Date(lastSyncAt);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return "たった今";
      if (diffMins < 60) return `${diffMins}分前`;

      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}時間前`;

      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}日前`;
    } catch {
      return lastSyncAt;
    }
  };

  return (
    <>
      <div className="sync-panel border rounded p-3 bg-light">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div>
            <strong>同期状態</strong>
            <div className="small text-muted">
              {status.online ? (
                <span className="text-success">● オンライン</span>
              ) : (
                <span className="text-secondary">● オフライン</span>
              )}
            </div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSync}
            disabled={syncing || !status.online}
          >
            {syncing ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                同期中...
              </>
            ) : (
              <>
                <i className="fas fa-sync-alt me-2"></i>
                同期
              </>
            )}
          </button>
        </div>

        <div className="small">
          <div>
            最終同期: {formatLastSync(status.lastSyncAt)}
          </div>
          {status.dirty && (
            <div className="text-warning">
              <i className="fas fa-exclamation-circle me-1"></i>
              未同期の変更があります
            </div>
          )}
        </div>

        {error && (
          <div className="alert alert-danger mt-2 mb-0 py-2" role="alert">
            <small>{error}</small>
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success mt-2 mb-0 py-2" role="alert">
            <small>{successMessage}</small>
          </div>
        )}
      </div>

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <Modal
          show={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
          title="ログインが必要です"
        >
          <p>同期を行うにはログインが必要です。</p>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowLoginPrompt(false)}
            >
              キャンセル
            </button>
            <a href="/login" className="btn btn-primary">
              ログインページへ
            </a>
          </div>
        </Modal>
      )}

      {/* Conflict Resolution Modal */}
      {conflict && (
        <Modal
          show={true}
          onClose={() => setConflict(null)}
          title="競合が発生しました"
        >
          <div>
            <p>
              サーバー上のデータが別の端末から更新されています。
              どちらのバージョンを採用しますか？
            </p>

            <div className="alert alert-warning">
              <strong>注意:</strong> 選択しなかった方のデータは失われます。
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-body">
                    <h6 className="card-title">ローカル版</h6>
                    <p className="small">
                      単語数: {conflict.localFile.words.length}
                      <br />
                      更新日時:{" "}
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
                    <h6 className="card-title">サーバー版</h6>
                    <p className="small">
                      単語数: {conflict.serverData.file.words.length}
                      <br />
                      更新日時:{" "}
                      {new Date(
                        conflict.serverData.updatedAt
                      ).toLocaleString()}
                      <br />
                      更新元: {conflict.serverData.updatedByClientId.slice(0, 8)}...
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
                サーバー版を取得
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleResolveConflict("force-local")}
                disabled={syncing}
              >
                ローカル版で上書き
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
