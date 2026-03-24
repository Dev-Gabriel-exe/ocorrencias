// src/app/api/estrelas/[alunoId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ alunoId: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "PROFESSOR") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { alunoId } = await params;
  const { delta } = await req.json();

  if (typeof delta !== "number") {
    return NextResponse.json({ error: "Delta inválido" }, { status: 400 });
  }

  const aluno = await prisma.aluno.findUnique({ where: { id: alunoId } });
  if (!aluno) return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });

  const novoValor = Math.min(10, Math.max(0, aluno.estrelas + delta));

  const atualizado = await prisma.aluno.update({
    where: { id: alunoId },
    data: { estrelas: novoValor },
    select: { id: true, nome: true, estrelas: true },
  });

  return NextResponse.json(atualizado);
}
