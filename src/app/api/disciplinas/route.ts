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
    where: { ativa: true },
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

  const disciplina = await prisma.disciplina.upsert({
    where: { nome: nome.trim() },
    update: { ativa: true },
    create: { nome: nome.trim() },
  });

  return NextResponse.json(disciplina, { status: 201 });
}