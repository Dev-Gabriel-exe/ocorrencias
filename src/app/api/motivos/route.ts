// src/app/api/motivos/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Nivel } from "@prisma/client";

function nivelDoRole(role: string): Nivel[] | null {
  if (role === "SECRETARIA_FUND1") return ["FUND_I"];
  if (role === "SECRETARIA_FUND2") return ["FUND_II", "MEDIO"];
  return null; // GERAL vê todos
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const disciplinaId = searchParams.get("disciplinaId");
  const nivel = searchParams.get("nivel");
  const temFiltro = disciplinaId || nivel;

  // Para professor: filtra pelo nível da turma passado como parâmetro
  // Para secretaria: filtra pelo nível do role
  let niveisPermitidos: Nivel[] | null = null;

  if (session.user.role === "PROFESSOR") {
    // Professor passa o nivel da turma como parâmetro
    if (nivel) niveisPermitidos = [nivel as Nivel];
  } else {
    niveisPermitidos = nivelDoRole(session.user.role);
  }

  const motivos = await prisma.motivo.findMany({
    where: {
      ativo: true,
      // Filtra por nivel: mostra motivos sem nivel (gerais) + motivos do nivel correto
      ...(niveisPermitidos ? {
        OR: [
          { nivel: null },
          { nivel: { in: niveisPermitidos } },
        ],
      } : {}),
      ...(temFiltro ? {
        AND: [
          {
            OR: [
              { disciplinaId: null },
              ...(disciplinaId ? [{ disciplinaId }] : []),
            ],
          },
          ...(disciplinaId ? [{
            NOT: { disciplinasExcluidas: { some: { id: disciplinaId } } },
          }] : []),
        ],
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

  // CORREÇÃO: secretaria Fund1/Fund2 só pode criar motivos do seu nível
  const niveisPermitidos = nivelDoRole(session.user.role);
  if (niveisPermitidos && nivel && !niveisPermitidos.includes(nivel as Nivel)) {
    return NextResponse.json({ error: "Sem permissão para este nível" }, { status: 403 });
  }

  // Se não informou nível, força o nível da secretaria (exceto GERAL)
  const nivelFinal = nivel || (niveisPermitidos?.length === 1 ? niveisPermitidos[0] : null);

  const motivo = await prisma.motivo.create({
    data: {
      titulo,
      descricao: descricao || null,
      disciplinaId: disciplinaId || null,
      nivel: nivelFinal || null,
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