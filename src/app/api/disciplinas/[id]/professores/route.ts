// src/app/api/disciplinas/[id]/professores/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const turmaId = searchParams.get("turmaId");

  let nivelEnsino: string | undefined;

  if (turmaId) {
    const turma = await prisma.turma.findUnique({
      where: { id: turmaId },
      select: { nivel: true },
    });
    if (turma) {
      nivelEnsino = turma.nivel === "FUND_I" ? "FUND_I" : "FUND_II_MEDIO";
    }
  }

  const professores = await prisma.professorDisciplina.findMany({
    where: {
      disciplinaId: id,
      professor: {
        role: "PROFESSOR",
        ...(nivelEnsino ? { nivelEnsino } : {}),
      },
    },
    include: {
      professor: { select: { id: true, name: true, email: true, nivelEnsino: true } },
    },
  });

  return NextResponse.json(professores.map((p) => p.professor));
}