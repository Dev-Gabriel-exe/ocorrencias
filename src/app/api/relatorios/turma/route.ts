// src/app/api/relatorios/turma/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format, eachDayOfInterval, subDays } from "date-fns";
import type { Nivel } from "@prisma/client";

function nivelFilter(role: string): Nivel[] | undefined {
  if (role === "SECRETARIA_FUND1") return ["FUND_I"];
  if (role === "SECRETARIA_FUND2") return ["FUND_II", "MEDIO"];
  return undefined;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const turmaId = searchParams.get("turmaId");
  const dias = parseInt(searchParams.get("dias") || "30");
  const niveis = nivelFilter(session.user.role);

  const dataFim = new Date();
  const dataInicio = subDays(dataFim, dias);

  const whereBase: Record<string, unknown> = {
    data: { gte: dataInicio, lte: dataFim },
    aluno: { ativo: true },
  };
  if (turmaId) whereBase.turmaId = turmaId;
  if (session.user.role === "PROFESSOR") whereBase.professorId = session.user.id;
  if (niveis) whereBase.turma = { nivel: { in: niveis }, ativa: true };

  const ocorrencias = await prisma.ocorrencia.findMany({
    where: whereBase,
    include: {
      motivo: { select: { titulo: true, positivo: true } },
      aluno: { select: { id: true, nome: true, estrelas: true, turmaId: true } },
      turma: { select: { id: true, nome: true, nivel: true } },
      professor: { select: { id: true, name: true } },
      disciplina: { select: { id: true, nome: true } },
    },
    orderBy: { data: "asc" },
  });

  // Filtro de alunos para média e ranking (todos, sem take)
  const whereAlunos = {
    ativo: true,
    turma: {
      ativa: true,
      ...(niveis ? { nivel: { in: niveis } } : {}),
      ...(turmaId ? { id: turmaId } : {}),
    },
  };

  // Média usa aggregate — eficiente e correto (todos os alunos)
  const agregado = await prisma.aluno.aggregate({
    where: whereAlunos,
    _avg: { estrelas: true },
    _count: { id: true },
  });

  const mediaEstrelas = agregado._avg.estrelas !== null
    ? agregado._avg.estrelas.toFixed(1)
    : "0";
  const totalAlunos = agregado._count.id;

  // Ranking top 10 — busca separada só para esse fim
  const topAlunosRanking = await prisma.aluno.findMany({
    where: whereAlunos,
    select: { id: true, nome: true, estrelas: true, turma: { select: { nome: true } } },
    orderBy: { estrelas: "desc" },
    take: 10,
  });

  // --- Por dia ---
  const diasIntervalo = eachDayOfInterval({ start: dataInicio, end: dataFim });
  const porDia = diasIntervalo.map((dia) => {
    const key = format(dia, "yyyy-MM-dd");
    const doDia = ocorrencias.filter((o) => format(o.data, "yyyy-MM-dd") === key);
    return {
      data: format(dia, "dd/MM"),
      ocorrencias: doDia.length,
      positivas: doDia.filter((o) => o.motivo?.positivo).length,
      negativas: doDia.filter((o) => !o.motivo?.positivo).length,
    };
  });

  // --- Por motivo ---
  const motivoMap: Record<string, number> = {};
  ocorrencias.forEach((o) => {
    const titulo = o.motivo?.titulo || "Sem motivo";
    motivoMap[titulo] = (motivoMap[titulo] || 0) + 1;
  });
  const CORES = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4"];
  const porMotivo = Object.entries(motivoMap)
    .sort((a, b) => b[1] - a[1]).slice(0, 7)
    .map(([name, value], i) => ({ name, value, color: CORES[i % CORES.length] }));

  // --- Por disciplina ---
  const disciplinaMap: Record<string, { nome: string; total: number; positivas: number; negativas: number }> = {};
  ocorrencias.forEach((o) => {
    const nome = o.disciplina?.nome || "Sem disciplina";
    const id = o.disciplina?.id || "sem";
    if (!disciplinaMap[id]) disciplinaMap[id] = { nome, total: 0, positivas: 0, negativas: 0 };
    disciplinaMap[id].total++;
    if (o.motivo?.positivo) disciplinaMap[id].positivas++;
    else disciplinaMap[id].negativas++;
  });
  const porDisciplina = Object.values(disciplinaMap).sort((a, b) => b.total - a.total);

  // --- Por turma ---
  const turmaMap: Record<string, { nome: string; nivel: string; total: number; positivas: number; negativas: number }> = {};
  ocorrencias.forEach((o) => {
    const id = o.turma.id;
    if (!turmaMap[id]) turmaMap[id] = { nome: o.turma.nome, nivel: o.turma.nivel, total: 0, positivas: 0, negativas: 0 };
    turmaMap[id].total++;
    if (o.motivo?.positivo) turmaMap[id].positivas++;
    else turmaMap[id].negativas++;
  });
  const porTurma = Object.values(turmaMap).sort((a, b) => b.total - a.total);

  // --- Por professor ---
  const professorMap: Record<string, { nome: string; total: number; positivas: number; negativas: number }> = {};
  ocorrencias.forEach((o) => {
    const id = o.professor.id;
    if (!professorMap[id]) professorMap[id] = { nome: o.professor.name || "—", total: 0, positivas: 0, negativas: 0 };
    professorMap[id].total++;
    if (o.motivo?.positivo) professorMap[id].positivas++;
    else professorMap[id].negativas++;
  });
  const porProfessor = Object.values(professorMap).sort((a, b) => b.total - a.total);

  // --- Top alunos com mais ocorrências (no período) ---
  const alunoMap: Record<string, { nome: string; total: number; negativas: number; positivas: number; estrelas: number }> = {};
  ocorrencias.forEach((o) => {
    if (!alunoMap[o.alunoId]) {
      alunoMap[o.alunoId] = { nome: o.aluno.nome, total: 0, negativas: 0, positivas: 0, estrelas: o.aluno.estrelas };
    }
    alunoMap[o.alunoId].total++;
    if (o.motivo?.positivo) alunoMap[o.alunoId].positivas++;
    else alunoMap[o.alunoId].negativas++;
  });
  const topAlunos = Object.values(alunoMap).sort((a, b) => b.total - a.total).slice(0, 10);
  const todosAlunosComOcorrencia = Object.keys(alunoMap); // IDs de TODOS os alunos com ocorrências

  // --- Ranking melhores alunos ---
  const rankingMelhores = topAlunosRanking.map((a) => {
    const stats = alunoMap[a.id];
    return {
      nome: a.nome,
      turma: a.turma.nome,
      estrelas: a.estrelas,
      positivas: stats?.positivas ?? 0,
      negativas: stats?.negativas ?? 0,
      score: a.estrelas + (stats?.positivas ?? 0) - (stats?.negativas ?? 0),
    };
  }).sort((a, b) => b.score - a.score);

  return NextResponse.json({
    porDia,
    porMotivo,
    porDisciplina,
    porTurma,
    porProfessor,
    topAlunos,
    todosAlunosComOcorrencia,
    rankingMelhores,
    totalOcorrencias: ocorrencias.length,
    totalPositivas: ocorrencias.filter((o) => o.motivo?.positivo).length,
    totalNegativas: ocorrencias.filter((o) => !o.motivo?.positivo).length,
    mediaEstrelas,
    totalAlunos,
  });
}