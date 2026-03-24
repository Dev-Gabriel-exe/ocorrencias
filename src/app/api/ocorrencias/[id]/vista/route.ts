// src/app/api/ocorrencias/[id]/vista/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/ocorrencias/[id]/vista — marca UMA ocorrência como vista
export async function PATCH(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role === "PROFESSOR") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const ocorrencia = await prisma.ocorrencia.update({
    where: { id },
    data: { vistaPelaSecretaria: true },
  });

  return NextResponse.json(ocorrencia);
}