"use client";
// src/app/secretaria/turmas/[id]/page.tsx
import { BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Users, Star, Loader2, Pencil, Trash2, UserPlus, X, Save, Upload,
} from "lucide-react";

interface Aluno {
  id: string;
  nome: string;
  matricula: string;
  estrelas: number;
  ativo: boolean;
  email?: string;
  telefone?: string;
}

interface DisciplinaDaTurma {
  disciplina: {
    id: string;
    nome: string;
    professores: {
      professor: { id: string; name: string | null; email: string | null };
    }[];
  };
}

interface Turma {
  id: string;
  nome: string;
  serie: string;
  turno: string;
  nivel: string;
  anoLetivo: number;
  ativa: boolean;
  alunos: Aluno[];
  disciplinas: DisciplinaDaTurma[];
  _count: { ocorrencias: number };
}

const nivelLabel: Record<string, string> = {
  FUND_I: "Fundamental I",
  FUND_II: "Fundamental II",
  MEDIO: "Ensino Médio",
};

export default function TurmaDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [turma, setTurma] = useState<Turma | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddAluno, setShowAddAluno] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [formAluno, setFormAluno] = useState({
    nome: "", matricula: "", email: "", telefone: "",
  });
  const [showImport, setShowImport] = useState(false);
  const [textoImport, setTextoImport] = useState("");
  const [importando, setImportando] = useState(false);
  const [resultadoImport, setResultadoImport] = useState<{ ok: number; erros: string[] } | null>(null);

  async function carregar() {
    const res = await fetch(`/api/turmas/${id}`);
    if (res.ok) setTurma(await res.json());
    setLoading(false);
  }

  useEffect(() => { carregar(); }, [id]);

  async function handleAddAluno(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    const res = await fetch("/api/alunos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formAluno, turmaId: id }),
    });
    if (res.ok) {
      setShowAddAluno(false);
      setFormAluno({ nome: "", matricula: "", email: "", telefone: "" });
      await carregar();
    } else {
      const data = await res.json();
      alert(data.error || "Erro ao adicionar aluno.");
    }
    setSalvando(false);
  }

  async function handleImportar() {
  setImportando(true);
  setResultadoImport(null);

  function toTitleCase(str: string): string {
    const min = ["de","da","do","das","dos","e","a","o","em","por","com","para"];
    return str.toLowerCase().split(" ").map((w, i) =>
      i === 0 || !min.includes(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w
    ).join(" ");
  }

  const linhas = textoImport
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !l.toLowerCase().startsWith("matricula") && !l.toLowerCase().startsWith("total"));

  let ok = 0;
  const erros: string[] = [];

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    const partes = linha.split(/\s+/);

    let nome = "";
    let matricula = "";

    // Formato: "180053 ALICE LIMA DE MORAIS" — número no início
    if (partes.length >= 2 && /^\d+$/.test(partes[0])) {
      matricula = partes[0];
      nome = toTitleCase(partes.slice(1).join(" "));
    }
    // Formato: "Alice Lima, 180053"
    else {
      const comVirgula = linha.match(/^(.+),\s*(\d+)$/);
      if (comVirgula) {
        nome = comVirgula[1].trim();
        matricula = comVirgula[2].trim();
      } else {
        nome = toTitleCase(linha);
        matricula = `M${Date.now()}${i}`;
      }
    }

    if (!nome) continue;

    const res = await fetch("/api/alunos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, matricula, turmaId: id }),
    });

    if (res.ok) ok++;
    else {
      const data = await res.json();
      erros.push(`${nome}: ${data.error || "erro"}`);
    }
  }

  setResultadoImport({ ok, erros });
  setImportando(false);
  if (ok > 0) await carregar();
}
  async function desativarAluno(alunoId: string) {
    if (!confirm("Remover este aluno da turma?")) return;
    await fetch(`/api/alunos/${alunoId}`, { method: "DELETE" });
    await carregar();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!turma) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p>Turma não encontrada.</p>
        <Link href="/secretaria/turmas" className="mt-4 text-purple-500 hover:underline text-sm">
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/secretaria/turmas"
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Turmas
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{turma.nome}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm text-gray-400">{turma.serie}</span>
                <span className="text-gray-200">·</span>
                <span className="text-sm text-gray-400">{turma.turno}</span>
                <span className="text-gray-200">·</span>
                <span className="text-sm text-gray-400">{nivelLabel[turma.nivel]}</span>
                <span className="text-gray-200">·</span>
                <span className="text-sm text-gray-400">{turma.anoLetivo}</span>
              </div>
            </div>
            <div className="text-right text-sm text-gray-400">
              <p>{turma.alunos.length} alunos</p>
              <p>{turma._count.ocorrencias} ocorrências</p>
            </div>
          </div>

          {/* Disciplinas e Professores */}
          {turma.disciplinas.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-50">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Disciplinas e Professores</p>
              <div className="flex flex-wrap gap-2">
                {turma.disciplinas.map((d) => (
                  <span
                    key={d.disciplina.id}
                    className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full"
                  >
                    {d.disciplina.nome}
                    {d.disciplina.professores.length > 0 && (
                      <span className="text-purple-400 ml-1">
                        · {d.disciplina.professores.map((p) => p.professor.name).join(", ")}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
{/* Adicionar logo após o bloco de professores */}
<div className="mt-4 pt-4 border-t border-gray-50 flex justify-end">
  <Link
    href={`/secretaria/turmas/${turma.id}/disciplinas`}
    className="flex items-center gap-2 text-sm text-purple-600 hover:bg-purple-50 px-3 py-2 rounded-xl transition-colors font-medium"
  >
    <BookOpen className="w-4 h-4" />
    Gerenciar disciplinas ({turma.disciplinas?.length ?? 0})
  </Link>
</div>
      {/* Lista de Alunos */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            Alunos
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowImport(true); setResultadoImport(null); }}
              className="flex items-center gap-2 border border-purple-300 text-purple-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-50 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Importar lista
            </button>
            <button
              onClick={() => setShowAddAluno(true)}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Adicionar aluno
            </button>
          </div>
        </div>

        {/* Modal de Importação */}
        {showImport && (
          <div className="p-6 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Importar lista de alunos</h3>
              <button type="button" onClick={() => setShowImport(false)}>
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-3">
              Cole a lista abaixo. Um aluno por linha. Separe nome e matrícula por vírgula ou tab.
              Se não informar a matrícula, ela será gerada automaticamente.
            </p>

            <div className="bg-white rounded-lg border border-gray-200 p-2 mb-2">
              <p className="text-xs text-gray-400 mb-1 font-mono">Exemplos de formato aceito:</p>
              <p className="text-xs font-mono text-gray-500">180053 ALICE LIMA DE MORAIS</p>
              <p className="text-xs font-mono text-gray-500">220108 ANA ELISABETH CARVALHO</p>
              <p className="text-xs font-mono text-gray-500">ou: Alice Lima, 180053</p>
            </div>

            <textarea
              value={textoImport}
              onChange={(e) => setTextoImport(e.target.value)}
              rows={8}
              placeholder={"180053 ALICE LIMA DE MORAIS\n220108 ANA ELISABETH CARVALHO\nFernanda Oliveira"}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />

            {resultadoImport && (
              <div className="mt-3 space-y-1">
                <p className="text-sm text-green-600 font-medium">✓ {resultadoImport.ok} aluno(s) importado(s)</p>
                {resultadoImport.erros.map((e, i) => (
                  <p key={i} className="text-xs text-red-500">✗ {e}</p>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setShowImport(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Fechar
              </button>
              <button
                onClick={handleImportar}
                disabled={importando || !textoImport.trim()}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
              >
                {importando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {importando ? "Importando..." : `Importar ${textoImport.split("\n").filter(Boolean).length} alunos`}
              </button>
            </div>
          </div>
        )}

        {/* Formulário add aluno */}
        {showAddAluno && (
          <div className="p-6 bg-purple-50 border-b border-purple-100">
            <form onSubmit={handleAddAluno} className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Novo Aluno</h3>
                <button type="button" onClick={() => setShowAddAluno(false)}>
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nome *</label>
                <input
                  required
                  value={formAluno.nome}
                  onChange={(e) => setFormAluno({ ...formAluno, nome: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Matrícula *</label>
                <input
                  required
                  value={formAluno.matricula}
                  onChange={(e) => setFormAluno({ ...formAluno, matricula: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: 20260001"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email do responsável</label>
                <input
                  type="email"
                  value={formAluno.email}
                  onChange={(e) => setFormAluno({ ...formAluno, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="responsavel@email.com"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Telefone</label>
                <input
                  value={formAluno.telefone}
                  onChange={(e) => setFormAluno({ ...formAluno, telefone: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="(86) 99999-9999"
                />
              </div>
              <div className="col-span-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddAluno(false)}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                >
                  {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        )}

        {turma.alunos.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Nenhum aluno nesta turma.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {turma.alunos.map((aluno, idx) => (
              <div key={aluno.id} className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-300 font-mono w-6">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 text-xs font-bold">
                      {aluno.nome.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{aluno.nome}</p>
                    <p className="text-xs text-gray-400 font-mono">{aluno.matricula}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < aluno.estrelas
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-200 fill-gray-200"
                        }`}
                      />
                    ))}
                    <span className="text-xs text-gray-400 ml-1">{aluno.estrelas}</span>
                  </div>
                  <button
                    onClick={() => desativarAluno(aluno.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors"
                    title="Remover aluno"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
