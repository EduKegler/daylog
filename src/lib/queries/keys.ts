export const queryKeys = {
  daily: () => ["tasks", "daily"] as const,
  recurring: () => ["tasks", "recurring"] as const,
  upcoming: () => ["tasks", "upcoming"] as const,
  history: (page: number) => ["tasks", "history", page] as const,
  tags: () => ["tags"] as const,
};
