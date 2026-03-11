import { Text } from "./text";

export function FieldError({
  message,
}: {
  message?: string;
}): React.ReactElement | null {
  if (!message) return null;

  return (
    <Text variant="small" className="text-red-600 mt-1">
      {message}
    </Text>
  );
}
