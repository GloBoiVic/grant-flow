export const ClerkRole = {
  ADMIN: "org:admin",
  MEMBER: "org:member",
} as const;

export type ClerkRole = (typeof ClerkRole)[keyof typeof ClerkRole];

export function isRecognizedClerkRole(role: string | null | undefined): role is ClerkRole {
  return role === ClerkRole.ADMIN || role === ClerkRole.MEMBER;
}

export function isRoleAtLeast(actual: ClerkRole, required: ClerkRole): boolean {
  if (required === ClerkRole.MEMBER) return true;
  return actual === ClerkRole.ADMIN;
}
