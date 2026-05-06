"use client";

import { useState } from "react";
import type { DevProfile } from "@prisma/client";
import {
  buildDevUrl,
  formatProfileDate,
  profileInitials,
  roleLabel,
  seniorityLabel,
} from "@/lib/profile";
import { ProfileEditDialog } from "./ProfileEditDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { CopyLinkButton } from "./CopyLinkButton";
import {
  regenerateTokenAction,
  softDeleteProfileAction,
} from "./actions";

type Pending = { kind: "edit" | "regenerate" | "archive"; profile: DevProfile } | null;

export function ProfileList({ profiles, origin }: { profiles: DevProfile[]; origin: string }) {
  const [pending, setPending] = useState<Pending>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const close = () => setPending(null);

  const onConfirmRegenerate = async () => {
    if (pending?.kind !== "regenerate") return;
    setBusyId(pending.profile.id);
    setError(null);
    const result = await regenerateTokenAction(pending.profile.id);
    setBusyId(null);
    if (!result.ok) {
      setError(result.formError ?? "Failed to regenerate token.");
      return;
    }
    close();
  };

  const onConfirmArchive = async () => {
    if (pending?.kind !== "archive") return;
    setBusyId(pending.profile.id);
    setError(null);
    const result = await softDeleteProfileAction(pending.profile.id);
    setBusyId(null);
    if (!result.ok) {
      setError(result.formError ?? "Failed to archive profile.");
      return;
    }
    close();
  };

  if (profiles.length === 0) {
    return (
      <div className="profile-empty">
        <div className="t-eyebrow">No profiles yet</div>
        <h2>Mint your first developer link.</h2>
        <p>Use the form on the left to create a profile. Each one gets a unique URL you can share.</p>
      </div>
    );
  }

  return (
    <div className="profile-list">
      {profiles.map((p) => {
        const url = buildDevUrl(p.accessToken, origin);
        const isBusy = busyId === p.id;
        return (
          <div className="profile-card" key={p.id} data-testid="profile-card" data-profile-id={p.id}>
            <div className={`profile-avatar role-${p.role}`}>{profileInitials(p.name)}</div>
            <div>
              <div className="profile-head">
                <div>
                  <div className="profile-name">{p.name}</div>
                  <div className="profile-meta">
                    <span className={`badge ${p.role === "frontend" ? "badge-blue" : "badge-accent"}`}>
                      {roleLabel(p.role)}
                    </span>
                    <span className={`badge ${p.seniority === "senior" ? "badge-green" : "badge-yellow"}`}>
                      {seniorityLabel(p.seniority)}
                    </span>
                  </div>
                </div>
                <span
                  className="t-tiny t-very-muted"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Created {formatProfileDate(p.createdAt)}
                </span>
              </div>

              <div className="url-row">
                <div className="url-text" data-testid="profile-url">
                  <span className="url-host">{originHost(origin)}/dev/</span>
                  <span className="url-token">{p.accessToken}</span>
                </div>
                <CopyLinkButton url={url} />
              </div>

              <div className="profile-actions">
                <button
                  type="button"
                  className="action-btn"
                  onClick={() => setPending({ kind: "edit", profile: p })}
                  disabled={isBusy}
                >
                  <EditIcon /> Edit
                </button>
                <button
                  type="button"
                  className="action-btn warn"
                  onClick={() => setPending({ kind: "regenerate", profile: p })}
                  disabled={isBusy}
                >
                  <RotateIcon /> Regenerate token
                </button>
                <button
                  type="button"
                  className="action-btn danger"
                  onClick={() => setPending({ kind: "archive", profile: p })}
                  disabled={isBusy}
                >
                  <ArchiveIcon /> Archive
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {pending?.kind === "edit" && (
        <ProfileEditDialog
          profile={pending.profile}
          accessUrl={buildDevUrl(pending.profile.accessToken, origin)}
          onClose={close}
        />
      )}

      {pending?.kind === "regenerate" && (
        <ConfirmDialog
          variant="warn"
          eyebrow="Token rotation"
          title="Regenerate access token?"
          confirmLabel="Regenerate token"
          confirmIcon={<RotateIcon />}
          busy={busyId === pending.profile.id}
          error={error}
          onCancel={close}
          onConfirm={onConfirmRegenerate}
        >
          <p className="modal-text">
            You&apos;re about to mint a new private link for <b>{pending.profile.name}</b>. The current URL will{" "}
            <b>stop working immediately</b> and the developer will lose access until you share the new one.
          </p>
          <div>
            <div className="t-tiny t-very-muted" style={{ marginBottom: 6 }}>Current</div>
            <div className="url-old">{buildDevUrl(pending.profile.accessToken, origin)}</div>
            <div className="swap-arrow">↓ replaced by</div>
            <div className="url-new">{originHost(origin)}/dev/{`{new-uuid-will-be-generated}`}</div>
          </div>
        </ConfirmDialog>
      )}

      {pending?.kind === "archive" && (
        <ConfirmDialog
          variant="danger"
          eyebrow="Soft delete"
          title={`Archive ${pending.profile.name}?`}
          confirmLabel="Archive profile"
          confirmIcon={<ArchiveIcon />}
          busy={busyId === pending.profile.id}
          error={error}
          onCancel={close}
          onConfirm={onConfirmArchive}
        >
          <p className="modal-text">
            Archiving moves the profile to <b>read-only history</b>. The link goes dark right away, but every past
            commitment, check-in and retrospective is preserved.
          </p>
          <div className="consequences">
            <div className="consequences-label">What changes</div>
            <ul>
              <li className="bad"><CrossIcon /> Personal URL stops working immediately</li>
              <li className="bad"><CrossIcon /> Removed from task assignment dropdowns</li>
              <li className="good"><CheckIcon /> Past commitments, retros and history are preserved</li>
              <li className="good"><CheckIcon /> Visible in the <b>Archived</b> tab</li>
            </ul>
          </div>
        </ConfirmDialog>
      )}
    </div>
  );
}

function originHost(origin: string): string {
  try {
    return new URL(origin).host;
  } catch {
    return origin.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  }
}

function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M11 2l3 3-9 9H2v-3L11 2z" />
    </svg>
  );
}

function RotateIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 8a6 6 0 0110-4.5M14 8a6 6 0 01-10 4.5" />
      <path d="M11 1v3h-3M5 15v-3h3" />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="12" height="3" rx="1" />
      <path d="M3 6v7a1 1 0 001 1h8a1 1 0 001-1V6M6 9h4" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3l10 10M13 3L3 13" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 8.5L6.5 12L13 4.5" />
    </svg>
  );
}
