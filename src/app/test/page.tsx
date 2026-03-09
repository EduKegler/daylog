export const dynamic = "force-dynamic";

export default async function TestPage() {
  // Minimal dynamic page - no auth, no prisma
  return (
    <pre>
      {JSON.stringify(
        {
          ok: true,
          timestamp: new Date().toISOString(),
          message: "Dynamic page without auth or prisma",
        },
        null,
        2,
      )}
    </pre>
  );
}
