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

const shellIdentitySelect = {
  organizationId: true,
  organization: { select: { name: true } },
  user: { select: { name: true, email: true, avatarUrl: true } },
} as const;

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export async function getShellIdentity(
  authorization: AuthorizationContext,
): Promise<ShellIdentityDto> {
  const membership = await prisma.membership.findUnique({
    where: { userId: authorization.userId },
    select: shellIdentitySelect,
  });

  if (!membership || membership.organizationId !== authorization.organizationId) {
    throw new ShellIdentityProjectionMissingError();
  }

  return {
    organizationName: membership.organization.name,
    userName: membership.user.name,
    userEmail: membership.user.email,
    userAvatarUrl: membership.user.avatarUrl,
    userInitials: deriveInitials(membership.user.name),
  };
}
