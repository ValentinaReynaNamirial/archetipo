import type { DevProfile, DevRole, DevSeniority } from "@prisma/client";

export function buildDevUrl(token: string, origin: string): string {
  const trimmed = origin.replace(/\/+$/, "");
  return `${trimmed}/dev/${encodeURIComponent(token)}`;
}

export function profileInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  const initials = parts.slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
  return initials || "?";
}

export function roleLabel(role: DevRole): string {
  return role === "frontend" ? "Frontend" : "Backend";
}

export function seniorityLabel(seniority: DevSeniority): string {
  return seniority === "junior" ? "Junior" : "Senior";
}

export function formatProfileDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

export type ProfileSummary = Pick<
  DevProfile,
  "id" | "name" | "role" | "seniority" | "accessToken" | "createdAt" | "archivedAt" | "isActive"
>;
