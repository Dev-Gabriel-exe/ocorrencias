"use client";
// src/app/professor/lembretes/page.tsx
import { useState, useEffect } from "react";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, Plus, Trash2, CheckCircle, Circle, Loader2 } from "lucide-react";
import type { LembreteType } from "@/types";

export default function LembretesPage() {
  const [lembretes, setLembretes] = useState<LembreteType[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titulo: "", descricao: "", dataEvento: "" });

  async function carregar() {
    const res = await fetch("/api/lembretes");
    if (res.ok) setLembretes(await res.json());
    setLoading(false);
  }

  useEffect(() => { carregar(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    const res = await fetch("/api/lembretes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ titulo: "", descricao: "", dataEvento: "" });
      setShowForm(false);
      await carregar();
    }
    setSalvando(false);
  }

  async function toggleConcluido(id: string, concluido: boolean) {
    await fetch("/api/lembretes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, concluido: !concluido }),
    });
    await carregar();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este lembrete?")) return;
    await fetch(`/api/lembretes?id=${id}`, { method: "DELETE" });
    await carregar();
  }

  const pendentes = lembretes.filter((l) => !l.concluido);
  const concluidos = lembretes.filter((l) => l.concluido);

  function badgeLembrete(l: LembreteType) {
    const data = new Date(l.dataEvento);
    if (isToday(data)) return { label: "Hoje", cls: "bg-orange-100 text-orange-700" };
    if (isPast(data)) return { label: "Atrasado", cls: "bg-red-100 text-red-700" };
    return null;
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lembretes</h1>
          <p className="text-gray-500 text-sm mt-1">Sua agenda de eventos e compromissos</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo lembrete
        </button>
      </div>

      {/* Formulário novo lembrete */}
      {showForm && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Novo lembrete</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <input
                  required
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Título do lembrete *"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <input
                  required
                  type="datetime-local"
                  value={form.dataEvento}
                  onChange={(e) => setForm({ ...form, dataEvento: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <input
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Descrição (opcional)"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={salvando}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {salvando && <Loader2 className="w-4 h-4 animate-spin" />}
                Salvar
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : (
        <>
          {/* Pendentes */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Pendentes ({pendentes.length})
            </h2>
            {pendentes.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <CalendarDays className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Nenhum lembrete pendente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendentes.map((l) => {
                  const badge = badgeLembrete(l);
                  return (
                    <div
                      key={l.id}
                      className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-4 hover:shadow-sm transition-shadow"
                    >
                      <button
                        onClick={() => toggleConcluido(l.id, l.concluido)}
                        className="mt-0.5 text-gray-300 hover:text-blue-500 transition-colors flex-shrink-0"
                      >
                        <Circle className="w-5 h-5" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-900">{l.titulo}</p>
                          {badge && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>
                              {badge.label}
                            </span>
                          )}
                        </div>
                        {l.descricao && (
                          <p className="text-sm text-gray-400 mt-0.5">{l.descricao}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {format(new Date(l.dataEvento), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(l.id)}
                        className="text-gray-200 hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Concluídos */}
          {concluidos.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Concluídos ({concluidos.length})
              </h2>
              <div className="space-y-2">
                {concluidos.map((l) => (
                  <div
                    key={l.id}
                    className="bg-gray-50 rounded-xl border border-gray-100 p-4 flex items-start gap-4 opacity-60"
                  >
                    <button
                      onClick={() => toggleConcluido(l.id, l.concluido)}
                      className="mt-0.5 text-green-400 flex-shrink-0"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-500 line-through">{l.titulo}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {format(new Date(l.dataEvento), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(l.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
