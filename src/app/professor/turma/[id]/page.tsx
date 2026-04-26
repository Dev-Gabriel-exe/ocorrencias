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
    include: {
      alunos: {
        where: { ativo: true },
        orderBy: { nome: "asc" },
      },
    },
  });

  if (!turma) notFound();

  const disciplinaIds = minhasDisciplinasNaTurma.map((d) => d.disciplinaId);
  const disciplinasDoProfessor = minhasDisciplinasNaTurma.map((d) => d.disciplina);

  const motivos = await prisma.motivo.findMany({
    where: {
      ativo: true,
      OR: [{ nivel: null }, { nivel: turma.nivel }],
      AND: [
        { OR: [{ disciplinaId: null }, { disciplinaId: { in: disciplinaIds } }] },
        { NOT: { disciplinasExcluidas: { some: { id: { in: disciplinaIds } } } } },
      ],
    },
    include: { disciplina: true },
    orderBy: { titulo: "asc" },
  });

  // Busca estrelas por disciplina do professor para cada aluno
  const estrelasRegistros = await prisma.alunoEstrelas.findMany({
    where: {
      alunoId: { in: turma.alunos.map((a) => a.id) },
      disciplinaId: { in: disciplinaIds },
    },
  });

  // Monta mapa: alunoId → disciplinaId → estrelas
  const estrelasMap: Record<string, Record<string, number>> = {};
  for (const r of estrelasRegistros) {
    if (!estrelasMap[r.alunoId]) estrelasMap[r.alunoId] = {};
    estrelasMap[r.alunoId][r.disciplinaId] = r.estrelas;
  }

  // Injeta estrelas por disciplina nos alunos
  const alunosComEstrelas = turma.alunos.map((aluno) => ({
    ...aluno,
    estrelasPorDisciplina: disciplinaIds.map((dId) => ({
      disciplinaId: dId,
      estrelas: estrelasMap[aluno.id]?.[dId] ?? 5,
    })),
  }));

  const total = turma.alunos.length;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-6 shadow-md">
        <Link href="/professor/dashboard" className="flex items-center gap-1 text-sm text-white/80 hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{turma.nome}</h1>
            <p className="text-sm text-white/80 mt-1">{turma.turno} · {total} alunos</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {disciplinasDoProfessor.map((d) => (
                <span key={d.id} className="text-xs bg-white/20 px-2 py-1 rounded-full">{d.nome}</span>
              ))}
            </div>
          </div>
          <Link
            href={`/professor/ocorrencias/massa?turmaId=${id}`}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-blue-600 rounded-xl text-sm font-medium hover:bg-gray-100 transition"
          >
            <Users className="w-4 h-4" /> Ocorrência em Massa
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400">Alunos</p>
          <p className="text-xl font-bold">{total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400">Engajamento</p>
          <p className="text-xl font-bold text-blue-600">Alto</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400">Positivas</p>
          <p className="text-xl font-bold text-green-600">--</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400">Negativas</p>
          <p className="text-xl font-bold text-red-500">--</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Alunos</h2>
          <span className="text-xs text-gray-400">{total} registros</span>
        </div>
        <ListaAlunosInterativa
          alunos={alunosComEstrelas}
          turmaId={turma.id}
          motivos={motivos}
          disciplinasDoProfessor={disciplinasDoProfessor}
          professorId={professorId}
        />
      </div>
    </div>
  );
}