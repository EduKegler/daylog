import { auth } from "./index";

export async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  return session.user;
}

export async function getOptionalUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return session.user;
}
