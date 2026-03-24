// src/app/api/perfil/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true, phone: true,
      bio: true, image: true, role: true, nivelEnsino: true,
      disciplinas: { include: { disciplina: true } },
    },
  });

  if (!user) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  return NextResponse.json({
    ...user,
    disciplinasNomes: user.disciplinas.map((d) => d.disciplina.nome).join(", "),
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { name, phone, bio, disciplinasTexto, nivelEnsino } = await req.json();

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name, phone, bio, nivelEnsino: nivelEnsino || null },
  });

  if (session.user.role === "PROFESSOR" && disciplinasTexto !== undefined) {
    const nomes = (disciplinasTexto as string).split(",").map((s: string) => s.trim()).filter(Boolean);
    await prisma.professorDisciplina.deleteMany({ where: { professorId: session.user.id } });
    for (const nome of nomes) {
      const disciplina = await prisma.disciplina.upsert({
        where: { nome }, update: { ativa: true }, create: { nome },
      });
      await prisma.professorDisciplina.upsert({
        where: { professorId_disciplinaId: { professorId: session.user.id, disciplinaId: disciplina.id } },
        update: {}, create: { professorId: session.user.id, disciplinaId: disciplina.id },
      });
    }
  }

  const atualizado = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { disciplinas: { include: { disciplina: true } } },
  });

  return NextResponse.json({
    ...atualizado,
    disciplinasNomes: atualizado?.disciplinas.map((d) => d.disciplina.nome).join(", ") || "",
  });
}