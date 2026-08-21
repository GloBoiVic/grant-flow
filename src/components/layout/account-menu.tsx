"use client";

import { useClerk } from "@clerk/nextjs";
import { LogOut, UserRound } from "lucide-react";
import { useState } from "react";

import type { ShellIdentityDto } from "@/lib/queries/shell-identity";
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

interface AccountMenuProps {
  identity: ShellIdentityDto;
}

export function AccountMenu({ identity }: AccountMenuProps): React.ReactNode {
  const { openUserProfile, signOut } = useClerk();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

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
            {identity.userAvatarUrl && <AvatarImage src={identity.userAvatarUrl} alt="" />}
            <AvatarFallback>{identity.userInitials}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 text-left">
            <span className="block truncate text-sm">{identity.userName}</span>
            <span className="block truncate text-caption text-muted-foreground">{identity.userEmail}</span>
          </span>
          <span className="sr-only">Open account menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-sm font-medium">{identity.userName}</span>
          <span className="block truncate text-caption text-muted-foreground">{identity.userEmail}</span>
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
