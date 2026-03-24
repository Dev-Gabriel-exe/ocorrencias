// src/app/secretaria/turmas/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, School, Users, Loader2, X } from "lucide-react";

const TODOS_NIVEIS = [
  { value: "FUND_I", label: "Fundamental I (1º ao 5º)" },
  { value: "FUND_II", label: "Fundamental II (6º ao 9º)" },
  { value: "MEDIO", label: "Ensino Médio" },
];

const TURNOS = ["Manhã", "Tarde", "Noite"];

export default function TurmasPage() {
  const { data: session } = useSession();
  const role = session?.user?.role ?? "";

  // CORREÇÃO: filtra níveis permitidos pelo role
  const NIVEIS = TODOS_NIVEIS.filter((n) => {
    if (role === "SECRETARIA_FUND1") return n.value === "FUND_I";
    if (role === "SECRETARIA_FUND2") return n.value === "FUND_II" || n.value === "MEDIO";
    return true; // SECRETARIA_GERAL vê todos
  });

  const nivelPadrao = NIVEIS[0]?.value ?? "FUND_II";

  const [turmas, setTurmas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({ nome: "", serie: "", turno: "Manhã", nivel: nivelPadrao, anoLetivo: 2026 });

  async function carregar() {
    const res = await fetch("/api/turmas");
    if (res.ok) setTurmas(await res.json());
    setLoading(false);
  }

  useEffect(() => { carregar(); }, []);

  // Atualiza o nível padrão quando a sessão carrega
  useEffect(() => {
    if (NIVEIS.length > 0) setForm((f) => ({ ...f, nivel: NIVEIS[0].value }));
  }, [role]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    const res = await fetch("/api/turmas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ nome: "", serie: "", turno: "Manhã", nivel: nivelPadrao, anoLetivo: 2026 });
      await carregar();
    }
    setSalvando(false);
  }

  async function desativar(id: string) {
    if (!confirm("Desativar esta turma?")) return;
    await fetch(`/api/turmas/${id}`, { method: "DELETE" });
    await carregar();
  }

  const nivelLabel: Record<string, string> = { FUND_I: "Fund. I", FUND_II: "Fund. II", MEDIO: "Médio" };
  const nivelColor: Record<string, string> = {
    FUND_I: "bg-green-100 text-green-700",
    FUND_II: "bg-blue-100 text-blue-700",
    MEDIO: "bg-purple-100 text-purple-700",
  };

  // CORREÇÃO: filtra turmas pelo nível do role
  const turmasFiltradas = turmas.filter((t) => {
    if (role === "SECRETARIA_FUND1") return t.nivel === "FUND_I";
    if (role === "SECRETARIA_FUND2") return t.nivel === "FUND_II" || t.nivel === "MEDIO";
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Turmas</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie as turmas da escola</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors">
          <Plus className="w-4 h-4" /> Nova turma
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Nova Turma</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da turma *</label>
                  <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    placeholder="Ex: 6º Ano A"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Série *</label>
                  <input required value={form.serie} onChange={(e) => setForm({ ...form, serie: e.target.value })}
                    placeholder="Ex: 6º Ano"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Turno</label>
                  <select value={form.turno} onChange={(e) => setForm({ ...form, turno: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {TURNOS.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nível</label>
                  <select value={form.nivel} onChange={(e) => setForm({ ...form, nivel: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {NIVEIS.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={salvando}
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {salvando && <Loader2 className="w-4 h-4 animate-spin" />}
                  Criar turma
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
      ) : turmasFiltradas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <School className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">Nenhuma turma cadastrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {turmasFiltradas.map((turma: any) => (
            <div key={turma.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{turma.nome}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{turma.turno} · {turma.anoLetivo}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${nivelColor[turma.nivel]}`}>
                  {nivelLabel[turma.nivel]}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {turma._count?.alunos ?? 0} alunos
                </span>
                <span>{turma._count?.ocorrencias ?? 0} ocorrências</span>
              </div>
              <div className="flex gap-2">
                <a href={`/secretaria/turmas/${turma.id}`}
                  className="flex-1 text-xs px-3 py-1.5 border border-purple-200 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors text-center font-medium">
                  Ver detalhes
                </a>
                <button onClick={() => desativar(turma.id)}
                  className="flex-1 text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors">
                  Desativar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}