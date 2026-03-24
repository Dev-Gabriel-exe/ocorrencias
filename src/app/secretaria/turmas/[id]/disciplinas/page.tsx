// src/app/secretaria/turmas/[id]/disciplinas/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, Loader2, BookOpen, UserPlus, X } from "lucide-react";
import Link from "next/link";

interface Professor {
  id: string;
  name: string | null;
  email: string;
}

interface Disciplina {
  id: string;
  nome: string;
  professores?: Professor[];
}

// CORREÇÃO: estrutura compatível com a nova API
interface ProfessorTurma {
  professorId?: string;
  professor: Professor;
}

interface DisciplinaVinculada {
  disciplina: {
    id: string;
    nome: string;
    professorTurmas: ProfessorTurma[];
  };
}

interface Turma {
  id: string;
  nome: string;
  disciplinas: DisciplinaVinculada[];
}

export default function VincularDisciplinasPage() {
  const params = useParams();
  const turmaId = params.id as string;
  const [turma, setTurma] = useState<Turma | null>(null);
  const [todas, setTodas] = useState<Disciplina[]>([]);
  const [vinculadas, setVinculadas] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState<string | null>(null);
  const [expandida, setExpandida] = useState<string | null>(null);

  async function carregar() {
    const [tRes, dRes] = await Promise.all([
      fetch(`/api/turmas/${turmaId}`),
      fetch("/api/disciplinas"),
    ]);

    if (tRes.ok) {
      const t: Turma = await tRes.json();
      setTurma(t);
      setVinculadas(new Set(t.disciplinas.map((d) => d.disciplina.id)));
    }

    if (dRes.ok) {
      const discs: Disciplina[] = await dRes.json();
      const comProfessores = await Promise.all(
        discs.map(async (d) => {
          const r = await fetch(`/api/disciplinas/${d.id}/professores?turmaId=${turmaId}`);
          if (r.ok) return { ...d, professores: await r.json() };
          return { ...d, professores: [] };
        })
      );
      setTodas(comProfessores);
    }

    setLoading(false);
  }

  useEffect(() => { carregar(); }, [turmaId]);

  async function toggleDisciplina(disciplinaId: string) {
    setSalvando(disciplinaId);
    const ativa = vinculadas.has(disciplinaId);
    await fetch("/api/disciplinas/vinculos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disciplinaId, turmaId, acao: ativa ? "desvincular" : "vincular" }),
    });
    setVinculadas((prev) => {
      const n = new Set(prev);
      ativa ? n.delete(disciplinaId) : n.add(disciplinaId);
      return n;
    });
    setSalvando(null);
    if (ativa) setExpandida(null);
    await carregar();
  }

  async function vincularProfessor(disciplinaId: string, professorId: string) {
    setSalvando(`${disciplinaId}-${professorId}`);
    await fetch("/api/disciplinas/vinculos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disciplinaId, turmaId, professorId, acao: "vincular-professor" }),
    });
    setSalvando(null);
    await carregar();
  }

  async function desvincularProfessor(disciplinaId: string, professorId: string) {
    await fetch("/api/disciplinas/vinculos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disciplinaId, turmaId, professorId, acao: "desvincular-professor" }),
    });
    await carregar();
  }

  // CORREÇÃO: lê professorTurmas de dentro de disciplinas[]
  function getProfessoresDaTurma(disciplinaId: string): ProfessorTurma[] {
    const disc = turma?.disciplinas.find((d) => d.disciplina.id === disciplinaId);
    return disc?.disciplina.professorTurmas ?? [];
  }

  function getProfessoresDisponiveis(disc: Disciplina): Professor[] {
    const jaVinculados = getProfessoresDaTurma(disc.id).map((v) => v.professor.id);
    return (disc.professores ?? []).filter((p) => !jaVinculados.includes(p.id));
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
    </div>
  );

  return (
    <div className="max-w-2xl">
      <Link href={`/secretaria/turmas/${turmaId}`} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar para a turma
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Disciplinas da turma</h1>
        <p className="text-gray-500 text-sm mt-1">
          {turma?.nome} — vincule disciplinas e atribua professores
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex justify-between">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {vinculadas.size} disciplinas vinculadas
          </span>
          <span className="text-xs text-gray-400">{todas.length} disponíveis</span>
        </div>

        <div className="divide-y divide-gray-50">
          {todas.map((disc) => {
            const ativa = vinculadas.has(disc.id);
            const carregando = salvando === disc.id;
            const profsTurma = getProfessoresDaTurma(disc.id);
            const profsDisponiveis = getProfessoresDisponiveis(disc);
            const aberta = expandida === disc.id;

            return (
              <div key={disc.id} className={ativa ? "bg-purple-50/30" : ""}>
                <div
                  className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => !carregando && toggleDisciplina(disc.id)}
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className={`w-4 h-4 ${ativa ? "text-purple-500" : "text-gray-300"}`} />
                    <div>
                      <span className={`text-sm font-medium ${ativa ? "text-purple-900" : "text-gray-700"}`}>
                        {disc.nome}
                      </span>
                      {ativa && profsTurma.length > 0 && (
                        <p className="text-xs text-purple-500 mt-0.5">
                          {profsTurma.map((v) => v.professor.name || v.professor.email).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {ativa && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandida(aberta ? null : disc.id); }}
                        className="text-xs text-purple-600 hover:bg-purple-100 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Professores
                      </button>
                    )}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${ativa ? "bg-purple-600" : "border-2 border-gray-200"}`}>
                      {carregando
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        : ativa ? <Check className="w-3.5 h-3.5 text-white" />
                        : null}
                    </div>
                  </div>
                </div>

                {ativa && aberta && (
                  <div className="px-5 pb-4 bg-purple-50/50 border-t border-purple-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mt-3 mb-2">
                      Professores nesta turma
                    </p>

                    {profsTurma.length > 0 && (
                      <div className="space-y-1.5 mb-3">
                        {profsTurma.map((v) => (
                          <div key={v.professor.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-purple-100">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{v.professor.name || "Sem nome"}</p>
                              <p className="text-xs text-gray-400">{v.professor.email}</p>
                            </div>
                            <button
                              onClick={() => desvincularProfessor(disc.id, v.professor.id)}
                              className="text-gray-300 hover:text-red-400 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {profsDisponiveis.length > 0 ? (
                      <div>
                        <p className="text-xs text-gray-400 mb-1.5">Adicionar professor:</p>
                        <div className="space-y-1.5">
                          {profsDisponiveis.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => vincularProfessor(disc.id, p.id)}
                              disabled={salvando === `${disc.id}-${p.id}`}
                              className="w-full flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-colors text-left"
                            >
                              <div>
                                <p className="text-sm text-gray-700">{p.name || "Sem nome"}</p>
                                <p className="text-xs text-gray-400">{p.email}</p>
                              </div>
                              {salvando === `${disc.id}-${p.id}`
                                ? <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                                : <UserPlus className="w-4 h-4 text-purple-400" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : profsTurma.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">Nenhum professor disponível para esta disciplina.</p>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Todos os professores disponíveis já foram adicionados.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}