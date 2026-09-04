import "server-only";

import type { AuthorizationContext } from "@/lib/clerk/authorization";
import { prisma } from "@/lib/prisma";

export interface ShellIdentityDto {
  organizationName: string;
}

export class ShellOrganizationMissingError extends Error {
  constructor() {
    super("Shell organization is missing.");
    this.name = "ShellOrganizationMissingError";
  }
}

export async function getShellIdentity(
  authorization: AuthorizationContext,
): Promise<ShellIdentityDto> {
  const organization = await prisma.organization.findUnique({
    where: { id: authorization.organizationId },
    select: { name: true },
  });
  if (!organization) throw new ShellOrganizationMissingError();
  return { organizationName: organization.name };
}
