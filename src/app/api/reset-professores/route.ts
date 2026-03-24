import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const professores = await prisma.user.findMany({
      where: { role: "PROFESSOR" },
      select: { id: true },
    });
    const ids = professores.map((p) => p.id);

    await prisma.account.deleteMany({ where: { userId: { in: ids } } });
    await prisma.session.deleteMany({ where: { userId: { in: ids } } });
    await prisma.lembrete.deleteMany({ where: { professorId: { in: ids } } });
    await prisma.professorDisciplinaTurma.deleteMany({ where: { professorId: { in: ids } } });
    await prisma.professorDisciplina.deleteMany({ where: { professorId: { in: ids } } });
    await prisma.ocorrencia.deleteMany({ where: { professorId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });

    return NextResponse.json({ ok: true, deletados: ids.length });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}