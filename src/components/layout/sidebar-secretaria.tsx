// src/components/layout/sidebar-secretaria.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Users, School, Tag, BarChart3, LogOut, BookOpen, ClipboardList, UserCog } from "lucide-react";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/secretaria/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/secretaria/ocorrencias", label: "Ocorrências", icon: ClipboardList, badge: true },
  { href: "/secretaria/turmas", label: "Turmas", icon: School },
  { href: "/secretaria/alunos", label: "Alunos", icon: Users },
  { href: "/secretaria/professores", label: "Professores", icon: UserCog },
  { href: "/secretaria/motivos", label: "Motivos", icon: Tag },
  { href: "/secretaria/relatorios", label: "Relatórios", icon: BarChart3 },
];

const roleLabel: Record<string, string> = {
  PROFESSOR: "Professor",
  SECRETARIA_GERAL: "Secretaria Geral",
  SECRETARIA_FUND1: "Secretaria Fund. I",
  SECRETARIA_FUND2: "Secretaria Fund. II",
};

const roleBadgeColor: Record<string, string> = {
  PROFESSOR: "bg-blue-100 text-blue-700",
  SECRETARIA_GERAL: "bg-purple-100 text-purple-700",
  SECRETARIA_FUND1: "bg-green-100 text-green-700",
  SECRETARIA_FUND2: "bg-orange-100 text-orange-700",
};

interface Props {
  user: { name?: string | null; email?: string | null; role: string };
}

export function SidebarSecretaria({ user }: Props) {
  const pathname = usePathname();
  const [naoVistas, setNaoVistas] = useState(0);

  useEffect(() => {
    async function buscar() {
      try {
        const res = await fetch("/api/ocorrencias?apenasNaoVistas=true");
        if (res.ok) setNaoVistas((await res.json()).length);
      } catch {}
    }
    buscar();
    const interval = setInterval(buscar, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-none">Ocorrências</p>
            <p className="text-xs text-gray-400 mt-0.5">Secretaria</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${active ? "bg-purple-50 text-purple-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
              <Icon className={`w-4 h-4 ${active ? "text-purple-600" : "text-gray-400"}`} />
              <span className="flex-1">{label}</span>
              {badge && naoVistas > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {naoVistas > 99 ? "99+" : naoVistas}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-bold text-sm">{user.name?.charAt(0) || "S"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadgeColor[user.role] || "bg-gray-100 text-gray-700"}`}>
            {roleLabel[user.role] || user.role}
          </span>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
          <LogOut className="w-4 h-4" /> Sair
        </button>
      </div>
    </aside>
  );
}