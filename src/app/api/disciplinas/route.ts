// src/app/api/disciplinas/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const turmaId = searchParams.get("turmaId");
  const professorId = searchParams.get("professorId");
  const role = session.user.role;

  // Filtro de visibilidade por nível
  function filtroVisibilidade() {
    if (role === "SECRETARIA_FUND1") {
      return { OR: [{ criadaPor: null }, { criadaPor: "SECRETARIA_FUND1" }] };
    }
    if (role === "SECRETARIA_FUND2") {
      return { OR: [{ criadaPor: null }, { criadaPor: "SECRETARIA_FUND2" }] };
    }
    // SECRETARIA_GERAL e PROFESSOR veem tudo
    return {};
  }

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

  const disciplinas = await prisma.disciplina.findMany({
    where: { ativa: true, ...filtroVisibilidade() },
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

  const role = session.user.role;

  // Secretaria Geral cria sem dono (null = todos veem)
  const criadaPor = role === "SECRETARIA_GERAL" ? null : role;

  const disciplina = await prisma.disciplina.upsert({
    where: { nome: nome.trim() },
    update: { ativa: true },
    create: { nome: nome.trim(), criadaPor },
  });

  return NextResponse.json(disciplina, { status: 201 });
}