import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role === "PROFESSOR") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const { name, role, disciplinasIds } = await req.json();

  const professor = await prisma.user.update({
    where: { id },
    data: {
      name,
      role,
      disciplinas: {
        deleteMany: {},
        create: (disciplinasIds as string[]).map((disciplinaId) => ({ disciplinaId })),
      },
    },
  });
  return NextResponse.json(professor);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role === "PROFESSOR") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await params;

  // Não pode apagar a si mesmo
  if (session.user.id === id) {
    return NextResponse.json({ error: "Você não pode apagar sua própria conta." }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}