import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role === "PROFESSOR") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const { titulo, descricao, disciplinaId, nivel, positivo, disciplinasExcluidasIds } = await req.json();

  const motivo = await prisma.motivo.update({
    where: { id },
    data: {
      titulo,
      descricao: descricao || null,
      disciplinaId: disciplinaId || null,
      nivel: nivel || null,
      positivo: positivo ?? false,
      disciplinasExcluidas: {
        set: (disciplinasExcluidasIds as string[] ?? []).map((id) => ({ id })),
      },
    },
    include: {
      disciplina: { select: { id: true, nome: true } },
      disciplinasExcluidas: { select: { id: true, nome: true } },
    },
  });

  return NextResponse.json(motivo);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role === "PROFESSOR") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const count = await prisma.ocorrencia.count({ where: { motivoId: id } });

  if (count > 0) {
    // Soft-delete se tiver ocorrências vinculadas
    await prisma.motivo.update({ where: { id }, data: { ativo: false } });
  } else {
    await prisma.motivo.delete({ where: { id } });
  }

  return NextResponse.json({ ok: true });
}