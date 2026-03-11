import { getCurrentUser } from "@/lib/auth/session";
import { signOut } from "@/lib/auth";
import { NavMenu } from "@/app/components/nav-menu";
import { UserAvatar } from "@/app/components/user-avatar";
import { Text } from "@/app/components/text";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  return (
    <main className="max-w-[42rem] mx-auto py-8 px-6">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <Text variant="display" className="capitalize">profile</Text>
          <Text variant="subtext" className="mt-1 block">Your account</Text>
        </div>
        <NavMenu activePath="/profile" />
      </header>

      <div className="bg-white border border-border rounded-xl p-6">
        <div className="flex items-center gap-4">
          <UserAvatar name={user.name} image={user.image} size={48} />
          <div>
            {user.name && (
              <Text variant="body" className="font-medium">{user.name}</Text>
            )}
            {user.email && <Text variant="small" muted>{user.email}</Text>}
          </div>
        </div>

        <div className="flex items-center justify-between py-3 mt-4 border-t border-border">
          <span className="text-small text-muted">Timezone</span>
          <span className="text-small text-stone-900">{user.timezone}</span>
        </div>

        <div className="border-t border-border pt-3">
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="text-small text-red-600/70 transition-colors duration-200 hover:text-red-600"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
