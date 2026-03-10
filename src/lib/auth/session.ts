import { cache } from "react";
import { auth } from "./index";

export const getCurrentUser = cache(async () => {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  return session.user;
});

export const getOptionalUser = cache(async () => {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return session.user;
});
