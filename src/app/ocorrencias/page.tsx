// src/app/ocorrencias/page.ts
"use client";
import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, Loader2, Eye, EyeOff, School } from "lucide-react";

interface Turma {
  id: string; nome: string; nivel: string;
  ocorrencias?: { id: string }[];
  _count: { alunos: number };
}

interface Ocorrencia {
  id: string; data: string; descricao: string; deltaEstrelas: number; vistaPelaSecretaria: boolean;
  aluno: { nome: string; matricula: string };
  professor: { name: string | null; email: string };
  motivo: { titulo: string; positivo: boolean } | null;
  disciplina: { nome: string } | null;
}

const nivelLabel: Record<string, string> = { FUND_I: "Fund. I", FUND_II: "Fund. II", MEDIO: "Médio" };
const nivelColor: Record<string, string> = {
  FUND_I: "bg-green-100 text-green-700", FUND_II: "bg-blue-100 text-blue-700", MEDIO: "bg-purple-100 text-purple-700",
};

export default function OcorrenciasSecretariaPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState<string | null>(null);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [loadingTurmas, setLoadingTurmas] = useState(true);
  const [loadingOcorrencias, setLoadingOcorrencias] = useState(false);
  const [filtroDisciplina, setFiltroDisciplina] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "positivo" | "negativo">("todos");
  const [apenasNaoVistas, setApenasNaoVistas] = useState(false);
  const [disciplinas, setDisciplinas] = useState<string[]>([]);

  async function carregarTurmas() {
    const res = await fetch("/api/turmas?comNotificacoes=true");
    if (res.ok) setTurmas(await res.json());
    setLoadingTurmas(false);
  }

  const carregarOcorrencias = useCallback(async (turmaId: string) => {
    setLoadingOcorrencias(true);
    const params = new URLSearchParams({ turmaId });
    if (apenasNaoVistas) params.set("apenasNaoVistas", "true");
    const res = await fetch(`/api/ocorrencias?${params}`);
    if (res.ok) {
      const data: Ocorrencia[] = await res.json();
      setOcorrencias(data);
      setDisciplinas([...new Set(data.map((o) => o.disciplina?.nome).filter(Boolean))] as string[]);
    }
    setLoadingOcorrencias(false);
  }, [apenasNaoVistas]);

  useEffect(() => { carregarTurmas(); }, []);
  useEffect(() => { if (turmaSelecionada) carregarOcorrencias(turmaSelecionada); }, [turmaSelecionada, apenasNaoVistas, carregarOcorrencias]);

  async function marcarTodasVistas() {
    if (!turmaSelecionada) return;
    await fetch(`/api/ocorrencias/${turmaSelecionada}/vista`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ turmaId: turmaSelecionada }),
    });
    await carregarOcorrencias(turmaSelecionada);
    await carregarTurmas();
  }

  async function marcarVista(id: string) {
    await fetch(`/api/ocorrencias/${id}/vista`, { method: "PATCH" });
    setOcorrencias((prev) => prev.map((o) => o.id === id ? { ...o, vistaPelaSecretaria: true } : o));
    await carregarTurmas();
  }

  const filtradas = ocorrencias.filter((o) => {
    if (filtroDisciplina && o.disciplina?.nome !== filtroDisciplina) return false;
    if (filtroTipo === "positivo" && !o.motivo?.positivo) return false;
    if (filtroTipo === "negativo" && o.motivo?.positivo) return false;
    return true;
  });

  const naoVistasNaTurma = turmas.find((t) => t.id === turmaSelecionada)?.ocorrencias?.length ?? 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ocorrências</h1>
        <p className="text-gray-500 text-sm mt-1">Acompanhe as ocorrências registradas pelos professores</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Turmas</h2>
          {loadingTurmas ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-purple-500" /></div>
          ) : (
            <div className="space-y-2">
              {turmas.map((turma) => {
                const naoVistas = turma.ocorrencias?.length ?? 0;
                const ativa = turmaSelecionada === turma.id;
                return (
                  <button key={turma.id} onClick={() => setTurmaSelecionada(turma.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${ativa ? "bg-purple-50 border-purple-200" : "bg-white border-gray-100 hover:border-purple-100"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <School className={`w-4 h-4 ${ativa ? "text-purple-600" : "text-gray-400"}`} />
                        <span className={`text-sm font-medium ${ativa ? "text-purple-800" : "text-gray-800"}`}>{turma.nome}</span>
                      </div>
                      {naoVistas > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{naoVistas}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 ml-6">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${nivelColor[turma.nivel]}`}>{nivelLabel[turma.nivel]}</span>
                      <span className="text-xs text-gray-400">{turma._count.alunos} alunos</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {!turmaSelecionada ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <School className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Selecione uma turma para ver as ocorrências</p>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap gap-3 mb-4 items-center">
                <select value={filtroDisciplina} onChange={(e) => setFiltroDisciplina(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                  
                  {disciplinas.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value as "todos" | "positivo" | "negativo")}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="todos">Todos os tipos</option>
                  <option value="positivo">Positivas</option>
                  <option value="negativo">Negativas</option>
                </select>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={apenasNaoVistas} onChange={(e) => setApenasNaoVistas(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600" />
                  <span className="text-sm text-gray-600">Não vistas</span>
                </label>
                {naoVistasNaTurma > 0 && (
                  <button onClick={marcarTodasVistas}
                    className="ml-auto flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-xl text-xs font-medium hover:bg-purple-700">
                    <CheckCircle className="w-3.5 h-3.5" /> Marcar todas vistas
                  </button>
                )}
              </div>

              {loadingOcorrencias ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-purple-500" /></div>
              ) : filtradas.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                  <p className="text-gray-400 text-sm">Nenhuma ocorrência encontrada.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtradas.map((o) => (
                    <div key={o.id}
                      className={`bg-white rounded-xl border px-5 py-4 ${!o.vistaPelaSecretaria ? "border-orange-200 bg-orange-50/30" : "border-gray-100"}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${o.motivo?.positivo ? "bg-green-400" : "bg-red-400"}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-medium text-sm text-gray-900">{o.aluno.nome}</span>
                              {o.disciplina && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">{o.disciplina.nome}</span>
                              )}
                              {o.motivo && (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${o.motivo.positivo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                  {o.motivo.titulo}
                                </span>
                              )}
                              {o.deltaEstrelas !== 0 && (
                                <span className={`text-xs font-bold ${o.deltaEstrelas > 0 ? "text-green-600" : "text-red-600"}`}>
                                  {o.deltaEstrelas > 0 ? `+${o.deltaEstrelas}` : o.deltaEstrelas} ⭐
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{o.descricao}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Prof. {o.professor.name || o.professor.email} · {format(new Date(o.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        {!o.vistaPelaSecretaria ? (
                          <button onClick={() => marcarVista(o.id)}
                            className="flex-shrink-0 flex items-center gap-1.5 text-xs text-purple-600 hover:bg-purple-50 px-2 py-1 rounded-lg transition-colors">
                            <Eye className="w-3.5 h-3.5" /> Marcar vista
                          </button>
                        ) : (
                          <span className="flex-shrink-0 flex items-center gap-1 text-xs text-gray-300">
                            <EyeOff className="w-3.5 h-3.5" /> Vista
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}