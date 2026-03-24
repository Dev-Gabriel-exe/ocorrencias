// src/app/api/alunos/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const turmaId = searchParams.get("turmaId");

  const alunos = await prisma.aluno.findMany({
    where: {
      ativo: true,
      turma: { ativa: true },
      ...(turmaId ? { turmaId } : {}),
    },
    include: {
      turma: { select: { id: true, nome: true, serie: true } },
      _count: { select: { ocorrencias: true } },
    },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(alunos);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role === "PROFESSOR") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { nome, matricula, turmaId, dataNasc, email, telefone } = body;

  if (!nome || !matricula || !turmaId) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  try {
    const aluno = await prisma.aluno.create({
      data: {
        nome,
        matricula,
        turmaId,
        dataNasc: dataNasc ? new Date(dataNasc) : null,
        email,
        telefone,
      },
    });
    return NextResponse.json(aluno, { status: 201 });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Matrícula já cadastrada" }, { status: 409 });
    }
    throw e;
  }
}