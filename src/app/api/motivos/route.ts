// src/app/api/motivos/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const disciplina = searchParams.get("disciplina");
  const nivel = searchParams.get("nivel");

  const motivos = await prisma.motivo.findMany({
    where: {
      ativo: true,
      // Retorna motivos gerais OU específicos da disciplina/nível
      OR: [
        { disciplina: null, nivel: null },
        ...(disciplina ? [{ disciplina }] : []),
        ...(nivel ? [{ nivel: nivel as never }] : []),
      ],
    },
    orderBy: [{ positivo: "asc" }, { titulo: "asc" }],
  });

  return NextResponse.json(motivos);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role === "PROFESSOR") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { titulo, descricao, disciplina, nivel, positivo } = body;

  if (!titulo) {
    return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });
  }

  const motivo = await prisma.motivo.create({
    data: { titulo, descricao, disciplina, nivel, positivo: positivo ?? false },
  });

  return NextResponse.json(motivo, { status: 201 });
}
