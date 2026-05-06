"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSprintAction, type CreateSprintResult } from "./actions";

const initialState: CreateSprintResult | null = null;

export function SprintForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(createSprintAction, initialState);
  const [, startTransition] = useTransition();
  const [pending, setPending] = useState(false);

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const clientDateError =
    startDate && endDate && startDate >= endDate ? "End date must be after start date" : undefined;
  const fieldErrors = state?.ok === false ? state.fieldErrors : {};
  const nameError = fieldErrors.name;
  const endDateError = clientDateError ?? fieldErrors.endDate;
  const startDateError = fieldErrors.startDate;
  const formError = state?.ok === false ? state.formError : undefined;

  const blocking = !!nameError || !!endDateError || !!startDateError || !name.trim() || !startDate || !endDate;

  useEffect(() => {
    if (state?.ok) router.push("/sprints");
  }, [state, router]);

  const onSubmit = (formData: FormData) => {
    setPending(true);
    startTransition(() => {
      formAction(formData);
    });
  };

  useEffect(() => {
    if (state) setPending(false);
  }, [state]);

  return (
    <form className="form-card anim-fade-up anim-delay-1" action={onSubmit} noValidate>
      <div className="form-card-header">
        <div className="eyebrow">Step · Configure</div>
        <h2>Open a new time window.</h2>
        <p className="lede">
          A sprint becomes <em>active</em> the moment its start date is reached. Until then, it sits in <em>upcoming</em>.
        </p>
      </div>

      <div className="form-stack">
        <div className="form-group">
          <label className="form-label" htmlFor="sprintName">
            Sprint Name <span style={{ color: "var(--accent)" }}>*</span>
          </label>
          <input
            id="sprintName"
            name="name"
            type="text"
            className={`form-input${nameError ? " error" : ""}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sprint 5 — Insights & Polish"
            aria-invalid={!!nameError}
            aria-describedby={nameError ? "nameError" : undefined}
            maxLength={120}
            required
          />
          {nameError ? (
            <div className="field-error" id="nameError">
              <ErrorIcon />
              <span>{nameError}</span>
            </div>
          ) : (
            <div className="form-helper">Pick something memorable — it shows up everywhere your team works.</div>
          )}
        </div>

        <div>
          <div className="date-row">
            <div className="form-group">
              <label className="form-label" htmlFor="startDate">
                Start Date <span style={{ color: "var(--accent)" }}>*</span>
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                className={`form-input${startDateError ? " error" : ""}`}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="date-arrow-cell">→</div>

            <div className="form-group">
              <label className="form-label" htmlFor="endDate">
                End Date <span style={{ color: "var(--accent)" }}>*</span>
              </label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                className={`form-input${endDateError ? " error" : ""}`}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                aria-invalid={!!endDateError}
                aria-describedby={endDateError ? "endDateError" : undefined}
                required
              />
              {endDateError && (
                <div className="field-error" id="endDateError">
                  <ErrorIcon />
                  <span>{endDateError}</span>
                </div>
              )}
            </div>
          </div>

          {clientDateError && (
            <div className="error-banner" role="alert">
              <svg
                width="18"
                height="18"
                viewBox="0 0 16 16"
                fill="none"
                stroke="var(--red)"
                strokeWidth="1.5"
                style={{ flexShrink: 0, marginTop: 1 }}
              >
                <path d="M8 1l7 13H1L8 1z" />
                <path d="M8 6v3.5M8 11.5v.5" strokeLinecap="round" />
              </svg>
              <div>
                <div className="error-banner-title">Invalid date range</div>
                <div className="error-banner-msg">
                  The end date is before the start date. Adjust either date so the sprint covers at least one day.
                </div>
              </div>
            </div>
          )}

          {formError && (
            <div className="error-banner" role="alert" style={{ marginTop: "var(--spacing-md)" }}>
              <div>
                <div className="error-banner-title">Could not create sprint</div>
                <div className="error-banner-msg">{formError}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="form-footer">
        <div className="left">
          <span className={`live-dot${blocking ? " error" : ""}`} />
          <span>{blocking ? "Resolve issues to save" : "Ready to save"}</span>
        </div>
        <div className="actions">
          <Link href="/sprints" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={blocking || pending}>
            {pending ? "Creating…" : "Create Sprint"}
          </button>
        </div>
      </div>
    </form>
  );
}

function ErrorIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="7" />
      <path d="M8 4v5M8 11.5v.5" strokeLinecap="round" />
    </svg>
  );
}
