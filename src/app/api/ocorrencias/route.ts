// src/app/api/ocorrencias/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  // Deriva delta automaticamente do motivo — ignora o valor vindo do cliente
  let delta = deltaEstrelas;
  if (motivoId) {
    const motivo = await prisma.motivo.findUnique({
      where: { id: motivoId },
      select: { positivo: true },
    });
    if (motivo) delta = motivo.positivo ? 1 : -1;
  }

  const ocorrencia = await prisma.ocorrencia.create({
    data: {
      alunoId,
      turmaId,
      professorId: session.user.id,
      motivoId: motivoId || null,
      disciplinaId: disciplinaId || null,
      descricao,
      deltaEstrelas: delta,
      vistaPelaSecretaria: false,
    },
    include: {
      aluno: true,
      turma: true,
      professor: true,
      motivo: true,
      disciplina: true,
    },
  });

  // Atualiza estrelas do aluno
  if (delta !== 0) {
    const aluno = await prisma.aluno.findUnique({ where: { id: alunoId } });
    if (aluno) {
      await prisma.aluno.update({
        where: { id: alunoId },
        data: { estrelas: Math.min(10, Math.max(0, aluno.estrelas + delta)) },
      });
    }
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

  await prisma.ocorrencia.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}