import type { UserRole } from "@/types/database";

export type { UserRole };

export const ROLES: Record<Uppercase<UserRole>, UserRole> = {
  PUBLIC: "public",
  MEMBER: "member",
  MODERATOR: "moderator",
  ADMIN: "admin",
};

/** Role rank for "at least" comparisons (higher = more privileged). */
const RANK: Record<UserRole, number> = {
  public: 0,
  member: 1,
  moderator: 2,
  admin: 3,
};

/** True if `role` is at least `min` in the hierarchy. */
export function hasAtLeast(role: UserRole, min: UserRole): boolean {
  return RANK[role] >= RANK[min];
}

/** Roles allowed into the member portal. */
export const PORTAL_ROLES: UserRole[] = ["member", "moderator", "admin"];

/** Roles allowed into staff/admin areas (future phases). */
export const STAFF_ROLES: UserRole[] = ["moderator", "admin"];

/**
 * Declarative permission map — the app-layer source of truth.
 * Mirrored by RLS at the database layer.
 */
export const PERMISSIONS = {
  "profile:edit-own": ["member", "moderator", "admin"],
  "member:manage": ["admin"],
  "role:assign": ["admin"],
  "content:moderate": ["moderator", "admin"],
  "audit:read": ["admin"],
} as const satisfies Record<string, UserRole[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: UserRole, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly UserRole[]).includes(role);
}

/** Human-friendly role label. */
export function roleLabel(role: UserRole): string {
  return { public: "Public", member: "Member", moderator: "Moderator", admin: "Administrator" }[role];
}
