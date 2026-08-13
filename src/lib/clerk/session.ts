import "server-only";

import { auth } from "@clerk/nextjs/server";

export type ClerkSession = {
  userId: string;
  orgId: string;
  orgRole: string | null | undefined;
};

export type ClerkSessionState =
  | { authenticated: false; userId: null; orgId: null; orgRole: null }
  | { authenticated: true; userId: string; orgId: string; orgRole: string | null | undefined }
  | { authenticated: true; userId: string; orgId: null; orgRole: string | null | undefined };

export async function getClerkSessionState(): Promise<ClerkSessionState> {
  const session = await auth();
  if (!session.userId) {
    return { authenticated: false, userId: null, orgId: null, orgRole: null };
  }
  if (!session.orgId) {
    return { authenticated: true, userId: session.userId, orgId: null, orgRole: session.orgRole };
  }
  return { authenticated: true, userId: session.userId, orgId: session.orgId, orgRole: session.orgRole };
}

/** Read the current request's Clerk session. Never accepts caller-supplied scope. */
export async function getClerkSession(): Promise<ClerkSession | null> {
  const state = await getClerkSessionState();
  if (!state.authenticated || !state.orgId) return null;

  return {
    userId: state.userId,
    orgId: state.orgId,
    orgRole: state.orgRole,
  };
}
