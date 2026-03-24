// src/app/api/turmas/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Nivel } from "@prisma/client";

function nivelFilter(role: string): Nivel[] | undefined {
  if (role === "SECRETARIA_FUND1") return ["FUND_I"];
  if (role === "SECRETARIA_FUND2") return ["FUND_II", "MEDIO"];
  return undefined;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const comNotificacoes = searchParams.get("comNotificacoes") === "true";
  const niveis = nivelFilter(session.user.role);

  if (session.user.role === "PROFESSOR") {
  // Turmas onde este professor está vinculado via ProfessorDisciplinaTurma
  const vinculos = await prisma.professorDisciplinaTurma.findMany({
    where: { professorId: session.user.id },
    select: { turmaId: true, disciplinaId: true },
  });

  if (vinculos.length === 0) return NextResponse.json([]);

  const turmaIds = [...new Set(vinculos.map((v) => v.turmaId))];
  const disciplinaIds = [...new Set(vinculos.map((v) => v.disciplinaId))];

  const turmas = await prisma.turma.findMany({
    where: { id: { in: turmaIds }, ativa: true },
    include: {
      _count: { select: { alunos: true, ocorrencias: true } },
      disciplinas: {
        where: { disciplinaId: { in: disciplinaIds } },
        include: { disciplina: true },
      },
    },
    orderBy: [{ nivel: "asc" }, { nome: "asc" }],
  });

  return NextResponse.json(turmas);
}

  const turmas = await prisma.turma.findMany({
    where: { ativa: true, ...(niveis ? { nivel: { in: niveis } } : {}) },
    include: {
      _count: { select: { alunos: true, ocorrencias: true } },
      disciplinas: { include: { disciplina: true } },
      ...(comNotificacoes
        ? { ocorrencias: { where: { vistaPelaSecretaria: false }, select: { id: true } } }
        : {}),
    },
    orderBy: [{ nivel: "asc" }, { nome: "asc" }],
  });

  return NextResponse.json(turmas);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role === "PROFESSOR") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { nome, serie, turno, nivel, anoLetivo } = await req.json();
  if (!nome || !serie || !turno || !nivel) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const niveis = nivelFilter(session.user.role);
  if (niveis && !niveis.includes(nivel as Nivel)) {
    return NextResponse.json({ error: "Sem permissão para este nível" }, { status: 403 });
  }

  const turma = await prisma.turma.create({
    data: { nome, serie, turno, nivel, anoLetivo: anoLetivo || 2026 },
  });
  return NextResponse.json(turma, { status: 201 });
}