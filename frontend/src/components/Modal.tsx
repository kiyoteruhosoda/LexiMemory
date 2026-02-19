// frontend/src/components/Modal.tsx

import { useEffect, useRef } from "react";

type ModalProps = {
  show: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "lg" | "xl";
};

export function Modal({ show, onClose, title, children, size }: ModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (show) {
      document.body.classList.add("modal-open");
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = "0px";
    } else {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
    return () => {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [show]);

  if (!show) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) {
      onClose();
    }
  };

  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        ref={backdropRef}
        onClick={handleBackdropClick}
      >
        <div className={`modal-dialog modal-dialog-centered ${size ? `modal-${size}` : ""}`}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
              />
            </div>
            <div className="modal-body">{children}</div>
          </div>
        </div>
      </div>
    </>
  );
}

type ConfirmModalProps = {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "primary";
};

export function ConfirmModal({
  show,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "OK",
  cancelText = "Cancel",
  variant = "primary",
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal show={show} onClose={onClose} title={title}>
      <p className="mb-0">{message}</p>
      <div className="d-flex gap-2 justify-content-end mt-3">
        <button className="btn btn-outline-secondary" onClick={onClose}>
          {cancelText}
        </button>
        <button className={`btn btn-${variant}`} onClick={handleConfirm}>
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
