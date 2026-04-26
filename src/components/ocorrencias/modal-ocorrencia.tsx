// src/components/ocorrencias/modal-ocorrencia.tsx
// src/components/ocorrencias/modal-ocorrencia.tsx
"use client";
import { useState, useEffect } from "react";
import { ClipboardList, X, Loader2, Send } from "lucide-react";

interface Aluno { id: string; nome: string; matricula: string; estrelas: number; }
interface Motivo { id: string; titulo: string; positivo: boolean; disciplina?: { id: string; nome: string } | null; }
interface Disciplina { id: string; nome: string; }

interface Props {
  aluno: Aluno;
  turmaId: string;
  motivos: Motivo[];
  disciplinasDoProfessor: Disciplina[];
  onSucesso?: (deltaEstrelas: number, disciplinaId: string) => void;
}

export function ModalOcorrencia({ aluno, turmaId, motivos, disciplinasDoProfessor, onSucesso }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [motivoId, setMotivoId] = useState("");
  const [disciplinaId, setDisciplinaId] = useState(
    disciplinasDoProfessor.length === 1 ? disciplinasDoProfessor[0].id : ""
  );
  const [complemento, setComplemento] = useState("");
  const [deltaEstrelas, setDeltaEstrelas] = useState(0);
  const [estrelasDisciplina, setEstrelasDisciplina] = useState<number | null>(null);
  const [loadingEstrelas, setLoadingEstrelas] = useState(false);

  // Busca estrelas da disciplina selecionada
  useEffect(() => {
    if (!disciplinaId || !open) return;
    setLoadingEstrelas(true);
    fetch(`/api/estrelas/${aluno.id}?disciplinaId=${disciplinaId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        setEstrelasDisciplina(data?.estrelas ?? 5);
      })
      .finally(() => setLoadingEstrelas(false));
  }, [disciplinaId, aluno.id, open]);

  const estrelasBase = estrelasDisciplina ?? aluno.estrelas;
  const estrelasResultante = Math.min(10, Math.max(0, estrelasBase + deltaEstrelas));
  const podeSubtrair = estrelasBase + deltaEstrelas > 0;
  const podeSomar = estrelasBase + deltaEstrelas < 10;

  function handleMotivo(id: string) {
    setMotivoId(id);
    setComplemento("");
    const m = motivos.find((m) => m.id === id);
    if (m) {
      setDeltaEstrelas(m.positivo ? 1 : -1);
      if (m.disciplina && disciplinasDoProfessor.some((d) => d.id === m.disciplina?.id)) {
        setDisciplinaId(m.disciplina.id);
      }
    } else {
      setDeltaEstrelas(0);
    }
  }

  function handleDisciplina(value: string) {
    setDisciplinaId(value);
    setMotivoId("");
    setComplemento("");
    setDeltaEstrelas(0);
    setEstrelasDisciplina(null);
  }

  function handleFechar() {
    setOpen(false);
    setMotivoId("");
    setComplemento("");
    setDeltaEstrelas(0);
    setEstrelasDisciplina(null);
    setDisciplinaId(disciplinasDoProfessor.length === 1 ? disciplinasDoProfessor[0].id : "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!disciplinaId) {
      return alert("Selecione uma disciplina.");
    }
    if (!complemento.trim() && !motivoId) {
      return alert("Selecione um motivo ou preencha a descrição.");
    }

    setLoading(true);
    try {
      const descricaoFinal = complemento.trim() || motivoSelecionado?.titulo || "Ocorrência registrada";

      const res = await fetch("/api/ocorrencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alunoId: aluno.id,
          turmaId,
          motivoId: motivoId || undefined,
          disciplinaId,
          descricao: descricaoFinal,
          deltaEstrelas,
        }),
      });
      if (res.ok) {
        setSucesso(true);
        onSucesso?.(deltaEstrelas, disciplinaId);
        setTimeout(() => { setSucesso(false); handleFechar(); }, 1500);
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao registrar ocorrência.");
      }
    } finally {
      setLoading(false);
    }
  }

  const motivosFiltrados = motivos.filter((m) => {
    if (!m.disciplina) return true;
    if (!disciplinaId) return false;
    return m.disciplina.id === disciplinaId;
  });

  const motivoSelecionado = motivos.find((m) => m.id === motivoId);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"
      >
        <ClipboardList className="w-3.5 h-3.5" /> Registrar ocorrência
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h2 className="font-semibold text-gray-900">Registrar Ocorrência</h2>
                <p className="text-sm text-gray-400 mt-0.5">{aluno.nome} · {aluno.matricula}</p>
              </div>
              <button
                onClick={handleFechar}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {sucesso ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">✓</span>
                </div>
                <p className="font-medium text-gray-900">Ocorrência registrada!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-5">

                {/* Disciplina — sempre obrigatória */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Disciplina <span className="text-red-500">*</span>
                  </label>
                  {disciplinasDoProfessor.length === 1 ? (
                    <div className="px-3 py-2.5 border border-gray-100 rounded-xl text-sm text-gray-600 bg-gray-50">
                      {disciplinasDoProfessor[0].nome}
                    </div>
                  ) : (
                    <select
                      value={disciplinaId}
                      onChange={(e) => handleDisciplina(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione uma disciplina...</option>
                      {disciplinasDoProfessor.map((d) => (
                        <option key={d.id} value={d.id}>{d.nome}</option>
                      ))}
                    </select>
                  )}

                  {/* Estrelas da disciplina selecionada */}
                  {disciplinaId && (
                    <div className="mt-2 flex items-center gap-2">
                      {loadingEstrelas ? (
                        <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                      ) : (
                        <>
                          <span className="text-xs text-gray-400">Estrelas nesta disciplina:</span>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 10 }).map((_, i) => (
                              <span key={i} className={`text-xs ${i < estrelasBase ? "text-yellow-400" : "text-gray-200"}`}>★</span>
                            ))}
                          </div>
                          <span className="text-xs font-medium text-gray-600">{estrelasBase}/10</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Motivo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Motivo</label>
                  <select
                    value={motivoId}
                    onChange={(e) => handleMotivo(e.target.value)}
                    disabled={!disciplinaId}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    <option value="">Selecione um motivo...</option>
                    {motivosFiltrados.filter((m) => !m.positivo).length > 0 && (
                      <optgroup label="Negativos">
                        {motivosFiltrados.filter((m) => !m.positivo).map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.titulo}{m.disciplina ? ` (${m.disciplina.nome})` : ""}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {motivosFiltrados.filter((m) => m.positivo).length > 0 && (
                      <optgroup label="Positivos">
                        {motivosFiltrados.filter((m) => m.positivo).map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.titulo}{m.disciplina ? ` (${m.disciplina.nome})` : ""}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  {!disciplinaId && (
                    <p className="text-xs text-amber-600 mt-1">Selecione uma disciplina primeiro</p>
                  )}
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {motivoSelecionado ? "Complemento" : "Descrição"}
                    {motivoSelecionado && (
                      <span className="text-xs text-gray-400 ml-1 font-normal">(detalhes adicionais)</span>
                    )}
                  </label>
                  <textarea
                    value={complemento}
                    onChange={(e) => setComplemento(e.target.value)}
                    rows={3}
                    placeholder="Descreva os detalhes..."
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* Ajuste de estrelas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ajuste de estrelas
                    {disciplinaId && (
                      <span className="text-xs text-gray-400 ml-1 font-normal">
                        (apenas em {disciplinasDoProfessor.find((d) => d.id === disciplinaId)?.nome})
                      </span>
                    )}
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={!podeSubtrair}
                      onClick={() => setDeltaEstrelas((v) => v - 1)}
                      className="w-8 h-8 rounded-full border border-gray-200 hover:bg-red-50 hover:text-red-600 font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >−</button>
                    <div className="text-center">
                      <span className={`text-lg font-bold w-12 inline-block text-center ${deltaEstrelas > 0 ? "text-green-600" : deltaEstrelas < 0 ? "text-red-600" : "text-gray-400"}`}>
                        {deltaEstrelas > 0 ? `+${deltaEstrelas}` : deltaEstrelas}
                      </span>
                      <p className="text-xs text-gray-400">{estrelasBase} → {estrelasResultante}</p>
                    </div>
                    <button
                      type="button"
                      disabled={!podeSomar}
                      onClick={() => setDeltaEstrelas((v) => v + 1)}
                      className="w-8 h-8 rounded-full border border-gray-200 hover:bg-green-50 hover:text-green-600 font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >+</button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleFechar}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                  >Cancelar</button>
                  <button
                    type="submit"
                    disabled={loading || !disciplinaId || (!complemento.trim() && !motivoId)}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Registrar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}