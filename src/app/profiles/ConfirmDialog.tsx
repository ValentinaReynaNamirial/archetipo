"use client";

import { useEffect, type ReactNode } from "react";

export function ConfirmDialog({
  variant,
  eyebrow,
  title,
  children,
  confirmLabel,
  confirmIcon,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  variant: "danger" | "warn";
  eyebrow: string;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  confirmIcon?: ReactNode;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  const confirmClass = variant === "danger" ? "btn btn-danger" : "btn btn-warn";

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={title} onClick={() => !busy && onCancel()}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-eyebrow">{eyebrow}</div>
            <div className="modal-title">{title}</div>
          </div>
          <button type="button" className="icon-btn-x" onClick={onCancel} disabled={busy} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className={variant === "danger" ? "danger-icon" : "warn-icon"}>
            {variant === "danger" ? (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="4" rx="1" />
                <path d="M5 8v11a1 1 0 001 1h12a1 1 0 001-1V8M9 12h6" />
              </svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 12a9 9 0 0115-6.7M21 12a9 9 0 01-15 6.7" />
                <path d="M16 3v4h-4M8 21v-4h4" />
              </svg>
            )}
          </div>
          {children}
          {error && (
            <div className="error-banner" role="alert">
              <div>
                <div className="error-banner-title">Action failed</div>
                <div className="error-banner-msg">{error}</div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className={confirmClass} onClick={onConfirm} disabled={busy}>
            {confirmIcon}
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
