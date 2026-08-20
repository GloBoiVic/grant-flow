import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let event: unknown;
  try {
    event = await verifyWebhook(request);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  try {
    const { parseClerkWebhook } = await import("@/lib/clerk/webhook");
    const parsed = parseClerkWebhook(event);
    if (parsed === null) return new NextResponse(null, { status: 200 });
    // Keep the persistence boundary after Svix verification. This also keeps the
    // Prisma singleton out of rejected webhook requests.
    const [{ prisma }, { processClerkWebhook }] = await Promise.all([
      import("@/lib/prisma"),
      import("@/lib/clerk/webhook"),
    ]);
    const result = await processClerkWebhook(prisma, parsed);
    if (result?.status === "conflict") {
      // Conflicts are durable operator signals, not transient delivery failures.
      // Never return identity values or internal database details to Clerk.
      return NextResponse.json({ accepted: false, conflict: true }, { status: 200 });
    }
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    if (error instanceof SyntaxError || (error instanceof Error && error.message === "Malformed webhook")) {
      return NextResponse.json({ error: "Malformed webhook" }, { status: 400 });
    }
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Malformed webhook" }, { status: 400 });
    }
    if (error instanceof Error && (error.constructor.name === "MissingMembershipParentError")) {
      return NextResponse.json({ error: "Webhook dependencies unavailable" }, { status: 503 });
    }
    if (error instanceof Error && error.constructor.name === "MalformedIdentityPayloadError") {
      return NextResponse.json({ error: "Malformed webhook" }, { status: 400 });
    }
    if (error instanceof Error && error.constructor.name === "MembershipReconciliationUnavailableError") {
      return NextResponse.json({ error: "Webhook processing unavailable", retryable: true }, { status: 503 });
    }
    return NextResponse.json({ error: "Webhook processing unavailable" }, { status: 503 });
  }
}
