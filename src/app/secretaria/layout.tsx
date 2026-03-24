// src/app/secretaria/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SidebarSecretaria } from "@/components/layout/sidebar-secretaria";

export default async function SecretariaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (
    !session ||
    session.user.role === "PROFESSOR"
  ) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarSecretaria user={session.user} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
