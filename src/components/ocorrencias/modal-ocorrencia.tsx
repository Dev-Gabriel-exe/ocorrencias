// src/components/ocorrencias/modal-ocorrencia.tsx
"use client";
import { useState } from "react";
import { ClipboardList, X, Loader2, Send } from "lucide-react";

interface Aluno { id: string; nome: string; matricula: string; estrelas: number; }
interface Motivo { id: string; titulo: string; positivo: boolean; disciplina?: { id: string; nome: string } | null; }
interface Disciplina { id: string; nome: string; }

interface Props {
  aluno: Aluno;
  turmaId: string;
  motivos: Motivo[];
  disciplinasDoProfessor: Disciplina[];
}

export function ModalOcorrencia({ aluno, turmaId, motivos, disciplinasDoProfessor }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [motivoId, setMotivoId] = useState("");
  const [disciplinaId, setDisciplinaId] = useState(
    disciplinasDoProfessor.length === 1 ? disciplinasDoProfessor[0].id : ""
  );
  const [descricao, setDescricao] = useState("");
  const [deltaEstrelas, setDeltaEstrelas] = useState(0);

  const temMais = disciplinasDoProfessor.length > 1;

  function handleMotivo(id: string) {
    setMotivoId(id);
    const m = motivos.find((m) => m.id === id);
    if (m) {
      setDeltaEstrelas(m.positivo ? 1 : -1);
      if (m.disciplina && temMais) {
        const d = disciplinasDoProfessor.find((d) => d.id === m.disciplina?.id);
        if (d) setDisciplinaId(d.id);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (temMais && !disciplinaId) return alert("Selecione a disciplina.");
    setLoading(true);
    try {
      const res = await fetch("/api/ocorrencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alunoId: aluno.id, turmaId, motivoId: motivoId || undefined, disciplinaId: disciplinaId || undefined, descricao, deltaEstrelas }),
      });
      if (res.ok) {
        setSucesso(true);
        setTimeout(() => { setOpen(false); setSucesso(false); setMotivoId(""); setDescricao(""); setDeltaEstrelas(0); setDisciplinaId(disciplinasDoProfessor.length === 1 ? disciplinasDoProfessor[0].id : ""); }, 1500);
      }
    } finally { setLoading(false); }
  }

  const motivosFiltrados = motivos.filter((m) => !m.disciplina || !disciplinaId || m.disciplina.id === disciplinaId);

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors">
        <ClipboardList className="w-3.5 h-3.5" /> Registrar ocorrência
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="font-semibold text-gray-900">Registrar Ocorrência</h2>
                <p className="text-sm text-gray-400 mt-0.5">{aluno.nome} · {aluno.matricula}</p>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {sucesso ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">✓</span>
                </div>
                <p className="font-medium text-gray-900">Ocorrência registrada!</p>
                <p className="text-sm text-gray-400 mt-1">Visível para a secretaria.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {temMais && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Disciplina <span className="text-red-500">*</span></label>
                    <select required value={disciplinaId} onChange={(e) => setDisciplinaId(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Selecione...</option>
                      {disciplinasDoProfessor.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Motivo</label>
                  <select value={motivoId} onChange={(e) => handleMotivo(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Selecione um motivo...</option>
                    <optgroup label="Negativos">
                      {motivosFiltrados.filter((m) => !m.positivo).map((m) => (
                        <option key={m.id} value={m.id}>{m.titulo}{m.disciplina ? ` (${m.disciplina.nome})` : ""}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Positivos">
                      {motivosFiltrados.filter((m) => m.positivo).map((m) => (
                        <option key={m.id} value={m.id}>{m.titulo}{m.disciplina ? ` (${m.disciplina.nome})` : ""}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição <span className="text-red-500">*</span></label>
                  <textarea required value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3}
                    placeholder="Descreva o que ocorreu..."
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ajuste de estrelas</label>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setDeltaEstrelas((v) => Math.max(-10, v - 1))}
                      className="w-8 h-8 rounded-full border border-gray-200 hover:bg-red-50 hover:text-red-600 font-bold transition-colors">−</button>
                    <span className={`text-lg font-bold w-12 text-center ${deltaEstrelas > 0 ? "text-green-600" : deltaEstrelas < 0 ? "text-red-600" : "text-gray-400"}`}>
                      {deltaEstrelas > 0 ? `+${deltaEstrelas}` : deltaEstrelas}
                    </span>
                    <button type="button" onClick={() => setDeltaEstrelas((v) => Math.min(10, v + 1))}
                      className="w-8 h-8 rounded-full border border-gray-200 hover:bg-green-50 hover:text-green-600 font-bold transition-colors">+</button>
                    <span className="text-sm text-gray-400">atual: {aluno.estrelas}/10</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setOpen(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
                  <button type="submit" disabled={loading || !descricao.trim()}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Registrar
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