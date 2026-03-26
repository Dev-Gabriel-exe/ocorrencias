// src/app/professor/lembretes/page.tsx
"use client";

import { useState, useEffect } from "react";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarDays,
  Plus,
  Trash2,
  CheckCircle,
  Circle,
  Loader2,
} from "lucide-react";
import type { LembreteType } from "@/types";

export default function LembretesPage() {
  const [lembretes, setLembretes] = useState<LembreteType[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    dataEvento: "",
  });

  async function carregar() {
    const res = await fetch("/api/lembretes");
    if (res.ok) setLembretes(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

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

  function badge(l: LembreteType) {
    const data = new Date(l.dataEvento);
    if (isToday(data))
      return { label: "Hoje", cls: "bg-yellow-100 text-yellow-700" };
    if (isPast(data))
      return { label: "Atrasado", cls: "bg-red-100 text-red-600" };
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lembretes</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pendentes.length} pendentes • {concluidos.length} concluídos
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Novo
        </button>
      </div>

      {/* FORM */}
      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6 shadow-sm">
          <form onSubmit={handleAdd} className="space-y-4">
            <input
              required
              value={form.titulo}
              onChange={(e) =>
                setForm({ ...form, titulo: e.target.value })
              }
              placeholder="Título"
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />

            <textarea
              value={form.descricao}
              onChange={(e) =>
                setForm({ ...form, descricao: e.target.value })
              }
              placeholder="Descrição"
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />

            <input
              required
              type="datetime-local"
              value={form.dataEvento}
              onChange={(e) =>
                setForm({ ...form, dataEvento: e.target.value })
              }
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={salvando}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700"
              >
                {salvando && <Loader2 className="w-4 h-4 animate-spin" />}
                Salvar
              </button>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-500" />
        </div>
      ) : (
        <>
          {/* PENDENTES */}
          <div className="space-y-3 mb-8">
            {pendentes.map((l) => {
              const b = badge(l);

              return (
                <div
                  key={l.id}
                  className={`bg-white border rounded-2xl p-4 flex gap-4 items-start transition hover:shadow-sm ${
                    b?.label === "Hoje"
                      ? "border-yellow-200 bg-yellow-50"
                      : b?.label === "Atrasado"
                      ? "border-red-200 bg-red-50"
                      : "border-gray-100"
                  }`}
                >
                  <button onClick={() => toggleConcluido(l.id, l.concluido)}>
                    <Circle className="w-5 h-5 text-gray-300 hover:text-blue-500" />
                  </button>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900">
                        {l.titulo}
                      </p>

                      {b && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${b.cls}`}
                        >
                          {b.label}
                        </span>
                      )}
                    </div>

                    {l.descricao && (
                      <p className="text-sm text-gray-500 mt-1">
                        {l.descricao}
                      </p>
                    )}

                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {format(
                        new Date(l.dataEvento),
                        "dd/MM • HH:mm",
                        { locale: ptBR }
                      )}
                    </p>
                  </div>

                  <button onClick={() => handleDelete(l.id)}>
                    <Trash2 className="w-4 h-4 text-gray-300 hover:text-red-500" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* CONCLUÍDOS */}
          {concluidos.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs uppercase text-gray-400">
                Concluídos
              </p>

              {concluidos.map((l) => (
                <div
                  key={l.id}
                  className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-center gap-3 opacity-60"
                >
                  <button onClick={() => toggleConcluido(l.id, l.concluido)}>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </button>

                  <div className="flex-1">
                    <p className="text-sm line-through">{l.titulo}</p>
                  </div>

                  <button onClick={() => handleDelete(l.id)}>
                    <Trash2 className="w-4 h-4 text-gray-300 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}