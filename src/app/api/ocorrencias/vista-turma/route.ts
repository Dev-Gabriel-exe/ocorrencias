// src/app/api/ocorrencias/vista-turma/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/ocorrencias/vista-turma — marca TODAS de uma turma como vistas
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role === "PROFESSOR") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { turmaId } = await req.json();
  if (!turmaId) return NextResponse.json({ error: "turmaId obrigatório" }, { status: 400 });

  const { count } = await prisma.ocorrencia.updateMany({
    where: { turmaId, vistaPelaSecretaria: false },
    data: { vistaPelaSecretaria: true },
  });

  return NextResponse.json({ marcadas: count });
}