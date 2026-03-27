// src/app/api/disciplinas/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, Prisma } from "@prisma/client";

function parseRole(rawRole: unknown): Role | null {
  if (typeof rawRole !== "string") return null;
  return Object.values(Role).includes(rawRole as Role)
    ? (rawRole as Role)
    : null;
}

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const role = parseRole(session.user.role);

  if (!role) {
    console.error("ROLE INVALID (GET):", session.user.role);
    return NextResponse.json({ error: "Role inválido" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const turmaId = searchParams.get("turmaId");
  const professorIdParam = searchParams.get("professorId");

  // =========================
  // 🔥 TURMA + PROFESSOR LOGADO
  // =========================
  if (turmaId) {
    const vinculos = await prisma.professorDisciplinaTurma.findMany({
      where: {
        turmaId,
        professorId: session.user.id, // 🔥 chave da correção
      },
      include: {
        disciplina: true,
      },
    });

    const disciplinas = vinculos
      .map((v) => v.disciplina)
      .sort((a, b) => a.nome.localeCompare(b.nome));

    return NextResponse.json(disciplinas);
  }

  // =========================
  // PROFESSOR (EXTERNO / ADMIN)
  // =========================
  if (professorIdParam) {
    const vinculos = await prisma.professorDisciplina.findMany({
      where: { professorId: professorIdParam },
      include: { disciplina: true },
    });

    const disciplinas = vinculos
      .map((v) => v.disciplina)
      .sort((a, b) => a.nome.localeCompare(b.nome));

    return NextResponse.json(disciplinas);
  }

  // =========================
  // LISTA GERAL (SECRETARIA)
  // =========================
  const where: Prisma.DisciplinaWhereInput = {
    ativa: true,
  };

  if (role === Role.SECRETARIA_FUND1 || role === Role.SECRETARIA_FUND2) {
    where.OR = [
      { criadaPor: null },
      { criadaPor: role },
    ];
  }

  const disciplinas = await prisma.disciplina.findMany({
    where,
    include: {
      _count: {
        select: { professores: true, turmas: true },
      },
    },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(disciplinas);
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { nome } = await req.json();

  if (!nome?.trim()) {
    return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
  }

  const role = parseRole(session.user.role);

  if (!role) {
    console.error("ROLE INVALID (POST):", session.user.role);
    return NextResponse.json({ error: "Role inválido" }, { status: 500 });
  }

  const criadaPor: Role | null =
    role === Role.SECRETARIA_GERAL ? null : role;

  const disciplina = await prisma.disciplina.upsert({
    where: { nome: nome.trim() },
    update: { ativa: true },
    create: {
      nome: nome.trim(),
      criadaPor,
    },
  });

  return NextResponse.json(disciplina, { status: 201 });
}