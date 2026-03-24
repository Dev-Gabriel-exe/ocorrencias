// src/app/secretaria/motivos/page.tsx
"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, X, ThumbsUp, ThumbsDown, Pencil } from "lucide-react";
import type { MotivoType } from "@/types";

const NIVEL_LABELS: Record<string, string> = {
  FUND_I: "Fund. I",
  FUND_II: "Fund. II",
  MEDIO: "Médio",
};

const NIVEIS_ALL = [
  { value: "FUND_I", label: "Fundamental I" },
  { value: "FUND_II", label: "Fundamental II" },
  { value: "MEDIO", label: "Ensino Médio" },
];

interface Disciplina { id: string; nome: string; }

const defaultForm = {
  titulo: "",
  descricao: "",
  disciplinaId: "",
  nivel: "",
  positivo: false as boolean,
  disciplinasExcluidasIds: [] as string[],
};

export default function MotivosPage() {
  const [role, setRole] = useState<string>("");
  const [motivos, setMotivos] = useState<MotivoType[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  // Busca role via session
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s) => setRole(s?.user?.role ?? ""));
  }, []);

  const niveisDisponiveis =
    role === "SECRETARIA_FUND1"
      ? NIVEIS_ALL.filter((n) => n.value === "FUND_I")
      : role === "SECRETARIA_FUND2"
      ? NIVEIS_ALL.filter((n) => n.value !== "FUND_I")
      : NIVEIS_ALL;

  // GERAL exige nivel antes de liberar disciplina
  const disciplinaDisabled = role === "SECRETARIA_GERAL" && !form.nivel;

  async function carregar() {
    const [mRes, dRes] = await Promise.all([
      fetch("/api/motivos"),
      fetch("/api/disciplinas"),
    ]);
    if (mRes.ok) setMotivos(await mRes.json());
    if (dRes.ok) setDisciplinas(await dRes.json());
    setLoading(false);
  }

  useEffect(() => { carregar(); }, []);

  function openCreate() {
    setEditingId(null);
    setForm({
      ...defaultForm,
      nivel: role === "SECRETARIA_FUND1" ? "FUND_I" : "",
    });
    setShowForm(true);
  }

  function openEdit(m: MotivoType) {
    setEditingId(m.id);
    setForm({
      titulo: m.titulo,
      descricao: m.descricao ?? "",
      disciplinaId: m.disciplinaId ?? "",
      nivel: m.nivel ?? "",
      positivo: m.positivo,
      disciplinasExcluidasIds: m.disciplinasExcluidas?.map((d) => d.id) ?? [],
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(defaultForm);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);

    const url = editingId ? `/api/motivos/${editingId}` : "/api/motivos";
    const method = editingId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        disciplinaId: form.disciplinaId || null,
        nivel: form.nivel || null,
      }),
    });

    if (res.ok) {
      closeForm();
      await carregar();
    } else {
      alert("Erro ao salvar motivo.");
    }
    setSalvando(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este motivo?\nSe houver ocorrências vinculadas, ele será apenas desativado.")) return;
    const res = await fetch(`/api/motivos/${id}`, { method: "DELETE" });
    if (res.ok) await carregar();
    else alert("Erro ao remover motivo.");
  }

  function toggleExclusao(disciplinaId: string) {
    setForm((f) => ({
      ...f,
      disciplinasExcluidasIds: f.disciplinasExcluidasIds.includes(disciplinaId)
        ? f.disciplinasExcluidasIds.filter((id) => id !== disciplinaId)
        : [...f.disciplinasExcluidasIds, disciplinaId],
    }));
  }

  const positivos = motivos.filter((m) => m.positivo);
  const negativos = motivos.filter((m) => !m.positivo);

  const MotivoCard = ({ m }: { m: MotivoType }) => (
    <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-start gap-3 hover:shadow-sm transition-shadow">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{m.titulo}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {m.disciplina
            ? <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{m.disciplina.nome}</span>
            : <span className="text-xs text-gray-400">Geral</span>
          }
          {m.nivel && (
            <span className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">{NIVEL_LABELS[m.nivel]}</span>
          )}
          {m.disciplinasExcluidas && m.disciplinasExcluidas.length > 0 && (
            <span className="text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
              ✕ {m.disciplinasExcluidas.map((d) => d.nome).join(", ")}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => openEdit(m)}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleDelete(m.id)}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Motivos de Ocorrência</h1>
          <p className="text-gray-500 text-sm mt-1">Configure os motivos disponíveis para os professores</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo motivo
        </button>
      </div>

      {/* Modal de criação/edição */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">
                {editingId ? "Editar Motivo" : "Novo Motivo"}
              </h2>
              <button onClick={closeForm} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input
                  required
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ex: Comportamento inadequado"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <input
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Descrição opcional"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Nível */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nível
                  {role === "SECRETARIA_GERAL" && (
                    <span className="text-amber-600 font-normal ml-1 text-xs">(obrigatório para escolher disciplina)</span>
                  )}
                </label>
                {role === "SECRETARIA_FUND1" ? (
                  <div className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 bg-gray-50">
                    Fundamental I
                  </div>
                ) : (
                  <select
                    value={form.nivel}
                    onChange={(e) => setForm({ ...form, nivel: e.target.value, disciplinaId: "", disciplinasExcluidasIds: [] })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">
                      {role === "SECRETARIA_FUND2" ? "Selecione..." : "Todos os níveis"}
                    </option>
                    {niveisDisponiveis.map((n) => (
                      <option key={n.value} value={n.value}>{n.label}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Disciplina */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Disciplina</label>
                <select
                  value={form.disciplinaId}
                  onChange={(e) => setForm({ ...form, disciplinaId: e.target.value, disciplinasExcluidasIds: [] })}
                  disabled={disciplinaDisabled}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <option value="">Geral (todas as disciplinas)</option>
                  {disciplinas.map((d) => (
                    <option key={d.id} value={d.id}>{d.nome}</option>
                  ))}
                </select>
                {disciplinaDisabled && (
                  <p className="text-xs text-amber-600 mt-1">Selecione um nível primeiro</p>
                )}
              </div>

              {/* Exclusões (só quando motivo é geral) */}
              {!form.disciplinaId && disciplinas.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Excluir de disciplinas específicas
                    <span className="text-gray-400 font-normal ml-1 text-xs">(blacklist)</span>
                  </label>
                  <div className="border border-gray-200 rounded-xl p-3 max-h-36 overflow-y-auto space-y-1.5">
                    {disciplinas.map((d) => (
                      <label key={d.id} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={form.disciplinasExcluidasIds.includes(d.id)}
                          onChange={() => toggleExclusao(d.id)}
                          className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900">{d.nome}</span>
                      </label>
                    ))}
                  </div>
                  {form.disciplinasExcluidasIds.length > 0 && (
                    <p className="text-xs text-orange-600 mt-1">
                      Não aparece em: {disciplinas
                        .filter((d) => form.disciplinasExcluidasIds.includes(d.id))
                        .map((d) => d.nome)
                        .join(", ")}
                    </p>
                  )}
                </div>
              )}

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, positivo: false })}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-medium transition-colors ${
                      !form.positivo ? "bg-red-50 border-red-200 text-red-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4" /> Negativo
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, positivo: true })}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-medium transition-colors ${
                      form.positivo ? "bg-green-50 border-green-200 text-green-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" /> Positivo
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {salvando && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? "Salvar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ThumbsDown className="w-4 h-4 text-red-500" />
              <h2 className="font-semibold text-gray-900">Negativos ({negativos.length})</h2>
            </div>
            <div className="space-y-2">
              {negativos.map((m) => <MotivoCard key={m.id} m={m} />)}
              {negativos.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">Nenhum motivo negativo</p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <ThumbsUp className="w-4 h-4 text-green-500" />
              <h2 className="font-semibold text-gray-900">Positivos ({positivos.length})</h2>
            </div>
            <div className="space-y-2">
              {positivos.map((m) => <MotivoCard key={m.id} m={m} />)}
              {positivos.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">Nenhum motivo positivo</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}