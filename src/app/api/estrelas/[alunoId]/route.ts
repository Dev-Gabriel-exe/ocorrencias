// src/app/api/estrelas/[alunoId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ alunoId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { alunoId } = await params;
  const { searchParams } = new URL(req.url);
  const disciplinaId = searchParams.get("disciplinaId");

  if (disciplinaId) {
    const registro = await prisma.alunoEstrelas.findUnique({
      where: { alunoId_disciplinaId: { alunoId, disciplinaId } },
    });
    return NextResponse.json({ estrelas: registro?.estrelas ?? 5 });
  }

  const registros = await prisma.alunoEstrelas.findMany({
    where: { alunoId },
    include: { disciplina: { select: { nome: true } } },
  });

  return NextResponse.json(registros.map((r) => ({
    disciplinaId: r.disciplinaId,
    disciplina: r.disciplina.nome,
    estrelas: r.estrelas,
  })));
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ alunoId: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "PROFESSOR") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { alunoId } = await params;
  const { delta, disciplinaId } = await req.json();

  if (typeof delta !== "number") {
    return NextResponse.json({ error: "Delta inválido" }, { status: 400 });
  }

  if (!disciplinaId) {
    return NextResponse.json({ error: "disciplinaId obrigatório" }, { status: 400 });
  }

  const aluno = await prisma.aluno.findUnique({ where: { id: alunoId } });
  if (!aluno) return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });

  const atual = await prisma.alunoEstrelas.upsert({
    where: { alunoId_disciplinaId: { alunoId, disciplinaId } },
    update: {},
    create: { alunoId, disciplinaId, estrelas: 5 },
  });

  const novoValor = Math.min(10, Math.max(0, atual.estrelas + delta));

  await prisma.alunoEstrelas.update({
    where: { alunoId_disciplinaId: { alunoId, disciplinaId } },
    data: { estrelas: novoValor },
  });

  // Recalcula média global com 1 casa decimal
  const todas = await prisma.alunoEstrelas.findMany({
    where: { alunoId },
    select: { estrelas: true },
  });

  const media = todas.length > 0
    ? Math.round((todas.reduce((sum, e) => sum + e.estrelas, 0) / todas.length) * 10) / 10
    : 5;

  const atualizado = await prisma.aluno.update({
    where: { id: alunoId },
    data: { estrelas: media },
    select: { id: true, nome: true, estrelas: true },
  });

  return NextResponse.json({ ...atualizado, estrelasDisciplina: novoValor });
}