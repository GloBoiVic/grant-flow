import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function verifyPrisma(): Promise<void> {
  let prisma: PrismaClient | undefined;

  try {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error("DATABASE_URL must be set to use Prisma.");
    }

    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString }),
    });
    await prisma.organization.findFirst({ select: { id: true } });
    await prisma.$disconnect();
    console.log("✅ Connected");
  } catch (error: unknown) {
    await prisma?.$disconnect().catch(() => undefined);
    console.error(error);
    process.exitCode = 1;
  }
}

void verifyPrisma();
