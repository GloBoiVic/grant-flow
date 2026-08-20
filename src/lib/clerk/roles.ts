/**
 * Local role model (GF-AUTH-001).
 *
 * Mirrors the `MembershipRole` enum in `prisma/schema.prisma` as a committed,
 * environment/DB-independent module. The Prisma-generated client lives under
 * `src/generated/` (gitignored) and requires `DATABASE_URL` to generate, so
 * code that only needs the role values — including tests — must not import
 * from `@/generated/prisma/*`.
 *
 * Keep the values in sync with the `MembershipRole` enum in
 * `prisma/schema.prisma`.
 */
export const MembershipRole = {
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
  VIEWER: "VIEWER",
} as const;

export type MembershipRole = (typeof MembershipRole)[keyof typeof MembershipRole];

export type ClerkOrganizationRole = string | null | undefined;

/** Map the Clerk role vocabulary to the deliberately smaller local vocabulary. */
export function mapClerkRole(role: ClerkOrganizationRole): MembershipRole | null {
  if (role === "org:admin") return MembershipRole.ADMIN;
  if (role === "org:member") return MembershipRole.MEMBER;
  return null;
}

export function isRecognizedClerkRole(role: ClerkOrganizationRole): role is "org:admin" | "org:member" {
  return role === "org:admin" || role === "org:member";
}

export function isRoleAtLeast(
  actual: MembershipRole,
  required: MembershipRole,
): boolean {
  const rank: Record<MembershipRole, number> = {
    VIEWER: 0,
    MEMBER: 1,
    ADMIN: 2,
  };
  return rank[actual] >= rank[required];
}
