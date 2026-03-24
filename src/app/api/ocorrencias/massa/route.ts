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

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "PROFESSOR") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { turmaId, disciplinaId, alunoIds, motivos } = await req.json() as {
    turmaId: string;
    disciplinaId?: string;
    alunoIds: string[];
    motivos: MotivoItem[];
  };

  if (!turmaId || !alunoIds?.length || !motivos?.length) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  // Monta descrição concatenando todos os motivos e suas descrições opcionais
  const descricao = motivos
    .map((m) => (m.descricao?.trim() ? `${m.titulo}: ${m.descricao.trim()}` : m.titulo))
    .join(" | ");

  // 1 estrela por registro: -1 se qualquer motivo for negativo, +1 se todos positivos
  const todosPositivos = motivos.every((m) => m.positivo);
  const delta = todosPositivos ? 1 : -1;

  // Motivo principal = primeiro da lista (para o campo motivoId)
  const motivoPrincipalId = motivos[0].motivoId;

  // Cria as ocorrências em transação
  await prisma.$transaction(
    alunoIds.map((alunoId) =>
      prisma.ocorrencia.create({
        data: {
          alunoId,
          turmaId,
          professorId: session.user.id,
          motivoId: motivoPrincipalId,
          disciplinaId: disciplinaId || null,
          descricao,
          deltaEstrelas: delta,
          vistaPelaSecretaria: false,
        },
      })
    )
  );

  // Atualiza estrelas de cada aluno (com clamp 0–10)
  for (const alunoId of alunoIds) {
    const aluno = await prisma.aluno.findUnique({
      where: { id: alunoId },
      select: { estrelas: true },
    });
    if (aluno) {
      await prisma.aluno.update({
        where: { id: alunoId },
        data: { estrelas: Math.min(10, Math.max(0, aluno.estrelas + delta)) },
      });
    }
  }

  return NextResponse.json({ count: alunoIds.length }, { status: 201 });
}