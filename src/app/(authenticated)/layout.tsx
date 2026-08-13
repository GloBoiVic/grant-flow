import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps): ReactNode {
  return <ClerkProvider>{children}</ClerkProvider>;
}
