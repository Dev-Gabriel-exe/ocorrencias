// src/app/api/email/ocorrencia/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enviarOcorrenciasTurma } from "@/lib/email";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "PROFESSOR") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { turmaId } = await req.json();
  if (!turmaId) return NextResponse.json({ error: "turmaId obrigatório" }, { status: 400 });

  // Ocorrências de hoje não enviadas
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  const ocorrencias = await prisma.ocorrencia.findMany({
    where: {
      turmaId,
      professorId: session.user.id,
      data: { gte: hoje, lt: amanha },
    },
    include: {
      aluno: true,
      turma: true,
      professor: true,
      motivo: true,
    },
  });

  if (ocorrencias.length === 0) {
    return NextResponse.json(
      { message: "Nenhuma ocorrência pendente de envio hoje." },
      { status: 200 }
    );
  }

  const turmaNome = ocorrencias[0].turma.nome;
  const professorNome = ocorrencias[0].professor.name || session.user.email!;
  const dataFormatada = format(new Date(), "dd/MM/yyyy", { locale: ptBR });

  const payload = ocorrencias.map((o) => ({
    alunoNome: o.aluno.nome,
    turma: turmaNome,
    professor: professorNome,
    disciplina: o.professor.discipline || undefined,
    motivo: o.motivo?.titulo || "Sem motivo específico",
    descricao: o.descricao,
    data: format(o.data, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }),
    estrelasDelta: o.deltaEstrelas,
    estrelasTotal: o.aluno.estrelas,
  }));

  await enviarOcorrenciasTurma(turmaNome, professorNome, dataFormatada, payload);

  // Marca todas como enviadas
  await prisma.ocorrencia.updateMany({
    where: { id: { in: ocorrencias.map((o) => o.id) } },
    data: {},
  });

  return NextResponse.json({ sent: ocorrencias.length });
}
