// src/app/api/disciplinas/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const turmaId = searchParams.get("turmaId");
  const professorId = searchParams.get("professorId");
  const role = session.user.role as Role;

  if (turmaId) {
    const vinculos = await prisma.disciplinaTurma.findMany({
      where: { turmaId },
      include: { disciplina: true },
    });
    return NextResponse.json(vinculos.map((v) => v.disciplina));
  }

  if (professorId) {
    const vinculos = await prisma.professorDisciplina.findMany({
      where: { professorId },
      include: { disciplina: true },
    });
    return NextResponse.json(vinculos.map((v) => v.disciplina));
  }

  // Monta filtro de visibilidade com tipo correto (Role enum)
  const whereVisibilidade =
    role === "SECRETARIA_FUND1" || role === "SECRETARIA_FUND2"
      ? { OR: [{ criadaPor: null }, { criadaPor: role }] as const }
      : {};

  const disciplinas = await prisma.disciplina.findMany({
    where: { ativa: true, ...whereVisibilidade },
    include: { _count: { select: { professores: true, turmas: true } } },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(disciplinas);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { nome } = await req.json();
  if (!nome?.trim()) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });

  const role = session.user.role as Role;

  // Secretaria Geral cria sem dono (null = todos veem)
  const criadaPor: Role | null = role === "SECRETARIA_GERAL" ? null : role;

  const disciplina = await prisma.disciplina.upsert({
    where: { nome: nome.trim() },
    update: { ativa: true },
    create: { nome: nome.trim(), criadaPor },
  });

  return NextResponse.json(disciplina, { status: 201 });
}