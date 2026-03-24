"use client";
import { useState, useEffect } from "react";
import {
  Loader2, Trash2, Pencil, X, Save,
  ChevronDown, ChevronUp, BookOpen, Plus,
} from "lucide-react";

interface Professor {
  id: string;
  name: string | null;
  email: string;
  role: string;
  nivelEnsino: string | null;
  disciplinas: { disciplina: { id: string; nome: string } }[];
}

interface Disciplina {
  id: string;
  nome: string;
  ativa: boolean;
  _count?: { professores: number; turmas: number };
}

const ROLES = [
  { value: "PROFESSOR", label: "Professor" },
  { value: "SECRETARIA_FUND1", label: "Secretaria Fund. I" },
  { value: "SECRETARIA_FUND2", label: "Secretaria Fund. II" },
  { value: "SECRETARIA_GERAL", label: "Secretaria Geral" },
];

const roleLabel: Record<string, string> = {
  PROFESSOR: "Professor",
  SECRETARIA_FUND1: "Sec. Fund. I",
  SECRETARIA_FUND2: "Sec. Fund. II",
  SECRETARIA_GERAL: "Sec. Geral",
};
const roleColor: Record<string, string> = {
  PROFESSOR: "bg-blue-100 text-blue-700",
  SECRETARIA_FUND1: "bg-green-100 text-green-700",
  SECRETARIA_FUND2: "bg-purple-100 text-purple-700",
  SECRETARIA_GERAL: "bg-amber-100 text-amber-700",
};

export default function ProfessoresPage() {
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [loading, setLoading] = useState(true);

  // Edição de professor
  const [editando, setEditando] = useState<Professor | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({ name: "", role: "PROFESSOR", disciplinasIds: [] as string[] });

  // Gestão de disciplinas
  const [showDisciplinas, setShowDisciplinas] = useState(false);
  const [novaDisciplina, setNovaDisciplina] = useState("");
  const [criandoDisciplina, setCriandoDisciplina] = useState(false);
  const [editandoDisciplina, setEditandoDisciplina] = useState<string | null>(null);
  const [nomeEditDisciplina, setNomeEditDisciplina] = useState("");
  const [deletandoDisciplina, setDeletandoDisciplina] = useState<string | null>(null);

  async function carregar() {
    const [pRes, dRes] = await Promise.all([
      fetch("/api/professores"),
      fetch("/api/disciplinas"),
    ]);
    if (pRes.ok) setProfessores(await pRes.json());
    if (dRes.ok) setDisciplinas(await dRes.json());
    setLoading(false);
  }

  useEffect(() => { carregar(); }, []);

  // --- Professores ---
  function abrirEdicao(p: Professor) {
    setEditando(p);
    setForm({
      name: p.name || "",
      role: p.role,
      disciplinasIds: p.disciplinas.map((d) => d.disciplina.id),
    });
  }

  function toggleDisciplina(id: string) {
    setForm((f) => ({
      ...f,
      disciplinasIds: f.disciplinasIds.includes(id)
        ? f.disciplinasIds.filter((d) => d !== id)
        : [...f.disciplinasIds, id],
    }));
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!editando) return;
    setSalvando(true);
    const res = await fetch(`/api/professores/${editando.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setEditando(null);
      await carregar();
    } else {
      alert("Erro ao salvar.");
    }
    setSalvando(false);
  }

  async function handleDeletarProfessor(id: string, nome: string) {
    if (!confirm(`Apagar o professor "${nome}"? Esta ação não pode ser desfeita.`)) return;
    const res = await fetch(`/api/professores/${id}`, { method: "DELETE" });
    if (res.ok) await carregar();
    else {
      const data = await res.json();
      alert(data.error || "Erro ao apagar.");
    }
  }

  // --- Disciplinas ---
  async function handleCriarDisciplina(e: React.FormEvent) {
    e.preventDefault();
    if (!novaDisciplina.trim()) return;
    setCriandoDisciplina(true);
    const res = await fetch("/api/disciplinas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: novaDisciplina.trim() }),
    });
    if (res.ok) {
      setNovaDisciplina("");
      await carregar();
    } else {
      alert("Erro ao criar disciplina.");
    }
    setCriandoDisciplina(false);
  }

  async function handleRenameDisciplina(id: string) {
    if (!nomeEditDisciplina.trim()) return;
    const res = await fetch(`/api/disciplinas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: nomeEditDisciplina.trim() }),
    });
    if (res.ok) {
      setEditandoDisciplina(null);
      setNomeEditDisciplina("");
      await carregar();
    } else {
      alert("Erro ao renomear.");
    }
  }

  async function handleDeletarDisciplina(id: string, nome: string) {
    if (!confirm(`Remover a disciplina "${nome}"?\nSe tiver vínculos com turmas, professores ou ocorrências, será apenas desativada.`)) return;
    setDeletandoDisciplina(id);
    const res = await fetch(`/api/disciplinas/${id}`, { method: "DELETE" });
    if (res.ok) {
      const data = await res.json();
      if (data.desativada) {
        alert(`A disciplina "${nome}" foi desativada pois possui vínculos existentes.`);
      }
      await carregar();
    } else {
      alert("Erro ao remover disciplina.");
    }
    setDeletandoDisciplina(null);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Professores</h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie os professores e suas disciplinas</p>
      </div>

      {/* ── Seção Disciplinas ── */}
      <div className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowDisciplinas((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-gray-900 text-sm">
              Disciplinas cadastradas
            </span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              {disciplinas.length}
            </span>
          </div>
          {showDisciplinas
            ? <ChevronUp className="w-4 h-4 text-gray-400" />
            : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {showDisciplinas && (
          <div className="border-t border-gray-100 px-6 py-4 space-y-4">
            {/* Form nova disciplina */}
            <form onSubmit={handleCriarDisciplina} className="flex gap-2">
              <input
                value={novaDisciplina}
                onChange={(e) => setNovaDisciplina(e.target.value)}
                placeholder="Nome da nova disciplina..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={criandoDisciplina || !novaDisciplina.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                {criandoDisciplina
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Plus className="w-3.5 h-3.5" />}
                Criar
              </button>
            </form>

            {/* Lista */}
            {disciplinas.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhuma disciplina cadastrada</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {disciplinas.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center gap-2 px-3 py-2 border border-gray-100 rounded-xl hover:bg-gray-50 group"
                  >
                    {editandoDisciplina === d.id ? (
                      <>
                        <input
                          value={nomeEditDisciplina}
                          onChange={(e) => setNomeEditDisciplina(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRenameDisciplina(d.id);
                            if (e.key === "Escape") setEditandoDisciplina(null);
                          }}
                          autoFocus
                          className="flex-1 px-2 py-1 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => handleRenameDisciplina(d.id)}
                          className="w-6 h-6 flex items-center justify-center rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
                        >
                          <Save className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setEditandoDisciplina(null)}
                          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm text-gray-700 truncate">{d.nome}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditandoDisciplina(d.id);
                              setNomeEditDisciplina(d.nome);
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeletarDisciplina(d.id, d.nome)}
                            disabled={deletandoDisciplina === d.id}
                            className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 disabled:opacity-50"
                          >
                            {deletandoDisciplina === d.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Trash2 className="w-3 h-3" />}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de edição de professor */}
      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Editar Professor</h2>
              <button
                onClick={() => setEditando(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSalvar} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="px-3 py-2.5 border border-gray-100 rounded-xl text-sm text-gray-400 bg-gray-50">
                  {editando.email}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Perfil de acesso</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Disciplinas vinculadas
                </label>
                <div className="border border-gray-200 rounded-xl p-3 max-h-48 overflow-y-auto space-y-1.5">
                  {disciplinas.map((d) => (
                    <label key={d.id} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={form.disciplinasIds.includes(d.id)}
                        onChange={() => toggleDisciplina(d.id)}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900">{d.nome}</span>
                    </label>
                  ))}
                  {disciplinas.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-2">Nenhuma disciplina cadastrada</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditando(null)}
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
                  <Save className="w-4 h-4" />
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de professores */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-6 py-3 border-b border-gray-50 bg-gray-50 grid grid-cols-12 text-xs font-medium text-gray-400 uppercase tracking-wide">
            <span className="col-span-3">Nome</span>
            <span className="col-span-3">Email</span>
            <span className="col-span-2">Perfil</span>
            <span className="col-span-3">Disciplinas</span>
            <span className="col-span-1"></span>
          </div>
          <div className="divide-y divide-gray-50">
            {professores.map((p) => (
              <div key={p.id} className="px-6 py-4 grid grid-cols-12 items-center gap-2 hover:bg-gray-50">
                <span className="col-span-3 text-sm font-medium text-gray-900">{p.name || "—"}</span>
                <span className="col-span-3 text-xs text-gray-400 truncate">{p.email}</span>
                <span className="col-span-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColor[p.role] || "bg-gray-100 text-gray-600"}`}>
                    {roleLabel[p.role] || p.role}
                  </span>
                </span>
                <div className="col-span-3 flex flex-wrap gap-1">
                  {(p.disciplinas ?? []).slice(0, 3).map((d) => (
                    <span key={d.disciplina.id} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                      {d.disciplina.nome}
                    </span>
                  ))}
                  {(p.disciplinas ?? []).length > 3 && (
                    <span className="text-xs text-gray-400">+{p.disciplinas.length - 3}</span>
                  )}
                  {(p.disciplinas ?? []).length === 0 && (
                    <span className="text-xs text-gray-300">Sem disciplinas</span>
                  )}
                </div>
                <div className="col-span-1 flex items-center gap-1 justify-end">
                  <button
                    onClick={() => abrirEdicao(p)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeletarProfessor(p.id, p.name || p.email)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {professores.length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-gray-400">
                Nenhum professor cadastrado
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}