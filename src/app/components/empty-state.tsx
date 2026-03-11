import { Text } from "./text";

export function EmptyState({
  illustration,
  title,
  description,
}: {
  illustration: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center py-8">
      <div className="mb-4 text-border" aria-hidden="true">
        {illustration}
      </div>
      <Text variant="subtext" className="font-medium">
        {title}
      </Text>
      <Text variant="small" muted className="mt-1 max-w-[20rem]">
        {description}
      </Text>
    </div>
  );
}
