// src/app/api/turmas/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;

  const turma = await prisma.turma.findUnique({
    where: { id },
    include: {
      alunos: { where: { ativo: true }, orderBy: { nome: "asc" } },
      disciplinas: {
        include: { disciplina: true },
      },
      professorDisciplinas: {
        include: {
          professor: { select: { id: true, name: true, email: true } },
          disciplina: { select: { id: true, nome: true } },
        },
      },
      _count: { select: { ocorrencias: true } },
    },
  });

  if (!turma) return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 });
  return NextResponse.json(turma);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role === "PROFESSOR") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const turma = await prisma.turma.update({ where: { id }, data: body });
  return NextResponse.json(turma);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role === "PROFESSOR") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.$transaction([
    prisma.aluno.updateMany({
      where: { turmaId: id },
      data: { ativo: false },
    }),
    prisma.turma.update({
      where: { id },
      data: { ativa: false },
    }),
  ]);

  return NextResponse.json({ ok: true });
}