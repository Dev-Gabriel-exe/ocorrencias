// src/app/api/professores/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role === "PROFESSOR") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const professores = await prisma.user.findMany({
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