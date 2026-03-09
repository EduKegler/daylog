import { auth } from "@/lib/auth";

export default async function TestPage() {
  const session = await auth();
  return (
    <pre>
      {JSON.stringify(
        {
          hasSession: !!session,
          hasUser: !!session?.user?.id,
          userId: session?.user?.id ?? null,
        },
        null,
        2
      )}
    </pre>
  );
}
