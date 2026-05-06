"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProfileAction, type ProfileActionResult } from "./actions";

const initial: ProfileActionResult | null = null;

export function ProfileForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(createProfileAction, initial);
  const [, startTransition] = useTransition();
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  const [name, setName] = useState("");
  const [role, setRole] = useState<"frontend" | "backend">("frontend");
  const [seniority, setSeniority] = useState<"junior" | "senior">("junior");

  const fieldErrors = state?.ok === false ? state.fieldErrors : {};
  const nameError = fieldErrors.name;
  const formError = state?.ok === false ? state.formError : undefined;

  const onSubmit = (formData: FormData) => {
    setPending(true);
    startTransition(() => formAction(formData));
  };

  useEffect(() => {
    if (state?.ok) {
      setName("");
      setRole("frontend");
      setSeniority("junior");
      formRef.current?.reset();
      setPending(false);
      router.refresh();
    } else if (state) {
      setPending(false);
    }
  }, [state, router]);

  const blocking = !name.trim();

  return (
    <form ref={formRef} className="form-stack-tight" action={onSubmit} noValidate>
      <div className="form-group">
        <label className="form-label" htmlFor="profileName">Full Name</label>
        <input
          id="profileName"
          name="name"
          type="text"
          className={`form-input${nameError ? " error" : ""}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Anna Moretti"
          maxLength={120}
          aria-invalid={!!nameError}
          aria-describedby={nameError ? "profileNameError" : undefined}
          required
        />
        {nameError && (
          <div className="field-error" id="profileNameError">
            <ErrorIcon />
            <span>{nameError}</span>
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Role</label>
        <div className="segmented">
          <input
            type="radio"
            name="role"
            id="role-fe"
            value="frontend"
            checked={role === "frontend"}
            onChange={() => setRole("frontend")}
          />
          <label htmlFor="role-fe">Frontend</label>
          <input
            type="radio"
            name="role"
            id="role-be"
            value="backend"
            checked={role === "backend"}
            onChange={() => setRole("backend")}
          />
          <label htmlFor="role-be">Backend</label>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Seniority</label>
        <div className="segmented">
          <input
            type="radio"
            name="seniority"
            id="sen-jr"
            value="junior"
            checked={seniority === "junior"}
            onChange={() => setSeniority("junior")}
          />
          <label htmlFor="sen-jr">Junior</label>
          <input
            type="radio"
            name="seniority"
            id="sen-sr"
            value="senior"
            checked={seniority === "senior"}
            onChange={() => setSeniority("senior")}
          />
          <label htmlFor="sen-sr">Senior</label>
        </div>
      </div>

      {formError && (
        <div className="error-banner" role="alert">
          <div>
            <div className="error-banner-title">Could not create profile</div>
            <div className="error-banner-msg">{formError}</div>
          </div>
        </div>
      )}

      <div className="form-actions">
        <button
          type="reset"
          className="btn btn-secondary btn-sm"
          onClick={() => {
            setName("");
            setRole("frontend");
            setSeniority("junior");
          }}
          disabled={pending}
        >
          Reset
        </button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={blocking || pending}>
          {pending ? "Generating…" : "Generate Profile"}
        </button>
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
