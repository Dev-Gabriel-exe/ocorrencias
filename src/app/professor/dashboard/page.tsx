// src/app/professor/dashboard/page.tsx

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  School,
  ClipboardList,
  CalendarDays,
  ChevronRight,
  AlertCircle,
  Users,
  TrendingUp,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

/* ---------------- SORT ---------------- */
function ordenarTurmas(turmas: any[]) {
  return turmas.sort((a, b) => {
    const parse = (nome: string) => {
      const match = nome.match(/(\d+).*\s([A-Z])/i);
      return {
        numero: match ? parseInt(match[1]) : 0,
        letra: match ? match[2] : "",
      };
    };

    const A = parse(a.nome);
    const B = parse(b.nome);

    if (A.numero !== B.numero) return A.numero - B.numero;
    return A.letra.localeCompare(B.letra);
  });
}

export default async function DashboardProfessor() {
  const session = await auth();
  const professorId = session!.user.id;

  const vinculos = await prisma.professorDisciplinaTurma.findMany({
    where: { professorId },
    select: { turmaId: true },
  });

  const turmaIds = [...new Set(vinculos.map((v) => v.turmaId))];

  let turmas = turmaIds.length
    ? await prisma.turma.findMany({
        where: { id: { in: turmaIds }, ativa: true },
        include: { _count: { select: { alunos: true, ocorrencias: true } } },
      })
    : [];

  turmas = ordenarTurmas(turmas);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const ocorrenciasHoje = await prisma.ocorrencia.count({
    where: {
      professorId,
      data: { gte: hoje, lt: addDays(hoje, 1) },
      aluno: { ativo: true },
    },
  });

  const lembretes = await prisma.lembrete.findMany({
    where: {
      professorId,
      concluido: false,
      dataEvento: { gte: hoje, lte: addDays(hoje, 7) },
    },
    orderBy: { dataEvento: "asc" },
    take: 5,
  });

  const professor = await prisma.user.findUnique({
    where: { id: professorId },
    select: { name: true },
  });

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">
              Olá, {professor?.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-sm opacity-80">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>

          <Link
            href="/professor/ocorrencias/massa"
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm flex items-center gap-2 transition"
          >
            <Users className="w-4 h-4" />
            Ocorrência em Massa
          </Link>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<School />} value={turmas.length} label="Turmas" />
        <StatCard icon={<ClipboardList />} value={ocorrenciasHoje} label="Hoje" />
        <StatCard icon={<CalendarDays />} value={lembretes.length} label="Eventos" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TURMAS */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Minhas Turmas
          </h2>

          {turmas.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {turmas.map((turma) => {
                const engagement =
                  turma._count.alunos > 0
                    ? Math.min(
                        100,
                        (turma._count.ocorrencias /
                          turma._count.alunos /
                          5) *
                          100
                      )
                    : 0;

                const status =
                  engagement > 70
                    ? "bg-green-100 text-green-700"
                    : engagement > 40
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-600";

                return (
                  <Link
                    key={turma.id}
                    href={`/professor/turma/${turma.id}`}
                    className="group relative bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all"
                  >
                    {/* hover glow */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/10 group-hover:to-indigo-500/10 transition" />

                    <div className="relative">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {turma.nome}
                        </h3>
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500" />
                      </div>

                      <p className="text-xs text-gray-400 mb-3">
                        {turma.turno} · {turma._count.alunos} alunos
                      </p>

                      {/* progress */}
                      <div className="mb-2">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                            style={{ width: `${engagement}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">
                          {turma._count.ocorrencias} ocorrências
                        </span>
                        <span className={`px-2 py-0.5 rounded-full ${status}`}>
                          {Math.round(engagement)}%
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* LEMBRETES */}
        <div className="space-y-4">
          <div className="flex justify-between">
            <h2 className="text-lg font-semibold">Eventos</h2>
            <Link href="/professor/lembretes" className="text-blue-600 text-sm">
              Ver
            </Link>
          </div>

          {lembretes.length === 0 ? (
            <EmptyLembrete />
          ) : (
            lembretes.map((l) => {
              const isHoje =
                format(l.dataEvento, "yyyy-MM-dd") ===
                format(hoje, "yyyy-MM-dd");

              return (
                <div
                  key={l.id}
                  className={`p-4 rounded-xl border transition ${
                    isHoje
                      ? "bg-orange-50 border-orange-200"
                      : "bg-white border-gray-100 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {isHoje && (
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                    )}
                    <p className="text-sm font-medium">{l.titulo}</p>
                  </div>

                  <p className="text-xs text-gray-400">
                    {format(l.dataEvento, "dd/MM · HH:mm", {
                      locale: ptBR,
                    })}
                  </p>

                  {isHoje && (
                    <span className="text-xs text-orange-600 font-medium">
                      Hoje
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

/* COMPONENTES */

function StatCard({ icon, value, label }: any) {
  return (
    <div className="bg-white rounded-2xl p-5 border shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-center">
        <div className="p-2 rounded-xl bg-gray-100">{icon}</div>
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="text-sm text-gray-400 mt-2">{label}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white p-8 rounded-2xl border text-center">
      <School className="w-10 h-10 mx-auto text-gray-300 mb-2" />
      <p className="text-gray-500 text-sm">Sem turmas ainda</p>
    </div>
  );
}

function EmptyLembrete() {
  return (
    <div className="bg-white p-6 rounded-2xl border text-center">
      <CalendarDays className="w-8 h-8 mx-auto text-gray-300 mb-2" />
      <p className="text-gray-400 text-sm">Sem eventos</p>
    </div>
  );
}