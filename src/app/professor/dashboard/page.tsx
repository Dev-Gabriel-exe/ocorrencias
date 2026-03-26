// src/app/professor/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  School, ClipboardList, CalendarDays,
  ChevronRight, AlertCircle, Users, BookOpen,
  TrendingUp, Star,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

function ordenarTurmas(turmas: any[]) {
  return turmas.sort((a, b) => {
    const parse = (nome: string) => {
      const match = nome.match(/(\d+).*\s([A-Z])/i);
      return { numero: match ? parseInt(match[1]) : 0, letra: match ? match[2] : "" };
    };
    const A = parse(a.nome), B = parse(b.nome);
    if (A.numero !== B.numero) return A.numero - B.numero;
    return A.letra.localeCompare(B.letra);
  });
}

const nivelLabel: Record<string, string> = {
  FUND_I: "Fund. I", FUND_II: "Fund. II", MEDIO: "Médio",
};

const nivelGradient: Record<string, string> = {
  FUND_I: "from-emerald-500 to-teal-600",
  FUND_II: "from-blue-500 to-indigo-600",
  MEDIO: "from-violet-500 to-purple-600",
};

export default async function DashboardProfessor() {
  const session = await auth();
  const professorId = session!.user.id;

  const vinculos = await prisma.professorDisciplinaTurma.findMany({
    where: { professorId },
    select: { turmaId: true, disciplina: { select: { nome: true } } },
  });

  const turmaIds = [...new Set(vinculos.map((v) => v.turmaId))];
  const disciplinasPorTurma: Record<string, string[]> = {};
  vinculos.forEach((v) => {
    if (!disciplinasPorTurma[v.turmaId]) disciplinasPorTurma[v.turmaId] = [];
    disciplinasPorTurma[v.turmaId].push(v.disciplina.nome);
  });

  let turmas = turmaIds.length
    ? await prisma.turma.findMany({
        where: { id: { in: turmaIds }, ativa: true },
        include: { _count: { select: { alunos: true, ocorrencias: true } } },
      })
    : [];

  turmas = ordenarTurmas(turmas);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const [ocorrenciasHoje, totalOcorrencias] = await Promise.all([
    prisma.ocorrencia.count({
      where: { professorId, data: { gte: hoje, lt: addDays(hoje, 1) }, aluno: { ativo: true } },
    }),
    prisma.ocorrencia.count({ where: { professorId } }),
  ]);

  const lembretes = await prisma.lembrete.findMany({
    where: { professorId, concluido: false, dataEvento: { gte: hoje, lte: addDays(hoje, 7) } },
    orderBy: { dataEvento: "asc" },
    take: 5,
  });

  const professor = await prisma.user.findUnique({
    where: { id: professorId },
    select: { name: true, image: true },
  });

  const primeiroNome = professor?.name?.split(" ")[0] ?? "Professor";
  const iniciais = professor?.name?.split(" ").map((n) => n[0]).slice(0, 2).join("") ?? "P";

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="space-y-6 pb-8">

      {/* ── HERO HEADER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 p-8 text-white shadow-2xl">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-500/10" />
        <div className="pointer-events-none absolute -bottom-12 left-1/3 h-48 w-48 rounded-full bg-indigo-500/10" />
        <div className="pointer-events-none absolute right-1/4 bottom-0 h-32 w-32 rounded-full bg-violet-500/15" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {professor?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={professor.image} alt="" className="h-14 w-14 rounded-2xl ring-2 ring-white/20" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-lg font-bold ring-2 ring-white/10">
                {iniciais}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-blue-200">{saudacao},</p>
              <h1 className="text-2xl font-bold tracking-tight">{primeiroNome} 👋</h1>
              <p className="mt-0.5 text-sm text-blue-300/80">
                {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>

          <Link
            href="/professor/ocorrencias/massa"
            className="group flex flex-shrink-0 items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-semibold ring-1 ring-white/10 backdrop-blur-sm transition hover:bg-white/20"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Ocorrência em Massa</span>
            <span className="sm:hidden">Em Massa</span>
          </Link>
        </div>

        {/* mini stats row */}
        <div className="relative mt-6 grid grid-cols-3 gap-3">
          {[
            { icon: School, value: turmas.length, label: "Turmas" },
            { icon: ClipboardList, value: ocorrenciasHoje, label: "Hoje" },
            { icon: TrendingUp, value: totalOcorrencias, label: "Total" },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl bg-white/8 px-4 py-3 ring-1 ring-white/10 backdrop-blur-sm">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/10">
                <Icon className="h-4 w-4 text-blue-200" />
              </div>
              <div>
                <p className="text-xl font-bold leading-none">{value}</p>
                <p className="mt-0.5 text-xs text-blue-300">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* TURMAS — col-span-2 */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Minhas Turmas</h2>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
              {turmas.length} {turmas.length === 1 ? "turma" : "turmas"}
            </span>
          </div>

          {turmas.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                <School className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-500">Nenhuma turma atribuída</p>
              <p className="mt-1 text-xs text-gray-400">Aguarde a secretaria configurar suas turmas</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {turmas.map((turma) => {
                const engagement = turma._count.alunos > 0
                  ? Math.min(100, (turma._count.ocorrencias / turma._count.alunos / 5) * 100)
                  : 0;
                const gradient = nivelGradient[turma.nivel as string] ?? "from-blue-500 to-indigo-600";
                const disciplinas = disciplinasPorTurma[turma.id] ?? [];

                return (
                  <Link
                    key={turma.id}
                    href={`/professor/turma/${turma.id}`}
                    className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    {/* colored top accent */}
                    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient}`} />

                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="truncate text-sm font-bold text-gray-900">{turma.nome}</h3>
                        <p className="mt-0.5 text-xs text-gray-400">{turma.turno}</p>
                      </div>
                      <div className="ml-2 flex flex-shrink-0 items-center gap-1.5">
                        <span className={`rounded-lg bg-gradient-to-r ${gradient} px-2 py-0.5 text-xs font-semibold text-white`}>
                          {nivelLabel[turma.nivel as string] ?? turma.nivel}
                        </span>
                        <ChevronRight className="h-4 w-4 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500" />
                      </div>
                    </div>

                    {/* disciplinas badges */}
                    {disciplinas.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {disciplinas.slice(0, 3).map((d) => (
                          <span key={d} className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-0.5 text-xs text-gray-500 ring-1 ring-gray-100">
                            <BookOpen className="h-2.5 w-2.5" />
                            {d}
                          </span>
                        ))}
                        {disciplinas.length > 3 && (
                          <span className="rounded-md bg-gray-50 px-2 py-0.5 text-xs text-gray-400 ring-1 ring-gray-100">
                            +{disciplinas.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* stats row */}
                    <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {turma._count.alunos} alunos
                        </span>
                        <span className="flex items-center gap-1">
                          <ClipboardList className="h-3 w-3" />
                          {turma._count.ocorrencias}
                        </span>
                      </div>
                      <span className={`font-semibold ${
                        engagement > 60 ? "text-emerald-500"
                        : engagement > 30 ? "text-amber-500"
                        : "text-gray-300"
                      }`}>
                        {Math.round(engagement)}%
                      </span>
                    </div>

                    {/* progress bar */}
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all`}
                        style={{ width: `${engagement}%` }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* LEMBRETES — col-span-1 */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Próximos Eventos</h2>
            <Link href="/professor/lembretes" className="text-xs font-medium text-blue-600 hover:underline">
              Ver todos
            </Link>
          </div>

          {lembretes.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                <CalendarDays className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-400">Sem eventos próximos</p>
              <Link href="/professor/lembretes" className="mt-2 text-xs font-medium text-blue-500 hover:underline">
                Adicionar lembrete
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {lembretes.map((l) => {
                const isHoje = format(l.dataEvento, "yyyy-MM-dd") === format(hoje, "yyyy-MM-dd");
                const isamanha = format(l.dataEvento, "yyyy-MM-dd") === format(addDays(hoje, 1), "yyyy-MM-dd");

                return (
                  <div
                    key={l.id}
                    className={`relative overflow-hidden rounded-2xl border p-4 transition ${
                      isHoje
                        ? "border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50"
                        : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                    }`}
                  >
                    {isHoje && (
                      <div className="absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-gradient-to-b from-orange-400 to-amber-500" />
                    )}
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${
                        isHoje ? "bg-orange-100" : "bg-gray-100"
                      }`}>
                        {isHoje
                          ? <AlertCircle className="h-4 w-4 text-orange-500" />
                          : <CalendarDays className="h-4 w-4 text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{l.titulo}</p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {format(l.dataEvento, "dd/MM · HH:mm", { locale: ptBR })}
                        </p>
                        {isHoje && (
                          <span className="mt-1 inline-block rounded-md bg-orange-100 px-1.5 py-0.5 text-xs font-semibold text-orange-600">
                            Hoje!
                          </span>
                        )}
                        {isamanha && (
                          <span className="mt-1 inline-block rounded-md bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-500">
                            Amanhã
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <Link
                href="/professor/lembretes"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 py-3 text-xs font-medium text-gray-400 transition hover:border-blue-200 hover:text-blue-500"
              >
                <Star className="h-3.5 w-3.5" />
                Novo lembrete
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}