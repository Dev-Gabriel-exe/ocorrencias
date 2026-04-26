// src/app/api/ocorrencias/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper: atualiza estrelas por disciplina e recalcula média global com 1 decimal
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

  // Recalcula média global com 1 casa decimal
  const todas = await prisma.alunoEstrelas.findMany({
    where: { alunoId },
    select: { estrelas: true },
  });

  const media = todas.length > 0
    ? Math.round((todas.reduce((sum, e) => sum + e.estrelas, 0) / todas.length) * 10) / 10
    : 5;

  await prisma.aluno.update({
    where: { id: alunoId },
    data: { estrelas: media },
  });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const turmaId = searchParams.get("turmaId");
  const alunoId = searchParams.get("alunoId");
  const disciplinaId = searchParams.get("disciplinaId");
  const apenasNaoVistas = searchParams.get("apenasNaoVistas") === "true";

  const where: Record<string, unknown> = {};
  if (session.user.role === "PROFESSOR") where.professorId = session.user.id;
  if (session.user.role === "SECRETARIA_FUND1") where.turma = { nivel: { in: ["FUND_I"] } };
  if (session.user.role === "SECRETARIA_FUND2") where.turma = { nivel: { in: ["FUND_II", "MEDIO"] } };
  if (turmaId) where.turmaId = turmaId;
  if (alunoId) where.alunoId = alunoId;
  if (disciplinaId) where.disciplinaId = disciplinaId;
  if (apenasNaoVistas) where.vistaPelaSecretaria = false;

  const ocorrencias = await prisma.ocorrencia.findMany({
    where,
    include: {
      aluno: { select: { id: true, nome: true, matricula: true, estrelas: true } },
      turma: { select: { id: true, nome: true, nivel: true } },
      professor: { select: { id: true, name: true, email: true } },
      motivo: { select: { id: true, titulo: true, positivo: true } },
      disciplina: { select: { id: true, nome: true } },
    },
    orderBy: { data: "desc" },
    take: 200,
  });

  return NextResponse.json(ocorrencias);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "PROFESSOR") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { alunoId, turmaId, motivoId, disciplinaId, descricao, deltaEstrelas = 0 } = await req.json();

  if (!alunoId || !turmaId || !descricao) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  if (!disciplinaId) {
    return NextResponse.json({ error: "Disciplina é obrigatória" }, { status: 400 });
  }

  const ocorrencia = await prisma.ocorrencia.create({
    data: {
      alunoId,
      turmaId,
      professorId: session.user.id,
      motivoId: motivoId || null,
      disciplinaId,
      descricao,
      deltaEstrelas,
      vistaPelaSecretaria: false,
    },
    include: {
      aluno: true, turma: true, professor: true, motivo: true, disciplina: true,
    },
  });

  if (deltaEstrelas !== 0) {
    await atualizarEstrelas(alunoId, disciplinaId, deltaEstrelas);
  }

  return NextResponse.json(ocorrencia, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role === "PROFESSOR") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  const ocorrencia = await prisma.ocorrencia.findUnique({ where: { id } });
  if (!ocorrencia) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });

  if (ocorrencia.deltaEstrelas !== 0 && ocorrencia.disciplinaId) {
    await atualizarEstrelas(ocorrencia.alunoId, ocorrencia.disciplinaId, -ocorrencia.deltaEstrelas);
  }

  await prisma.ocorrencia.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}