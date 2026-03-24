"use client";
// src/app/secretaria/alunos/page.tsx
import { useState, useEffect } from "react";
import { Plus, Users, Search, Star, Loader2, X } from "lucide-react";
import { ImportarAlunos } from "@/components/alunos/importar-alunos";

export default function AlunosPage() {
  const [alunos, setAlunos] = useState<any[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [turmaSelecionada, setTurmaSelecionada] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({ nome: "", matricula: "", turmaId: "", email: "", telefone: "" });

  async function carregar() {
    const params = turmaSelecionada ? `?turmaId=${turmaSelecionada}` : "";
    const [aRes, tRes] = await Promise.all([fetch(`/api/alunos${params}`), fetch("/api/turmas")]);
    if (aRes.ok) setAlunos(await aRes.json());
    if (tRes.ok) setTurmas(await tRes.json());
    setLoading(false);
  }

  useEffect(() => { carregar(); }, [turmaSelecionada]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    const res = await fetch("/api/alunos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ nome: "", matricula: "", turmaId: "", email: "", telefone: "" });
      await carregar();
    } else {
      const data = await res.json();
      alert(data.error || "Erro ao cadastrar aluno.");
    }
    setSalvando(false);
  }

  const alunosFiltrados = alunos.filter((a) =>
    a.nome.toLowerCase().includes(busca.toLowerCase()) ||
    a.matricula.includes(busca)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alunos</h1>
          <p className="text-gray-500 text-sm mt-1">{alunos.length} alunos cadastrados</p>
        </div>
        <div className="flex gap-3">
          <ImportarAlunos turmaId={turmaSelecionada || ""} onImportado={carregar} />
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo aluno
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou matrícula..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <select
          value={turmaSelecionada}
          onChange={(e) => setTurmaSelecionada(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Todas as turmas</option>
          {turmas.map((t: any) => (
            <option key={t.id} value={t.id}>{t.nome}</option>
          ))}
        </select>
      </div>

      {/* Modal novo aluno */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Novo Aluno</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo *</label>
                <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Nome do aluno"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Matrícula *</label>
                  <input required value={form.matricula} onChange={(e) => setForm({ ...form, matricula: e.target.value })}
                    placeholder="Ex: 20260001"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Turma *</label>
                  <select required value={form.turmaId} onChange={(e) => setForm({ ...form, turmaId: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="">Selecione...</option>
                    {turmas.map((t: any) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (pais/responsável)</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="responsavel@email.com"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={salvando}
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {salvando && <Loader2 className="w-4 h-4 animate-spin" />}
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabela */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-6 py-3 border-b border-gray-50 bg-gray-50 grid grid-cols-12 text-xs font-medium text-gray-400 uppercase tracking-wide">
            <span className="col-span-4">Aluno</span>
            <span className="col-span-2">Matrícula</span>
            <span className="col-span-3">Turma</span>
            <span className="col-span-2">Estrelas</span>
            <span className="col-span-1">Ocorr.</span>
          </div>
          <div className="divide-y divide-gray-50">
            {alunosFiltrados.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Nenhum aluno encontrado.</p>
              </div>
            ) : (
              alunosFiltrados.map((aluno: any) => (
                <div key={aluno.id} className="px-6 py-3 grid grid-cols-12 items-center hover:bg-gray-50 transition-colors">
                  <a href={`/secretaria/alunos/${aluno.id}`} className="col-span-4 text-sm font-medium text-gray-900 hover:text-purple-600 transition-colors">{aluno.nome}</a>
                  <span className="col-span-2 text-xs text-gray-400 font-mono">{aluno.matricula}</span>
                  <a href={`/secretaria/turmas/${aluno.turma?.id}`} className="col-span-3 text-xs text-gray-500 hover:text-purple-500 transition-colors">{aluno.turma?.nome}</a>
                  <div className="col-span-2 flex items-center gap-1">
                    <Star className={`w-3.5 h-3.5 ${aluno.estrelas >= 5 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                    <span className="text-sm font-medium text-gray-700">{aluno.estrelas}</span>
                    <span className="text-xs text-gray-400">/10</span>
                  </div>
                  <span className="col-span-1 text-sm text-gray-400">{aluno._count?.ocorrencias ?? 0}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
