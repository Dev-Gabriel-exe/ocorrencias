// src/app/professor/turma/[id]/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { ListaAlunosInterativa } from "@/components/turma/lista-alunos-interativa";

export default async function TurmaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const professorId = session!.user.id;

  const minhasDisciplinasNaTurma = await prisma.professorDisciplinaTurma.findMany({
    where: { turmaId: id, professorId },
    include: { disciplina: true },
  });

  if (minhasDisciplinasNaTurma.length === 0) notFound();

  const turma = await prisma.turma.findUnique({
    where: { id },
    include: { alunos: { where: { ativo: true }, orderBy: { nome: "asc" } } },
  });

  if (!turma) notFound();

  const disciplinaIds = minhasDisciplinasNaTurma.map((d) => d.disciplinaId);

  // CORREÇÃO: filtra motivos pelo nível da turma
  const motivos = await prisma.motivo.findMany({
    where: {
      ativo: true,
      OR: [
        { nivel: null },           // motivos gerais (sem nível)
        { nivel: turma.nivel },    // motivos do nível desta turma
      ],
      AND: [
        {
          OR: [
            { disciplinaId: null },
            { disciplinaId: { in: disciplinaIds } },
          ],
        },
        {
          NOT: {
            disciplinasExcluidas: {
              some: { id: { in: disciplinaIds } },
            },
          },
        },
      ],
    },
    include: { disciplina: true },
    orderBy: { titulo: "asc" },
  });

  const disciplinasDoProfessor = minhasDisciplinasNaTurma.map((d) => d.disciplina);

  return (
    <div>
      <div className="mb-6">
        <Link href="/professor/dashboard"
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{turma.nome}</h1>
            <p className="text-gray-400 text-sm mt-1">{turma.turno} · {turma.alunos.length} alunos</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {disciplinasDoProfessor.map((d) => (
                <span key={d.id} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  {d.nome}
                </span>
              ))}
            </div>
          </div>
          <Link href={`/professor/ocorrencias/massa?turmaId=${id}`}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors flex-shrink-0">
            <Users className="w-4 h-4" />
            Ocorrência em Massa
          </Link>
        </div>
      </div>

      <ListaAlunosInterativa
        alunos={turma.alunos}
        turmaId={turma.id}
        motivos={motivos}
        disciplinasDoProfessor={disciplinasDoProfessor}
        professorId={professorId}
      />
    </div>
  );
}