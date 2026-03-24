// src/app/secretaria/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { School, Users, ClipboardList, Tag, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Nivel } from "@prisma/client";

function nivelFilter(role: string): Nivel[] | undefined {
  if (role === "SECRETARIA_FUND1") return ["FUND_I"];
  if (role === "SECRETARIA_FUND2") return ["FUND_II", "MEDIO"];
  return undefined;
}

export default async function DashboardSecretaria() {
  const session = await auth();
  const niveis = nivelFilter(session!.user.role);

  const turmasCount = await prisma.turma.count({
    where: { ativa: true, ...(niveis ? { nivel: { in: niveis } } : {}) },
  });
  const alunosCount = await prisma.aluno.count({
    where: {
      ativo: true,
      turma: { ativa: true, ...(niveis ? { nivel: { in: niveis } } : {}) },
    },
  });

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  const ocorrenciasHoje = await prisma.ocorrencia.count({
    where: {
      data: { gte: hoje, lt: amanha },
      turma: { ...(niveis ? { nivel: { in: niveis } } : {}) },
    },
  });

  const ocorrenciasRecentes = await prisma.ocorrencia.findMany({
  where: {
    turma: { ...(niveis ? { nivel: { in: niveis } } : {}), ativa: true },
    aluno: { ativo: true }, // CORREÇÃO: só alunos ativos
  },
  include: {
    aluno: { select: { nome: true } },
    turma: { select: { nome: true } },
    professor: { select: { name: true } },
    motivo: { select: { titulo: true, positivo: true } },
  },
  orderBy: { data: "desc" },
  take: 8,
});

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Painel da Secretaria</h1>
        <p className="text-gray-500 text-sm mt-1">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Turmas ativas", value: turmasCount, icon: School, color: "blue", href: "/secretaria/turmas" },
          { label: "Alunos ativos", value: alunosCount, icon: Users, color: "green", href: "/secretaria/alunos" },
          { label: "Ocorrências hoje", value: ocorrenciasHoje, icon: ClipboardList, color: "orange", href: "/secretaria/relatorios" },
        ].map(({ label, value, icon: Icon, color, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
              color === "blue" ? "bg-blue-50" : color === "green" ? "bg-green-50" : "bg-orange-50"
            }`}>
              <Icon className={`w-5 h-5 ${
                color === "blue" ? "text-blue-500" : color === "green" ? "text-green-500" : "text-orange-500"
              }`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </Link>
        ))}

        <Link
          href="/secretaria/motivos"
          className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-3">
            <Tag className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-sm font-medium text-purple-600">Gerenciar Motivos</p>
          <p className="text-xs text-gray-400 mt-0.5">Configurar ocorrências</p>
        </Link>
      </div>

      {/* Ocorrências recentes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Ocorrências Recentes</h2>
          <Link href="/secretaria/relatorios" className="text-sm text-blue-600 hover:underline">
            Ver relatórios
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {ocorrenciasRecentes.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <ClipboardList className="w-10 h-10 mx-auto mb-2 text-gray-200" />
              <p className="text-sm">Nenhuma ocorrência registrada ainda.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {ocorrenciasRecentes.map((o) => (
                <div key={o.id} className="px-6 py-4 flex items-start gap-4">
                  <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                    o.motivo?.positivo ? "bg-green-400" : "bg-red-400"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-gray-900">{o.aluno.nome}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-400">{o.turma.nome}</span>
                      {o.motivo && (
                        <>
                          <span className="text-xs text-gray-400">·</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                            o.motivo.positivo
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}>
                            {o.motivo.titulo}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{o.descricao}</p>
                  </div>
                  <span className="text-xs text-gray-300 flex-shrink-0">
                    {format(o.data, "dd/MM HH:mm")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
