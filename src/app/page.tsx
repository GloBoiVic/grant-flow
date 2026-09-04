import { redirect } from "next/navigation";

import { resolveAuthorization } from "@/lib/clerk/authorization";

export default async function Home(): Promise<never> {
  const authorization = await resolveAuthorization();
  if (authorization.status === "unauthenticated") {
    redirect("/login");
  }
  redirect(authorization.status === "authenticated" ? "/dashboard" : "/organization");
}
