// src/types/index.ts
import type { Role, Nivel } from "@prisma/client";

export type { Role, Nivel };

export interface TurmaComContagem {
  id: string;
  nome: string;
  serie: string;
  turno: string;
  nivel: Nivel;
  anoLetivo: number;
  ativa: boolean;
  _count: {
    alunos: number;
    ocorrencias: number;
  };
}

export interface AlunoComOcorrencias {
  id: string;
  nome: string;
  matricula: string;
  email?: string | null;
  foto?: string | null;
  estrelas: number;
  ativo: boolean;
  turmaId: string;
  turma: {
    id: string;
    nome: string;
    serie: string;
  };
  _count: {
    ocorrencias: number;
  };
}

export interface OcorrenciaCompleta {
  id: string;
  data: string;
  descricao: string;
  deltaEstrelas: number;
  vistaPelaSecretaria: boolean;
  aluno: {
    id: string;
    nome: string;
    matricula: string;
    estrelas: number;
  };
  turma: {
    id: string;
    nome: string;
  };
  professor: {
    id: string;
    name?: string | null;
    email: string;
    discipline?: string | null;
  };
  motivo?: {
    id: string;
    titulo: string;
    positivo: boolean;
  } | null;
  disciplina?: {
    id: string;
    nome: string;
  } | null;
}

export interface LembreteType {
  id: string;
  titulo: string;
  descricao?: string | null;
  dataEvento: string;
  concluido: boolean;
  createdAt: string;
}

export interface MotivoType {
  id: string;
  titulo: string;
  descricao?: string | null;
  disciplinaId?: string | null;
  disciplina?: { id: string; nome: string } | null;
  nivel?: Nivel | null;
  positivo: boolean;
  ativo: boolean;
}

export interface DadoGraficoTurma {
  data: string;
  ocorrencias: number;
  positivas: number;
  negativas: number;
}

export interface DadoGraficoEstrelas {
  data: string;
  estrelas: number;
}

export interface DadoGraficoPizza {
  name: string;
  value: number;
  color: string;
}

export interface RelatorioAluno {
  aluno: AlunoComOcorrencias;
  ocorrencias: OcorrenciaCompleta[];
  evolucaoEstrelas: DadoGraficoEstrelas[];
  totalPositivas: number;
  totalNegativas: number;
}

export interface FormOcorrencia {
  alunoId: string;
  turmaId: string;
  motivoId?: string;
  disciplinaId?: string;
  descricao: string;
  deltaEstrelas: number;
}

export interface FormLembrete {
  titulo: string;
  descricao?: string;
  dataEvento: string;
}