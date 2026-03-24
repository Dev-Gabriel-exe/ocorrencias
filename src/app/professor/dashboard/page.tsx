// src/app/professor/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { School, ClipboardList, CalendarDays, ChevronRight, AlertCircle } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function DashboardProfessor() {
  const session = await auth();
  const professorId = session!.user.id;

  // Busca turmas via ProfessorDisciplinaTurma
  const vinculos = await prisma.professorDisciplinaTurma.findMany({
    where: { professorId },
    select: { turmaId: true },
  });

  const turmaIds = [...new Set(vinculos.map((v) => v.turmaId))];

  const turmas = turmaIds.length > 0
    ? await prisma.turma.findMany({
        where: { id: { in: turmaIds }, ativa: true },
        include: { _count: { select: { alunos: true, ocorrencias: true } } },
        orderBy: [{ nivel: "asc" }, { nome: "asc" }],
      })
    : [];

  // Ocorrências de hoje
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  const ocorrenciasHoje = await prisma.ocorrencia.count({
    where: {
      professorId,
      data: { gte: hoje, lt: amanha },
    },
  });

  // Lembretes próximos (próximos 7 dias)
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
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {professor?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <School className="w-5 h-5 text-blue-500" />
            <span className="text-2xl font-bold text-gray-900">{turmas.length}</span>
          </div>
          <p className="text-sm text-gray-500">Turmas ativas</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <ClipboardList className="w-5 h-5 text-orange-500" />
            <span className="text-2xl font-bold text-gray-900">{ocorrenciasHoje}</span>
          </div>
          <p className="text-sm text-gray-500">Ocorrências hoje</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <CalendarDays className="w-5 h-5 text-purple-500" />
            <span className="text-2xl font-bold text-gray-900">{lembretes.length}</span>
          </div>
          <p className="text-sm text-gray-500">Lembretes próximos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Turmas */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Minhas Turmas</h2>

          {turmas.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <School className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Nenhuma turma atribuída ainda.</p>
              <p className="text-gray-400 text-xs mt-1">
                Aguarde a secretaria configurar suas turmas.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {turmas.map((turma) => (
                <Link
                  key={turma.id}
                  href={`/professor/turma/${turma.id}`}
                  className="block bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-100 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{turma.nome}</h3>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                          {turma.turno}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>{turma._count.alunos} alunos</span>
                        <span>{turma._count.ocorrencias} ocorrências</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Lembretes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Próximos Eventos</h2>
            <Link href="/professor/lembretes" className="text-sm text-blue-600 hover:underline">
              Ver todos
            </Link>
          </div>

          <div className="space-y-3">
            {lembretes.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                <CalendarDays className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Sem lembretes próximos</p>
                <Link href="/professor/lembretes" className="text-blue-600 text-xs hover:underline mt-1 block">
                  Adicionar lembrete
                </Link>
              </div>
            ) : (
              lembretes.map((l) => {
                const isHoje =
                  format(l.dataEvento, "yyyy-MM-dd") === format(hoje, "yyyy-MM-dd");
                return (
                  <div
                    key={l.id}
                    className={`bg-white rounded-xl border p-4 ${
                      isHoje ? "border-orange-200 bg-orange-50" : "border-gray-100"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {isHoje && (
                        <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{l.titulo}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {format(l.dataEvento, "dd/MM · HH:mm", { locale: ptBR })}
                          {isHoje && (
                            <span className="ml-1 text-orange-600 font-medium">Hoje!</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}