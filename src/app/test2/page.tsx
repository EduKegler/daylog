export default function Test2Page() {
  return (
    <pre>
      {JSON.stringify(
        {
          static: true,
          timestamp: new Date().toISOString(),
          message: "This page has no auth, no database, no middleware",
        },
        null,
        2,
      )}
    </pre>
  );
}
