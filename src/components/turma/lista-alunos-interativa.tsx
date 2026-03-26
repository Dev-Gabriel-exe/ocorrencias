// src/components/turma/lista-alunos-interativa.tsx
"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserCircle, Search, Plus, Minus } from "lucide-react";
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

export function ListaAlunosInterativa({
  alunos: alunosIniciais,
  turmaId,
  motivos,
  disciplinasDoProfessor,
}: Props) {
  const router = useRouter();
  const [alunos, setAlunos] = useState(alunosIniciais);
  const [search, setSearch] = useState("");

  function atualizarEstrelas(alunoId: string, novasEstrelas: number) {
    setAlunos((prev) =>
      prev.map((a) => (a.id === alunoId ? { ...a, estrelas: novasEstrelas } : a))
    );
  }

  function alterarRapido(aluno: Aluno, delta: number) {
    const novas = Math.min(10, Math.max(0, aluno.estrelas + delta));
    atualizarEstrelas(aluno.id, novas);
  }

  const alunosFiltrados = useMemo(() => {
    const termo = search.toLowerCase();
    return alunos.filter(
      (a) =>
        a.nome.toLowerCase().includes(termo) ||
        a.matricula.toLowerCase().includes(termo)
    );
  }, [search, alunos]);

  if (alunos.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <UserCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Nenhum aluno cadastrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Busca */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border border-gray-100 rounded-2xl p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar aluno ou matrícula..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent outline-none text-sm"
          />
        </div>
      </div>

      {/* Lista */}
      {alunosFiltrados.length === 0 ? (
        <div className="text-center text-gray-400 py-10">
          Nenhum aluno encontrado.
        </div>
      ) : (
        alunosFiltrados.map((aluno) => (
          <div
            key={aluno.id}
            className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition"
          >
            {/* Top */}
            <div className="flex items-center justify-between gap-3">
              <Link
                href={`/professor/aluno/${aluno.id}`}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-blue-600 font-bold">
                    {aluno.nome.charAt(0)}
                  </span>
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {aluno.nome}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">
                    {aluno.matricula}
                  </p>
                </div>
              </Link>

              <ModalOcorrencia
                aluno={aluno}
                turmaId={turmaId}
                motivos={motivos}
                disciplinasDoProfessor={disciplinasDoProfessor}
                onSucesso={(deltaEstrelas) => {
                  const novas = Math.min(
                    10,
                    Math.max(0, aluno.estrelas + deltaEstrelas)
                  );
                  atualizarEstrelas(aluno.id, novas);
                  router.refresh();
                }}
              />
            </div>

            {/* Estrelas + ações rápidas */}
            <div className="mt-4 flex items-center justify-between gap-3">
              <EstrelasControl
                alunoId={aluno.id}
                value={aluno.estrelas}
                onUpdate={(novas) => atualizarEstrelas(aluno.id, novas)}
              />

              <div className="flex gap-2">
                <button
                  onClick={() => alterarRapido(aluno, -1)}
                  className="p-2 rounded-xl bg-red-50 hover:bg-red-100 transition"
                >
                  <Minus className="w-4 h-4 text-red-500" />
                </button>
                <button
                  onClick={() => alterarRapido(aluno, +1)}
                  className="p-2 rounded-xl bg-green-50 hover:bg-green-100 transition"
                >
                  <Plus className="w-4 h-4 text-green-600" />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}