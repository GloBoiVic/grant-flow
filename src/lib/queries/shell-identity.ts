import "server-only";

import type { AuthorizationContext } from "@/lib/clerk/authorization";
import { prisma } from "@/lib/prisma";

export interface ShellIdentityDto {
  organizationName: string;
  userName: string;
  userEmail: string;
  userAvatarUrl: string | null;
  userInitials: string;
}

export class ShellIdentityProjectionMissingError extends Error {
  constructor() {
    super("Shell identity projection is missing.");
    this.name = "ShellIdentityProjectionMissingError";
  }
}

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export async function getShellIdentity(
  authorization: AuthorizationContext,
): Promise<ShellIdentityDto> {
  const [organization, user] = await Promise.all([
    prisma.organization.findUnique({ where: { id: authorization.organizationId }, select: { name: true } }),
    prisma.user.findUnique({ where: { id: authorization.userId }, select: { name: true, email: true, avatarUrl: true } }),
  ]);
  if (!organization || !user) {
    throw new ShellIdentityProjectionMissingError();
  }

  return {
    organizationName: organization.name,
    userName: user.name,
    userEmail: user.email,
    userAvatarUrl: user.avatarUrl,
    userInitials: deriveInitials(user.name),
  };
}
