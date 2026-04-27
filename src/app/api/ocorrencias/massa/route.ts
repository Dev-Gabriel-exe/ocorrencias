// src/app/api/ocorrencias/massa/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface MotivoItem {
  motivoId: string;
  titulo: string;
  descricao: string;
  positivo: boolean;
}

// FIX: média com 1 casa decimal (Float), igual aos outros routes
async function atualizarEstrelas(alunoId: string, disciplinaId: string, delta: number) {
  const atual = await prisma.alunoEstrelas.upsert({
    where: { alunoId_disciplinaId: { alunoId, disciplinaId } },
    update: {},
    create: { alunoId, disciplinaId, estrelas: 5 },
  });

  await prisma.alunoEstrelas.update({
    where: { alunoId_disciplinaId: { alunoId, disciplinaId } },
    data: { estrelas: Math.min(10, Math.max(0, atual.estrelas + delta)) },
  });

  const todas = await prisma.alunoEstrelas.findMany({
    where: { alunoId },
    select: { estrelas: true },
  });

  // Média com 1 casa decimal
  const media = todas.length > 0
    ? Math.round((todas.reduce((sum, e) => sum + e.estrelas, 0) / todas.length) * 10) / 10
    : 5;

  await prisma.aluno.update({
    where: { id: alunoId },
    data: { estrelas: media },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "PROFESSOR") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json() as {
    turmaId: string;
    disciplinaId: string;
    alunoIds: string[];
    motivos: MotivoItem[];
  };

  const { turmaId, disciplinaId, alunoIds, motivos } = body;

  if (!turmaId || !alunoIds?.length || !motivos?.length) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  if (!disciplinaId) {
    return NextResponse.json({ error: "Disciplina é obrigatória" }, { status: 400 });
  }

  const descricao = motivos
    .map((m) => (m.descricao?.trim() ? `${m.titulo}: ${m.descricao.trim()}` : m.titulo))
    .join(" | ");

  const todosPositivos = motivos.every((m) => m.positivo);
  const delta = todosPositivos ? 1 : -1;
  const motivoPrincipalId = motivos[0].motivoId;

  await prisma.$transaction(
    alunoIds.map((alunoId) =>
      prisma.ocorrencia.create({
        data: {
          alunoId,
          turmaId,
          professorId: session.user.id,
          motivoId: motivoPrincipalId,
          disciplinaId,
          descricao,
          deltaEstrelas: delta,
          vistaPelaSecretaria: false,
        },
      })
    )
  );

  // Atualiza estrelas por disciplina para cada aluno
  for (const alunoId of alunoIds) {
    await atualizarEstrelas(alunoId, disciplinaId, delta);
  }

  return NextResponse.json({ count: alunoIds.length }, { status: 201 });
}