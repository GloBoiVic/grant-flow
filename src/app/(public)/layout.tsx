import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps): ReactNode {
  return <ClerkProvider>{children}</ClerkProvider>;
}
