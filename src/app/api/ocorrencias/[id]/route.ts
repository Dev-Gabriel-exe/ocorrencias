// src/app/api/ocorrencias/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;

  const ocorrencia = await prisma.ocorrencia.findUnique({ where: { id } });

  if (!ocorrencia) {
    return NextResponse.json({ error: "Ocorrência não encontrada" }, { status: 404 });
  }

  // Professor só pode apagar as próprias ocorrências e apenas se não foi vista
  if (session.user.role === "PROFESSOR") {
    if (ocorrencia.professorId !== session.user.id) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    if (ocorrencia.vistaPelaSecretaria) {
      return NextResponse.json(
        { error: "Não é possível apagar: a secretaria já visualizou esta ocorrência." },
        { status: 403 }
      );
    }
  }

  // Reverte as estrelas se havia delta
  if (ocorrencia.deltaEstrelas !== 0) {
    const aluno = await prisma.aluno.findUnique({ where: { id: ocorrencia.alunoId } });
    if (aluno) {
      await prisma.aluno.update({
        where: { id: ocorrencia.alunoId },
        data: {
          estrelas: Math.min(10, Math.max(0, aluno.estrelas - ocorrencia.deltaEstrelas)),
        },
      });
    }
  }

  await prisma.ocorrencia.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}