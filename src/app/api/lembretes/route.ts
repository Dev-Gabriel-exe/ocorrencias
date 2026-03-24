// src/app/api/lembretes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "PROFESSOR") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const lembretes = await prisma.lembrete.findMany({
    where: { professorId: session.user.id },
    orderBy: { dataEvento: "asc" },
  });

  return NextResponse.json(lembretes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "PROFESSOR") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { titulo, descricao, dataEvento } = await req.json();

  if (!titulo || !dataEvento) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const lembrete = await prisma.lembrete.create({
    data: {
      titulo,
      descricao,
      dataEvento: new Date(dataEvento),
      professorId: session.user.id,
    },
  });

  return NextResponse.json(lembrete, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "PROFESSOR") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id, concluido } = await req.json();

  const lembrete = await prisma.lembrete.update({
    where: { id, professorId: session.user.id },
    data: { concluido },
  });

  return NextResponse.json(lembrete);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "PROFESSOR") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  await prisma.lembrete.delete({
    where: { id, professorId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
