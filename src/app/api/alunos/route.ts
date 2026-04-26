// src/app/api/alunos/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  const niveis = nivelFilter(session.user.role);

  const alunos = await prisma.aluno.findMany({
    where: {
      ativo: true,
      turma: {
        ativa: true,
        ...(niveis ? { nivel: { in: niveis } } : {}),
      },
      ...(turmaId ? { turmaId } : {}),
    },
    include: {
      turma: { select: { id: true, nome: true, serie: true, nivel: true } },
      _count: {
        select: {
          ocorrencias: true,
          estrelasPorDisciplina: true, // número de disciplinas que compõem a média
        },
      },
    },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(alunos);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role === "PROFESSOR") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { nome, matricula, turmaId, dataNasc, email, telefone } = body;

  if (!nome || !matricula || !turmaId) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  try {
    // CORREÇÃO: se o aluno existia e foi desativado, reativa em vez de criar novo
    const existente = await prisma.aluno.findUnique({ where: { matricula } });

    if (existente) {
      if (existente.ativo) {
        return NextResponse.json({ error: "Matrícula já cadastrada para um aluno ativo." }, { status: 409 });
      }
      // Reativa o aluno com os novos dados
      const aluno = await prisma.aluno.update({
        where: { matricula },
        data: { nome, turmaId, dataNasc: dataNasc ? new Date(dataNasc) : null, email, telefone, ativo: true, estrelas: 5 },
      });
      return NextResponse.json(aluno, { status: 200 });
    }

    const aluno = await prisma.aluno.create({
      data: { nome, matricula, turmaId, dataNasc: dataNasc ? new Date(dataNasc) : null, email, telefone },
    });
    return NextResponse.json(aluno, { status: 201 });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Matrícula já cadastrada" }, { status: 409 });
    }
    throw e;
  }
}