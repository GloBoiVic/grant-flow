import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home(): Promise<never> {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect("/login");
  }

  redirect(orgId ? "/dashboard" : "/organization");
}
