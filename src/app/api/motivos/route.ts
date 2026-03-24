// src/app/api/motivos/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const disciplinaId = searchParams.get("disciplinaId");
  const nivel = searchParams.get("nivel");

  // Se não veio filtro nenhum (tela de gerenciamento), retorna todos os ativos
  const temFiltro = disciplinaId || nivel;

  const motivos = await prisma.motivo.findMany({
    where: {
      ativo: true,
      ...(temFiltro ? {
        OR: [
          { disciplinaId: null, nivel: null },
          ...(disciplinaId ? [{ disciplinaId }] : []),
          ...(nivel ? [{ nivel: nivel as never }] : []),
        ],
        NOT: disciplinaId
          ? { disciplinasExcluidas: { some: { id: disciplinaId } } }
          : undefined,
      } : {}),
    },
    include: {
      disciplina: { select: { id: true, nome: true } },
      disciplinasExcluidas: { select: { id: true, nome: true } },
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
  const { titulo, descricao, disciplinaId, nivel, positivo, disciplinasExcluidasIds } = body;

  if (!titulo) {
    return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });
  }

  const motivo = await prisma.motivo.create({
    data: {
      titulo,
      descricao: descricao || null,
      disciplinaId: disciplinaId || null,
      nivel: nivel || null,
      positivo: positivo ?? false,
      disciplinasExcluidas: disciplinasExcluidasIds?.length
        ? { connect: (disciplinasExcluidasIds as string[]).map((id) => ({ id })) }
        : undefined,
    },
    include: {
      disciplina: { select: { id: true, nome: true } },
      disciplinasExcluidas: { select: { id: true, nome: true } },
    },
  });

  return NextResponse.json(motivo, { status: 201 });
}