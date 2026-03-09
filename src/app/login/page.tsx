import { signIn } from "@/lib/auth";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="font-display text-5xl text-stone-900 mb-2">Daylog</h1>
        <p className="text-stone-500 mb-10">Your daily task tracker</p>
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
