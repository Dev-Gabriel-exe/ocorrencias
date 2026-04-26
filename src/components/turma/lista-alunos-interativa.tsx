// src/components/turma/lista-alunos-interativa.tsx
"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserCircle, Search } from "lucide-react";
import { ModalOcorrencia } from "@/components/ocorrencias/modal-ocorrencia";

interface EstrelasDisciplina {
  disciplinaId: string;
  estrelas: number;
}

interface Aluno {
  id: string;
  nome: string;
  matricula: string;
  estrelas: number;
  estrelasPorDisciplina: EstrelasDisciplina[];
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

  function atualizarEstrelasDisciplina(alunoId: string, disciplinaId: string, delta: number) {
    setAlunos((prev) =>
      prev.map((a) => {
        if (a.id !== alunoId) return a;
        return {
          ...a,
          estrelasPorDisciplina: a.estrelasPorDisciplina.map((e) =>
            e.disciplinaId === disciplinaId
              ? { ...e, estrelas: Math.min(10, Math.max(0, e.estrelas + delta)) }
              : e
          ),
        };
      })
    );
  }

  const alunosFiltrados = useMemo(() => {
    const termo = search.toLowerCase();
    return alunos.filter(
      (a) => a.nome.toLowerCase().includes(termo) || a.matricula.toLowerCase().includes(termo)
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

      {alunosFiltrados.length === 0 ? (
        <div className="text-center text-gray-400 py-10">Nenhum aluno encontrado.</div>
      ) : (
        alunosFiltrados.map((aluno) => (
          <div key={aluno.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between gap-3">
              <Link href={`/professor/aluno/${aluno.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-blue-600 font-bold">{aluno.nome.charAt(0)}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{aluno.nome}</p>
                  <p className="text-xs text-gray-400 font-mono">{aluno.matricula}</p>
                </div>
              </Link>

              <ModalOcorrencia
                aluno={aluno}
                turmaId={turmaId}
                motivos={motivos}
                disciplinasDoProfessor={disciplinasDoProfessor}
                onSucesso={(delta, disciplinaId) => {
                  if (disciplinaId) {
                    atualizarEstrelasDisciplina(aluno.id, disciplinaId, delta);
                  }
                  router.refresh();
                }}
              />
            </div>

            {/* Estrelas por disciplina do professor */}
            <div className="mt-3 space-y-1.5">
              {disciplinasDoProfessor.map((disc) => {
                const reg = aluno.estrelasPorDisciplina.find((e) => e.disciplinaId === disc.id);
                const estrelas = reg?.estrelas ?? 5;
                return (
                  <div key={disc.id} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-24 truncate">{disc.nome}:</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <span key={i} className={`text-xs ${i < estrelas ? "text-yellow-400" : "text-gray-200"}`}>★</span>
                      ))}
                    </div>
                    <span className="text-xs font-medium text-gray-500">{estrelas}/10</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}