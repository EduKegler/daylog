import type { Metadata } from "next";
import { DaylogIcon } from "../components/daylog-icon";
import { Text } from "../components/text";
import { signIn } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to Daylog — track your daily tasks, build streaks, and stay on top of what matters.",
  openGraph: {
    title: "Sign in to Daylog",
    description:
      "Track your daily tasks, build streaks, and stay on top of what matters.",
  },
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <DaylogIcon size={64} />
        </div>
        <Text variant="display" className="text-5xl mb-2">Daylog</Text>
        <Text variant="subtext" className="mb-10">Your daily task tracker</Text>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="px-6 py-3 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors duration-200"
          >
            Sign in with Google
          </button>
        </form>
      </div>
    </main>
  );
}
