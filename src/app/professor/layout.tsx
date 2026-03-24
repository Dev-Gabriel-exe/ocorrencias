// src/app/professor/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SidebarProfessor } from "@/components/layout/sidebar-professor";

export default async function ProfessorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || session.user.role !== "PROFESSOR") {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarProfessor user={session.user} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
