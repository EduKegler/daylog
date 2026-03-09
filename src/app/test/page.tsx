import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function TestPage() {
  const results: Record<string, unknown> = {};

  // Test 1: Database connection
  try {
    const count = await prisma.user.count();
    results.database = { ok: true, userCount: count };
  } catch (error) {
    results.database = {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  // Test 2: auth() with PrismaAdapter
  try {
    const session = await auth();
    results.auth = {
      ok: true,
      hasSession: !!session,
      hasUser: !!session?.user?.id,
      userId: session?.user?.id ?? null,
    };
  } catch (error) {
    results.auth = {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : "Unknown",
    };
  }

  // Test 3: Environment
  results.env = {
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST ?? "NOT SET",
    DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT SET",
    NODE_ENV: process.env.NODE_ENV,
  };

  return <pre>{JSON.stringify(results, null, 2)}</pre>;
}
