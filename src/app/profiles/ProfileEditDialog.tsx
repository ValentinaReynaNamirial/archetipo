"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { DevProfile } from "@prisma/client";
import { updateProfileAction, type ProfileActionResult } from "./actions";

const initial: ProfileActionResult | null = null;

export function ProfileEditDialog({
  profile,
  accessUrl,
  onClose,
}: {
  profile: DevProfile;
  accessUrl: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(updateProfileAction, initial);
  const [, startTransition] = useTransition();
  const [pending, setPending] = useState(false);

  const [name, setName] = useState(profile.name);
  const [role, setRole] = useState<"frontend" | "backend">(profile.role);
  const [seniority, setSeniority] = useState<"junior" | "senior">(profile.seniority);

  const fieldErrors = state?.ok === false ? state.fieldErrors : {};
  const nameError = fieldErrors.name;
  const formError = state?.ok === false ? state.formError : undefined;
  const blocking = !name.trim();

  useEffect(() => {
    if (state?.ok) {
      setPending(false);
      router.refresh();
      onClose();
    } else if (state) {
      setPending(false);
    }
  }, [state, router, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pending, onClose]);

  const onSubmit = (formData: FormData) => {
    setPending(true);
    startTransition(() => formAction(formData));
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Edit profile"
      onClick={() => !pending && onClose()}
    >
      <form className="modal" action={onSubmit} noValidate onClick={(e) => e.stopPropagation()}>
        <input type="hidden" name="id" value={profile.id} />
        <div className="modal-header">
          <div>
            <div className="modal-eyebrow">Edit profile</div>
            <div className="modal-title">{profile.name}</div>
          </div>
          <button
            type="button"
            className="icon-btn-x"
            onClick={onClose}
            disabled={pending}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label" htmlFor="editName">Full Name</label>
            <input
              id="editName"
              name="name"
              type="text"
              className={`form-input${nameError ? " error" : ""}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              required
            />
            {nameError && (
              <div className="field-error"><span>{nameError}</span></div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <div className="segmented">
              <input
                type="radio"
                name="role"
                id="edit-role-fe"
                value="frontend"
                checked={role === "frontend"}
                onChange={() => setRole("frontend")}
              />
              <label htmlFor="edit-role-fe">Frontend</label>
              <input
                type="radio"
                name="role"
                id="edit-role-be"
                value="backend"
                checked={role === "backend"}
                onChange={() => setRole("backend")}
              />
              <label htmlFor="edit-role-be">Backend</label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Seniority</label>
            <div className="segmented">
              <input
                type="radio"
                name="seniority"
                id="edit-sen-jr"
                value="junior"
                checked={seniority === "junior"}
                onChange={() => setSeniority("junior")}
              />
              <label htmlFor="edit-sen-jr">Junior</label>
              <input
                type="radio"
                name="seniority"
                id="edit-sen-sr"
                value="senior"
                checked={seniority === "senior"}
                onChange={() => setSeniority("senior")}
              />
              <label htmlFor="edit-sen-sr">Senior</label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Access URL{" "}
              <span style={{ color: "var(--text-muted)", fontStyle: "italic", fontFamily: "var(--font-body)", textTransform: "none", letterSpacing: 0 }}>
                — preserved across edits
              </span>
            </label>
            <div className="url-old" style={{ textDecoration: "none", color: "var(--text-secondary)" }}>
              {accessUrl}
            </div>
          </div>

          {formError && (
            <div className="error-banner" role="alert">
              <div>
                <div className="error-banner-title">Could not save changes</div>
                <div className="error-banner-msg">{formError}</div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={pending}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={blocking || pending}>
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
