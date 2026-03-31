"use client";
import { BookOpen, ChevronDown, ChevronUp, ClipboardList } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Users, Star, Loader2, Trash2, UserPlus, X, Save, Upload,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Aluno {
  id: string;
  nome: string;
  matricula: string;
  estrelas: number;
  ativo: boolean;
}

interface ProfessorTurma {
  professor: { id: string; name: string | null; email: string | null };
}

interface DisciplinaDaTurma {
  disciplina: {
    id: string;
    nome: string;
    professorTurmas: ProfessorTurma[];
  };
}

interface Ocorrencia {
  id: string;
  data: string;
  descricao: string;
  deltaEstrelas: number;
  vistaPelaSecretaria: boolean;
  aluno: { id: string; nome: string };
  professor: { name: string | null };
  motivo: { titulo: string; positivo: boolean } | null;
  disciplina: { id: string; nome: string } | null;
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
  const [turma, setTurma] = useState<Turma | null>(null);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddAluno, setShowAddAluno] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [formAluno, setFormAluno] = useState({ nome: "", matricula: "", email: "", telefone: "" });
  const [showImport, setShowImport] = useState(false);
  const [textoImport, setTextoImport] = useState("");
  const [importando, setImportando] = useState(false);
  const [resultadoImport, setResultadoImport] = useState<{ ok: number; erros: string[] } | null>(null);
  const [blocosAbertos, setBlocosAbertos] = useState<Set<string>>(new Set());

  async function carregar() {
    const [tRes, oRes] = await Promise.all([
      fetch(`/api/turmas/${id}`),
      fetch(`/api/ocorrencias?turmaId=${id}`),
    ]);
    if (tRes.ok) setTurma(await tRes.json());
    if (oRes.ok) setOcorrencias(await oRes.json());
    setLoading(false);
  }

  useEffect(() => { carregar(); }, [id]);

  // Agrupa ocorrências por disciplina
  function agruparPorDisciplina() {
    const grupos: Record<string, { nome: string; ocorrencias: Ocorrencia[] }> = {};
    for (const o of ocorrencias) {
      const key = o.disciplina?.id ?? "sem-disciplina";
      const nome = o.disciplina?.nome ?? "Sem disciplina";
      if (!grupos[key]) grupos[key] = { nome, ocorrencias: [] };
      grupos[key].ocorrencias.push(o);
    }
    return Object.entries(grupos).sort((a, b) => a[1].nome.localeCompare(b[1].nome));
  }

  function toggleBloco(key: string) {
    setBlocosAbertos((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function marcarVista(ocorrenciaId: string) {
    await fetch(`/api/ocorrencias/${ocorrenciaId}/vista`, { method: "PATCH" });
    await carregar();
  }

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
    function toTitleCase(str: string) {
      const min = ["de","da","do","das","dos","e","a","o","em","por","com","para"];
      return str.toLowerCase().split(" ").map((w, i) =>
        i === 0 || !min.includes(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w
      ).join(" ");
    }
    const linhas = textoImport.split("\n").map((l) => l.trim()).filter(Boolean)
      .filter((l) => !l.toLowerCase().startsWith("matricula") && !l.toLowerCase().startsWith("total"));
    let ok = 0;
    const erros: string[] = [];
    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i];
      const partes = linha.split(/\s+/);
      let nome = "", matricula = "";
      if (partes.length >= 2 && /^\d+$/.test(partes[0])) {
        matricula = partes[0];
        nome = toTitleCase(partes.slice(1).join(" "));
      } else {
        const cv = linha.match(/^(.+),\s*(\d+)$/);
        if (cv) { nome = cv[1].trim(); matricula = cv[2].trim(); }
        else { nome = toTitleCase(linha); matricula = `M${Date.now()}${i}`; }
      }
      if (!nome) continue;
      const res = await fetch("/api/alunos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, matricula, turmaId: id }),
      });
      if (res.ok) ok++;
      else { const data = await res.json(); erros.push(`${nome}: ${data.error || "erro"}`); }
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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
    </div>
  );

  if (!turma) return (
    <div className="text-center py-20 text-gray-400">
      <p>Turma não encontrada.</p>
      <Link href="/secretaria/turmas" className="mt-4 text-purple-500 hover:underline text-sm">Voltar</Link>
    </div>
  );

  const gruposDisciplina = agruparPorDisciplina();
  const naoVistas = ocorrencias.filter((o) => !o.vistaPelaSecretaria).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link href="/secretaria/turmas" className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar para Turmas
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{turma.nome}</h1>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
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

          {turma.disciplinas.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-50">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Disciplinas e Professores</p>
              <div className="flex flex-wrap gap-2">
                {turma.disciplinas.map((d) => (
                  <span key={d.disciplina.id} className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full">
                    {d.disciplina.nome}
                    {(d.disciplina.professorTurmas?.length ?? 0) > 0 && (
                      <span className="text-purple-400 ml-1">
                        · {d.disciplina.professorTurmas.map((p) => p.professor.name).join(", ")}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end">
            <Link href={`/secretaria/turmas/${turma.id}/disciplinas`}
              className="flex items-center gap-2 text-sm text-purple-600 hover:bg-purple-50 px-3 py-2 rounded-xl transition-colors font-medium">
              <BookOpen className="w-4 h-4" />
              Gerenciar disciplinas ({turma.disciplinas?.length ?? 0})
            </Link>
          </div>
        </div>
      </div>

      {/* Ocorrências por disciplina */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-gray-400" />
            Ocorrências por disciplina
            {naoVistas > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {naoVistas} novas
              </span>
            )}
          </h2>
        </div>

        {gruposDisciplina.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
            <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhuma ocorrência registrada.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {gruposDisciplina.map(([key, grupo]) => {
              const aberto = blocosAbertos.has(key);
              const naoVistasGrupo = grupo.ocorrencias.filter((o) => !o.vistaPelaSecretaria).length;
              const positivas = grupo.ocorrencias.filter((o) => o.motivo?.positivo).length;
              const negativas = grupo.ocorrencias.filter((o) => !o.motivo?.positivo).length;

              return (
                <div key={key} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <button
                    onClick={() => toggleBloco(key)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-4 h-4 text-purple-500" />
                      <span className="font-medium text-gray-900 text-sm">{grupo.nome}</span>
                      <span className="text-xs text-gray-400">{grupo.ocorrencias.length} ocorrências</span>
                      <span className="text-xs text-green-600">+{positivas}</span>
                      <span className="text-xs text-red-500">-{negativas}</span>
                      {naoVistasGrupo > 0 && (
                        <span className="bg-red-100 text-red-600 text-xs font-medium px-1.5 py-0.5 rounded-full">
                          {naoVistasGrupo} nova{naoVistasGrupo > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    {aberto
                      ? <ChevronUp className="w-4 h-4 text-gray-400" />
                      : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>

                  {aberto && (
                    <div className="border-t border-gray-50 divide-y divide-gray-50">
                      {grupo.ocorrencias.map((o) => (
                        <div key={o.id} className={`px-5 py-3 flex items-start gap-3 ${!o.vistaPelaSecretaria ? "bg-amber-50/30" : ""}`}>
                          <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${o.motivo?.positivo ? "bg-green-400" : "bg-red-400"}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm text-gray-900">{o.aluno.nome}</span>
                              {o.motivo && (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${o.motivo.positivo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                  {o.motivo.titulo}
                                </span>
                              )}
                              {o.deltaEstrelas !== 0 && (
                                <span className={`text-xs font-bold ${o.deltaEstrelas > 0 ? "text-green-600" : "text-red-600"}`}>
                                  {o.deltaEstrelas > 0 ? `+${o.deltaEstrelas}` : o.deltaEstrelas} ⭐
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{o.descricao}</p>
                            <p className="text-xs text-gray-300 mt-0.5">
                              {o.professor.name} · {format(new Date(o.data), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                          {!o.vistaPelaSecretaria && (
                            <button
                              onClick={() => marcarVista(o.id)}
                              className="text-xs text-amber-600 hover:bg-amber-100 px-2 py-1 rounded-lg transition-colors flex-shrink-0"
                            >
                              Marcar vista
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lista de Alunos */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" /> Alunos
          </h2>
          <div className="flex gap-2">
            <button onClick={() => { setShowImport(true); setResultadoImport(null); }}
              className="flex items-center gap-2 border border-purple-300 text-purple-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-50 transition-colors">
              <Upload className="w-4 h-4" /> Importar lista
            </button>
            <button onClick={() => setShowAddAluno(true)}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors">
              <UserPlus className="w-4 h-4" /> Adicionar aluno
            </button>
          </div>
        </div>

        {showImport && (
          <div className="p-6 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Importar lista de alunos</h3>
              <button type="button" onClick={() => setShowImport(false)}>
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <textarea value={textoImport} onChange={(e) => setTextoImport(e.target.value)} rows={8}
              placeholder={"180053 ALICE LIMA DE MORAIS\n220108 ANA ELISABETH CARVALHO"}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
            {resultadoImport && (
              <div className="mt-3 space-y-1">
                <p className="text-sm text-green-600 font-medium">✓ {resultadoImport.ok} aluno(s) importado(s)</p>
                {resultadoImport.erros.map((e, i) => <p key={i} className="text-xs text-red-500">✗ {e}</p>)}
              </div>
            )}
            <div className="flex justify-end gap-3 mt-4">
              <button type="button" onClick={() => setShowImport(false)} className="px-4 py-2 text-sm text-gray-500">Fechar</button>
              <button onClick={handleImportar} disabled={importando || !textoImport.trim()}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                {importando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {importando ? "Importando..." : "Importar"}
              </button>
            </div>
          </div>
        )}

        {showAddAluno && (
          <div className="p-6 bg-purple-50 border-b border-purple-100">
            <form onSubmit={handleAddAluno} className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Novo Aluno</h3>
                <button type="button" onClick={() => setShowAddAluno(false)}>
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nome *</label>
                <input required value={formAluno.nome} onChange={(e) => setFormAluno({ ...formAluno, nome: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Nome completo" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Matrícula *</label>
                <input required value={formAluno.matricula} onChange={(e) => setFormAluno({ ...formAluno, matricula: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Ex: 20260001" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email do responsável</label>
                <input type="email" value={formAluno.email} onChange={(e) => setFormAluno({ ...formAluno, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="responsavel@email.com" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Telefone</label>
                <input value={formAluno.telefone} onChange={(e) => setFormAluno({ ...formAluno, telefone: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="(86) 99999-9999" />
              </div>
              <div className="col-span-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddAluno(false)} className="px-4 py-2 text-sm text-gray-500">Cancelar</button>
                <button type="submit" disabled={salvando}
                  className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
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
                  <span className="text-sm text-gray-300 font-mono w-6">{String(idx + 1).padStart(2, "0")}</span>
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 text-xs font-bold">{aluno.nome.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{aluno.nome}</p>
                    <p className="text-xs text-gray-400 font-mono">{aluno.matricula}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < aluno.estrelas ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}`} />
                    ))}
                    <span className="text-xs text-gray-400 ml-1">{aluno.estrelas}</span>
                  </div>
                  <button onClick={() => desativarAluno(aluno.id)} className="text-gray-300 hover:text-red-400 transition-colors">
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