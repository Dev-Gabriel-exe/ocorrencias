// src/app/api/disciplinas/vinculos/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role === "PROFESSOR") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { disciplinaId, turmaId, acao, professorId } = await req.json();

  if (!disciplinaId || !turmaId) {
    return NextResponse.json({ error: "disciplinaId e turmaId obrigatorios" }, { status: 400 });
  }

  if (acao === "desvincular") {
    await prisma.disciplinaTurma.deleteMany({ where: { disciplinaId, turmaId } });
    await prisma.professorDisciplinaTurma.deleteMany({ where: { disciplinaId, turmaId } });
    return NextResponse.json({ ok: true });
  }

  if (acao === "vincular-professor" && professorId) {
    const vinculo = await prisma.professorDisciplinaTurma.upsert({
      where: { professorId_disciplinaId_turmaId: { professorId, disciplinaId, turmaId } },
      update: {},
      create: { professorId, disciplinaId, turmaId },
    });
    return NextResponse.json(vinculo, { status: 201 });
  }

  if (acao === "desvincular-professor" && professorId) {
    await prisma.professorDisciplinaTurma.deleteMany({
      where: { professorId, disciplinaId, turmaId },
    });
    return NextResponse.json({ ok: true });
  }

  // Vincular disciplina à turma
  const vinculo = await prisma.disciplinaTurma.upsert({
    where: { disciplinaId_turmaId: { disciplinaId, turmaId } },
    update: {},
    create: { disciplinaId, turmaId },
  });

  return NextResponse.json(vinculo, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "PROFESSOR") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { disciplinas } = await req.json();
  if (!Array.isArray(disciplinas)) {
    return NextResponse.json({ error: "Lista invalida" }, { status: 400 });
  }

  await prisma.professorDisciplina.deleteMany({ where: { professorId: session.user.id } });

  for (const nome of disciplinas) {
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) continue;
    const disciplina = await prisma.disciplina.upsert({
      where: { nome: nomeLimpo }, update: { ativa: true }, create: { nome: nomeLimpo },
    });
    await prisma.professorDisciplina.upsert({
      where: { professorId_disciplinaId: { professorId: session.user.id, disciplinaId: disciplina.id } },
      update: {}, create: { professorId: session.user.id, disciplinaId: disciplina.id },
    });
  }

  const resultado = await prisma.professorDisciplina.findMany({
    where: { professorId: session.user.id },
    include: { disciplina: true },
  });

  return NextResponse.json(resultado.map((v) => v.disciplina));
}