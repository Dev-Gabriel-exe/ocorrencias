// src/app/api/ocorrencias/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const ocorrencia = await prisma.ocorrencia.findUnique({ where: { id } });

  if (!ocorrencia) {
    return NextResponse.json({ error: "Ocorrência não encontrada" }, { status: 404 });
  }

  if (session.user.role === "PROFESSOR") {
    if (ocorrencia.professorId !== session.user.id) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    if (ocorrencia.vistaPelaSecretaria) {
      return NextResponse.json(
        { error: "Não é possível apagar: a secretaria já visualizou esta ocorrência." },
        { status: 403 }
      );
    }
  }

  if (ocorrencia.deltaEstrelas !== 0 && ocorrencia.disciplinaId) {
    await atualizarEstrelas(ocorrencia.alunoId, ocorrencia.disciplinaId, -ocorrencia.deltaEstrelas);
  }

  await prisma.ocorrencia.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}