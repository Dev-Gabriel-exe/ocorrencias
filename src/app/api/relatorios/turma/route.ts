// src/app/api/relatorios/turma/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format, eachDayOfInterval, subDays } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const turmaId = searchParams.get("turmaId");
  const dias = parseInt(searchParams.get("dias") || "30");

  const dataFim = new Date();
  const dataInicio = subDays(dataFim, dias);

  const where: Record<string, unknown> = {
    data: { gte: dataInicio, lte: dataFim },
  };

  if (turmaId) where.turmaId = turmaId;
  if (session.user.role === "PROFESSOR") where.professorId = session.user.id;

  const ocorrencias = await prisma.ocorrencia.findMany({
    where,
    include: {
      motivo: { select: { titulo: true, positivo: true } },
      aluno: { select: { nome: true } },
    },
    orderBy: { data: "asc" },
  });

  // Agrupa por dia
  const dias_intervalo = eachDayOfInterval({ start: dataInicio, end: dataFim });
  const porDia = dias_intervalo.map((dia) => {
    const key = format(dia, "yyyy-MM-dd");
    const do_dia = ocorrencias.filter(
      (o) => format(o.data, "yyyy-MM-dd") === key
    );
    return {
      data: format(dia, "dd/MM"),
      ocorrencias: do_dia.length,
      positivas: do_dia.filter((o) => o.motivo?.positivo).length,
      negativas: do_dia.filter((o) => !o.motivo?.positivo).length,
    };
  });

  // Distribuição por motivo
  const motivoMap: Record<string, number> = {};
  ocorrencias.forEach((o) => {
    const titulo = o.motivo?.titulo || "Sem motivo";
    motivoMap[titulo] = (motivoMap[titulo] || 0) + 1;
  });

  const CORES = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4"];
  const porMotivo = Object.entries(motivoMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([name, value], i) => ({ name, value, color: CORES[i % CORES.length] }));

  // Top alunos com mais ocorrências
  const alunoMap: Record<string, { nome: string; total: number; negativas: number }> = {};
  ocorrencias.forEach((o) => {
    if (!alunoMap[o.alunoId]) {
      alunoMap[o.alunoId] = { nome: o.aluno.nome, total: 0, negativas: 0 };
    }
    alunoMap[o.alunoId].total++;
    if (!o.motivo?.positivo) alunoMap[o.alunoId].negativas++;
  });

  const topAlunos = Object.values(alunoMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  return NextResponse.json({
    porDia,
    porMotivo,
    topAlunos,
    totalOcorrencias: ocorrencias.length,
    totalPositivas: ocorrencias.filter((o) => o.motivo?.positivo).length,
    totalNegativas: ocorrencias.filter((o) => !o.motivo?.positivo).length,
  });
}
