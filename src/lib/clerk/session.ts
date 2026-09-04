import "server-only";

import { auth } from "@clerk/nextjs/server";

export type ClerkSession = {
  userId: string;
};

export type ClerkSessionState =
  | { authenticated: false; userId: null }
  | { authenticated: true; userId: string };

export async function getClerkSessionState(): Promise<ClerkSessionState> {
  const session = await auth();
  if (!session.userId) {
    return { authenticated: false, userId: null };
  }
  return { authenticated: true, userId: session.userId };
}

/** Read the current request's Clerk session. Never accepts caller-supplied scope. */
export async function getClerkSession(): Promise<ClerkSession | null> {
  const state = await getClerkSessionState();
  if (!state.authenticated) return null;

  return {
    userId: state.userId,
  };
}
