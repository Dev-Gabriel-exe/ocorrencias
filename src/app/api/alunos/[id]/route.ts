// src/app/api/alunos/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role === "PROFESSOR") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  await prisma.aluno.update({
    where: { id: params.id },
    data: { ativo: false },
  });

  return NextResponse.json({ ok: true });
}

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const aluno = await prisma.aluno.findUnique({
    where: { id: params.id },
    include: {
      turma: { select: { id: true, nome: true } },
      ocorrencias: {
        include: {
          professor: { select: { name: true } },
          motivo: { select: { titulo: true, positivo: true } },
          disciplina: { select: { nome: true } },
        },
        orderBy: { data: "desc" },
      },
    },
  });

  if (!aluno) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(aluno);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role === "PROFESSOR") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const aluno = await prisma.aluno.update({
    where: { id: params.id },
    data: body,
  });

  return NextResponse.json(aluno);
}