"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { LogOut, UserRound } from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "GF";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function AccountMenu(): React.ReactNode {
  const { openUserProfile, signOut } = useClerk();
  const { isLoaded, user } = useUser();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const userName = isLoaded ? user?.fullName ?? user?.username ?? "GrantFlow user" : "GrantFlow user";
  const userEmail = isLoaded ? user?.primaryEmailAddress?.emailAddress ?? "" : "";
  const userAvatarUrl = isLoaded ? user?.imageUrl ?? null : null;

  async function handleSignOut(): Promise<void> {
    if (isSigningOut) return;
    setIsSigningOut(true);
    setSignOutError(null);
    try {
      await signOut({ redirectUrl: "/login" });
    } catch {
      setIsSigningOut(false);
      setSignOutError("Sign out failed. Please try again.");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="max-w-full justify-start px-2">
          <Avatar size="sm" aria-hidden="true">
            {userAvatarUrl && <AvatarImage src={userAvatarUrl} alt="" />}
            <AvatarFallback>{initials(userName)}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 text-left">
             <span className="block truncate text-sm">{userName}</span>
             <span className="block truncate text-caption text-muted-foreground">{userEmail}</span>
          </span>
          <span className="sr-only">Open account menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
           <span className="block truncate text-sm font-medium">{userName}</span>
           <span className="block truncate text-caption text-muted-foreground">{userEmail}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => openUserProfile()}>
          <UserRound aria-hidden="true" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isSigningOut}
          onSelect={(event) => {
            event.preventDefault();
            void handleSignOut();
          }}
        >
          <LogOut aria-hidden="true" />
          {isSigningOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
        {signOutError && <p role="status" className="px-2 py-1 text-caption text-destructive">{signOutError}</p>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
