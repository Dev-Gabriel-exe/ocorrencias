"use client";
// src/app/secretaria/motivos/page.tsx
import { useState, useEffect } from "react";
import { Plus, Tag, Trash2, Loader2, X, ThumbsUp, ThumbsDown } from "lucide-react";
import type { MotivoType } from "@/types";

const NIVEIS = [
  { value: "", label: "Todos os níveis" },
  { value: "FUND_I", label: "Fundamental I" },
  { value: "FUND_II", label: "Fundamental II" },
  { value: "MEDIO", label: "Ensino Médio" },
];

export default function MotivosPage() {
  const [motivos, setMotivos] = useState<MotivoType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({ titulo: "", descricao: "", disciplina: "", nivel: "", positivo: false });

  async function carregar() {
    const res = await fetch("/api/motivos");
    if (res.ok) setMotivos(await res.json());
    setLoading(false);
  }

  useEffect(() => { carregar(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    const res = await fetch("/api/motivos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, nivel: form.nivel || null, disciplina: form.disciplina || null }),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ titulo: "", descricao: "", disciplina: "", nivel: "", positivo: false });
      await carregar();
    }
    setSalvando(false);
  }

  const positivos = motivos.filter((m) => m.positivo);
  const negativos = motivos.filter((m) => !m.positivo);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Motivos de Ocorrência</h1>
          <p className="text-gray-500 text-sm mt-1">Configure os motivos disponíveis para os professores</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo motivo
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Novo Motivo</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input required value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ex: Comportamento inadequado"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Descrição opcional"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Disciplina</label>
                  <input value={form.disciplina} onChange={(e) => setForm({ ...form, disciplina: e.target.value })}
                    placeholder="Deixe vazio = geral"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nível</label>
                  <select value={form.nivel} onChange={(e) => setForm({ ...form, nivel: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {NIVEIS.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setForm({ ...form, positivo: false })}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-medium transition-colors ${
                      !form.positivo ? "bg-red-50 border-red-200 text-red-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                    <ThumbsDown className="w-4 h-4" /> Negativo
                  </button>
                  <button type="button" onClick={() => setForm({ ...form, positivo: true })}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-medium transition-colors ${
                      form.positivo ? "bg-green-50 border-green-200 text-green-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                    <ThumbsUp className="w-4 h-4" /> Positivo
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={salvando}
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {salvando && <Loader2 className="w-4 h-4 animate-spin" />}
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Negativos */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ThumbsDown className="w-4 h-4 text-red-500" />
              <h2 className="font-semibold text-gray-900">Negativos ({negativos.length})</h2>
            </div>
            <div className="space-y-2">
              {negativos.map((m) => (
                <div key={m.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-start gap-3 hover:shadow-sm transition-shadow">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{m.titulo}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {m.disciplina && <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{m.disciplina}</span>}
                      {m.nivel && <span className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">{m.nivel}</span>}
                      {!m.disciplina && !m.nivel && <span className="text-xs text-gray-400">Geral</span>}
                    </div>
                  </div>
                </div>
              ))}
              {negativos.length === 0 && <p className="text-sm text-gray-400 text-center py-6">Nenhum motivo negativo</p>}
            </div>
          </div>

          {/* Positivos */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ThumbsUp className="w-4 h-4 text-green-500" />
              <h2 className="font-semibold text-gray-900">Positivos ({positivos.length})</h2>
            </div>
            <div className="space-y-2">
              {positivos.map((m) => (
                <div key={m.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-start gap-3 hover:shadow-sm transition-shadow">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{m.titulo}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {m.disciplina && <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{m.disciplina}</span>}
                      {m.nivel && <span className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">{m.nivel}</span>}
                      {!m.disciplina && !m.nivel && <span className="text-xs text-gray-400">Geral</span>}
                    </div>
                  </div>
                </div>
              ))}
              {positivos.length === 0 && <p className="text-sm text-gray-400 text-center py-6">Nenhum motivo positivo</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
