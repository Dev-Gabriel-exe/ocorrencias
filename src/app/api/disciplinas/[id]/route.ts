// src/app/api/disciplinas/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role === "PROFESSOR") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  // Verifica vínculos ativos
  const [turmas, professores, ocorrencias, motivos] = await Promise.all([
    prisma.disciplinaTurma.count({ where: { disciplinaId: id } }),
    prisma.professorDisciplina.count({ where: { disciplinaId: id } }),
    prisma.ocorrencia.count({ where: { disciplinaId: id } }),
    prisma.motivo.count({ where: { disciplinaId: id } }),
  ]);

  const temVinculos = turmas > 0 || professores > 0 || ocorrencias > 0 || motivos > 0;

  if (temVinculos) {
    // Soft-delete: apenas desativa, preserva histórico
    await prisma.disciplina.update({
      where: { id },
      data: { ativa: false },
    });
    return NextResponse.json({ ok: true, desativada: true });
  }

  // Hard-delete: sem nenhum vínculo
  await prisma.disciplina.delete({ where: { id } });
  return NextResponse.json({ ok: true, desativada: false });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role === "PROFESSOR") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const { nome } = await req.json();

  if (!nome?.trim()) {
    return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
  }

  const disciplina = await prisma.disciplina.update({
    where: { id },
    data: { nome: nome.trim() },
  });

  return NextResponse.json(disciplina);
}
