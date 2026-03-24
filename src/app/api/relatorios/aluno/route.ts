// src/app/api/relatorios/aluno/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format, subDays } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const alunoId = searchParams.get("alunoId");
  const dias = parseInt(searchParams.get("dias") || "90");

  if (!alunoId) return NextResponse.json({ error: "alunoId obrigatório" }, { status: 400 });

  const dataFim = new Date();
  const dataInicio = subDays(dataFim, dias);

  const aluno = await prisma.aluno.findUnique({
    where: { id: alunoId },
    include: { turma: { select: { id: true, nome: true, serie: true } } },
  });

  if (!aluno) return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });

  const ocorrencias = await prisma.ocorrencia.findMany({
    where: { alunoId, data: { gte: dataInicio, lte: dataFim } },
    include: {
      professor: { select: { name: true, disciplinas: { include: { disciplina: { select: { nome: true } } } } } },
      motivo: { select: { titulo: true, positivo: true } },
    },
    orderBy: { data: "asc" },
  });

  // Evolução de estrelas ao longo do tempo (reconstrói a linha do tempo)
  let estrelasSimuladas = 5; // ponto de partida estimado
  const evolucaoEstrelas = ocorrencias.map((o) => {
    estrelasSimuladas = Math.min(10, Math.max(0, estrelasSimuladas + o.deltaEstrelas));
    return {
      data: format(o.data, "dd/MM"),
      estrelas: estrelasSimuladas,
    };
  });

  // Adiciona ponto atual no final
  if (ocorrencias.length > 0) {
    evolucaoEstrelas.push({
      data: format(new Date(), "dd/MM"),
      estrelas: aluno.estrelas,
    });
  }

  return NextResponse.json({
    aluno: {
      id: aluno.id,
      nome: aluno.nome,
      matricula: aluno.matricula,
      estrelas: aluno.estrelas,
      turma: aluno.turma,
    },
    ocorrencias: ocorrencias.map((o) => ({
      id: o.id,
      data: o.data,
      descricao: o.descricao,
      deltaEstrelas: o.deltaEstrelas,
      professor: o.professor,
      motivo: o.motivo,
    })),
    evolucaoEstrelas,
    totalOcorrencias: ocorrencias.length,
    totalPositivas: ocorrencias.filter((o) => o.motivo?.positivo).length,
    totalNegativas: ocorrencias.filter((o) => !o.motivo?.positivo).length,
  });
}
