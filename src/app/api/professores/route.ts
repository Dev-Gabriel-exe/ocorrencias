// src/app/api/professores/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role === "PROFESSOR") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Filtra professores pelo nível de ensino do role da secretaria
  const nivelFilter =
    session.user.role === "SECRETARIA_FUND1"
      ? "FUND_I"
      : session.user.role === "SECRETARIA_FUND2"
      ? "FUND_II_MEDIO"
      : null; // SECRETARIA_GERAL vê todos

  const professores = await prisma.user.findMany({
    where: {
      role: "PROFESSOR",
      ...(nivelFilter ? { nivelEnsino: nivelFilter } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      nivelEnsino: true,
      disciplinas: { include: { disciplina: { select: { id: true, nome: true } } } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    professores.map((p) => ({ ...p, disciplinas: p.disciplinas ?? [] }))
  );
}