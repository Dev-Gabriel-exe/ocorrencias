// src/app/api/alunos/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;

  const aluno = await prisma.aluno.findUnique({
    where: { id },
    include: {
      turma: { select: { id: true, nome: true } },
      // Inclui estrelas por disciplina
      estrelasPorDisciplina: {
        include: {
          disciplina: { select: { id: true, nome: true } },
        },
        orderBy: { disciplina: { nome: "asc" } },
      },
      ocorrencias: {
        orderBy: { data: "desc" },
        include: {
          motivo: { select: { titulo: true, positivo: true } },
          disciplina: { select: { id: true, nome: true } },
          professor: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (!aluno) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  // Formata estrelasPorDisciplina para o front
  const estrelasPorDisciplina = aluno.estrelasPorDisciplina.map((e) => ({
    disciplinaId: e.disciplinaId,
    disciplinaNome: e.disciplina.nome,
    estrelas: e.estrelas,
  }));

  return NextResponse.json({
    ...aluno,
    estrelasPorDisciplina,
  });
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;

  await prisma.aluno.update({
    where: { id },
    data: { ativo: false },
  });

  return NextResponse.json({ ok: true });
}