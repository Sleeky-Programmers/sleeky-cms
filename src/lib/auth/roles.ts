// CMS roles: safe to import from client components (no server code).
// Permissions for each role live in ./access.ts.
export const ROLES = ["admin", "editor"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  editor: "Editor",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: "Manages users and invites, plus everything editors can do.",
  editor: "Creates and edits content.",
};

export const isRole = (value: unknown): value is Role => ROLES.includes(value as Role);
