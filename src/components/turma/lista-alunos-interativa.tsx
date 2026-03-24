// src/components/turma/lista-alunos-interativa.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserCircle, Users } from "lucide-react";
import { EstrelasControl } from "@/components/estrelas/estrelas-input";
import { ModalOcorrencia } from "@/components/ocorrencias/modal-ocorrencia";

interface Aluno {
  id: string;
  nome: string;
  matricula: string;
  estrelas: number;
}

interface Motivo {
  id: string;
  titulo: string;
  positivo: boolean;
  disciplina?: { id: string; nome: string } | null;
}

interface Disciplina {
  id: string;
  nome: string;
}

interface Props {
  alunos: Aluno[];
  turmaId: string;
  motivos: Motivo[];
  disciplinasDoProfessor: Disciplina[];
  professorId: string;
}

export function ListaAlunosInterativa({ alunos: alunosIniciais, turmaId, motivos, disciplinasDoProfessor }: Props) {
  const router = useRouter();
  // CORREÇÃO: estado local dos alunos para atualizar estrelas sem recarregar página
  const [alunos, setAlunos] = useState(alunosIniciais);

  function atualizarEstrelas(alunoId: string, novasEstrelas: number) {
    setAlunos((prev) =>
      prev.map((a) => (a.id === alunoId ? { ...a, estrelas: novasEstrelas } : a))
    );
  }

  if (alunos.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <UserCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Nenhum aluno cadastrado nesta turma.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-gray-50 bg-gray-50 grid grid-cols-12 text-xs font-medium text-gray-400 uppercase tracking-wide">
        <span className="col-span-1">#</span>
        <span className="col-span-4">Aluno</span>
        <span className="col-span-3">Matrícula</span>
        <span className="col-span-4">Estrelas</span>
      </div>

      <div className="divide-y divide-gray-50">
        {alunos.map((aluno, idx) => (
          <div key={aluno.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
            <div className="grid grid-cols-12 items-center gap-4">
              <span className="col-span-1 text-sm text-gray-300 font-mono">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <div className="col-span-4">
                <Link
                  href={`/professor/aluno/${aluno.id}`}
                  className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                >
                  {aluno.nome}
                </Link>
              </div>
              <div className="col-span-3">
                <span className="text-xs text-gray-400 font-mono">{aluno.matricula}</span>
              </div>
              <div className="col-span-4">
                <EstrelasControl
                  alunoId={aluno.id}
                  value={aluno.estrelas}
                  onUpdate={(novas) => atualizarEstrelas(aluno.id, novas)}
                />
              </div>
            </div>
            <div className="mt-2 flex justify-end">
              <ModalOcorrencia
                aluno={aluno}
                turmaId={turmaId}
                motivos={motivos}
                disciplinasDoProfessor={disciplinasDoProfessor}
                onSucesso={(deltaEstrelas) => {
                  // CORREÇÃO: atualiza estrelas localmente após registrar ocorrência
                  const novas = Math.min(10, Math.max(0, aluno.estrelas + deltaEstrelas));
                  atualizarEstrelas(aluno.id, novas);
                  router.refresh();
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}