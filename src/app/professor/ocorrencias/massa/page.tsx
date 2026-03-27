"use client";
// src/app/professor/ocorrencias/massa/page.tsx
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, X, Loader2, CheckSquare, Square, ChevronLeft, ThumbsDown, ThumbsUp } from "lucide-react";
import Link from "next/link";

interface Turma { id: string; nome: string; nivel: string; }
interface Aluno { id: string; nome: string; matricula: string; estrelas: number; }
interface Motivo { id: string; titulo: string; positivo: boolean; }
interface MotivoSelecionado { motivoId: string; titulo: string; descricao: string; positivo: boolean; }

function OcorrenciasMassaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const turmaIdParam = searchParams.get("turmaId");

  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [turmaId, setTurmaId] = useState(turmaIdParam ?? "");
  const [disciplinaId, setDisciplinaId] = useState("");
  const [disciplinas, setDisciplinas] = useState<{ id: string; nome: string }[]>([]);
  const [motivos, setMotivos] = useState<Motivo[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [motivosSelecionados, setMotivosSelecionados] = useState<MotivoSelecionado[]>([]);
  const [alunosSelecionados, setAlunosSelecionados] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<1 | 2>(1);
  const [loadingAlunos, setLoadingAlunos] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    fetch("/api/turmas").then((r) => r.json()).then(setTurmas);
  }, []);

  useEffect(() => {
    if (!turmaId) return;
    setLoadingAlunos(true);
    setMotivosSelecionados([]);
    setAlunosSelecionados(new Set());
    setDisciplinaId("");

    const turma = turmas.find((t) => t.id === turmaId);

    Promise.all([
      fetch(`/api/alunos?turmaId=${turmaId}`).then((r) => r.json()),
      fetch(`/api/disciplinas?turmaId=${turmaId}`).then((r) => r.json()),
      fetch(`/api/motivos${turma ? `?nivel=${turma.nivel}` : ""}`).then((r) => r.json()),
    ]).then(([al, disc, mot]) => {
      setAlunos(al);
      setDisciplinas(disc);
      setMotivos(mot);
      setLoadingAlunos(false);
    });
  }, [turmaId, turmas]);

  useEffect(() => {
    if (!turmaId) return;
    const turma = turmas.find((t) => t.id === turmaId);
    const params = new URLSearchParams();
    if (disciplinaId) params.set("disciplinaId", disciplinaId);
    if (turma) params.set("nivel", turma.nivel);
    fetch(`/api/motivos?${params}`).then((r) => r.json()).then(setMotivos);
  }, [disciplinaId, turmaId, turmas]);

  function addMotivo(m: Motivo) {
    if (motivosSelecionados.find((s) => s.motivoId === m.id)) return;
    setMotivosSelecionados((prev) => [
      ...prev,
      { motivoId: m.id, titulo: m.titulo, descricao: "", positivo: m.positivo },
    ]);
  }

  function removeMotivo(motivoId: string) {
    setMotivosSelecionados((prev) => prev.filter((m) => m.motivoId !== motivoId));
  }

  function updateDescricao(motivoId: string, descricao: string) {
    setMotivosSelecionados((prev) =>
      prev.map((m) => (m.motivoId === motivoId ? { ...m, descricao } : m))
    );
  }

  function toggleAluno(alunoId: string) {
    setAlunosSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(alunoId)) next.delete(alunoId);
      else next.add(alunoId);
      return next;
    });
  }

  function toggleTodos() {
    setAlunosSelecionados(
      alunosSelecionados.size === alunos.length
        ? new Set()
        : new Set(alunos.map((a) => a.id))
    );
  }

  async function handleSubmit() {
    if (!turmaId || motivosSelecionados.length === 0 || alunosSelecionados.size === 0) return;
    setSalvando(true);

    const res = await fetch("/api/ocorrencias/massa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turmaId,
        disciplinaId: disciplinaId || null,
        alunoIds: Array.from(alunosSelecionados),
        motivos: motivosSelecionados,
      }),
    });

    setSalvando(false);
    if (res.ok) {
      router.push("/professor/dashboard");
    } else {
      alert("Erro ao registrar ocorrências.");
    }
  }

  const motivosDisponiveis = motivos.filter(
    (m) => !motivosSelecionados.find((s) => s.motivoId === m.id)
  );

  const todosPositivos = motivosSelecionados.length > 0 && motivosSelecionados.every((m) => m.positivo);
  const deltaPreview = motivosSelecionados.length === 0 ? null : todosPositivos ? "+1 ⭐" : "-1 ⭐";

  const turmaNome = turmas.find((t) => t.id === turmaId)?.nome;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/professor/dashboard"
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ocorrência em Massa</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Registre a mesma ocorrência para vários alunos
          </p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-8">
        {(["1 — Turma & Motivos", "2 — Alunos"] as const).map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && <div className="w-8 h-px bg-gray-200" />}
            <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              step === i + 1
                ? "bg-purple-100 text-purple-700"
                : step > i + 1
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-400"
            }`}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="max-w-2xl space-y-5">

          {/* Turma — oculta se veio por parâmetro */}
          {!turmaIdParam ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Turma *</h2>
              <select
                value={turmaId}
                onChange={(e) => setTurmaId(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Selecione uma turma...</option>
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
            </div>
          ) : (
            turmaNome && (
              <div className="bg-purple-50 rounded-2xl border border-purple-100 p-4">
                <p className="text-sm text-purple-700 font-medium">
                  Turma: {turmaNome}
                </p>
              </div>
            )
          )}

          {turmaId && (
            <>
              {/* Disciplina */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="font-semibold text-gray-900 mb-3">
                  Disciplina <span className="font-normal text-gray-400 text-sm">(opcional)</span>
                </h2>
                <select
                  value={disciplinaId}
                  onChange={(e) => setDisciplinaId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  
                  {disciplinas.map((d) => (
                    <option key={d.id} value={d.id}>{d.nome}</option>
                  ))}
                </select>
              </div>

              {/* Motivos */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="font-semibold text-gray-900 mb-3">Motivos *</h2>

                {motivosSelecionados.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {motivosSelecionados.map((m) => (
                      <div
                        key={m.motivoId}
                        className={`rounded-xl border p-3 ${
                          m.positivo ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            {m.positivo
                              ? <ThumbsUp className="w-3.5 h-3.5 text-green-600" />
                              : <ThumbsDown className="w-3.5 h-3.5 text-red-600" />}
                            <span className={`text-sm font-medium ${m.positivo ? "text-green-800" : "text-red-800"}`}>
                              {m.titulo}
                            </span>
                          </div>
                          <button
                            onClick={() => removeMotivo(m.motivoId)}
                            className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/10 text-gray-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <input
                          value={m.descricao}
                          onChange={(e) => updateDescricao(m.motivoId, e.target.value)}
                          placeholder="Descrição opcional para este motivo..."
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {motivosDisponiveis.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {motivosDisponiveis.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => addMotivo(m)}
                        className={`text-left px-3 py-2 rounded-xl border text-xs font-medium transition-colors flex items-center gap-1.5 ${
                          m.positivo
                            ? "border-green-200 text-green-700 hover:bg-green-50"
                            : "border-red-200 text-red-700 hover:bg-red-50"
                        }`}
                      >
                        <Plus className="w-3 h-3 flex-shrink-0" />
                        {m.titulo}
                      </button>
                    ))}
                  </div>
                ) : motivosSelecionados.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-3">Nenhum motivo disponível</p>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-2">Todos os motivos adicionados</p>
                )}

                {deltaPreview && (
                  <p className={`text-xs mt-3 font-medium ${todosPositivos ? "text-green-600" : "text-red-600"}`}>
                    Impacto por aluno: {deltaPreview} por registro
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  disabled={motivosSelecionados.length === 0}
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-40 transition-colors"
                >
                  Próximo: Selecionar Alunos →
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="max-w-2xl space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Selecione os alunos</h2>
              <button
                onClick={toggleTodos}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium"
              >
                {alunosSelecionados.size === alunos.length ? "Desmarcar todos" : "Marcar todos"}
              </button>
            </div>

            {loadingAlunos ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
              </div>
            ) : (
              <div className="space-y-1">
                {alunos.map((a) => {
                  const sel = alunosSelecionados.has(a.id);
                  return (
                    <button
                      key={a.id}
                      onClick={() => toggleAluno(a.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                        sel ? "bg-purple-50 border-purple-200" : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      {sel
                        ? <CheckSquare className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        : <Square className="w-4 h-4 text-gray-300 flex-shrink-0" />}
                      <span className="text-sm font-medium text-gray-900 flex-1">{a.nome}</span>
                      <span className="text-xs text-gray-400">{a.matricula}</span>
                      <span className="text-xs text-amber-500 ml-1">
                        {"⭐".repeat(Math.min(a.estrelas, 5))}
                        {a.estrelas > 5 ? `+${a.estrelas - 5}` : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Resumo */}
          <div className="bg-purple-50 rounded-2xl border border-purple-100 p-4 space-y-1">
            <p className="text-sm font-semibold text-purple-900">Resumo</p>
            <p className="text-xs text-purple-700">
              {alunosSelecionados.size} aluno(s) selecionado(s)
            </p>
            <p className="text-xs text-purple-700">
              Motivos: {motivosSelecionados.map((m) => m.titulo).join(" · ")}
            </p>
            <p className={`text-xs font-medium ${todosPositivos ? "text-green-700" : "text-red-700"}`}>
              Cada aluno terá {deltaPreview} aplicado
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              Voltar
            </button>
            <button
              disabled={alunosSelecionados.size === 0 || salvando}
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-40 transition-colors"
            >
              {salvando && <Loader2 className="w-4 h-4 animate-spin" />}
              Registrar para {alunosSelecionados.size} aluno(s)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OcorrenciasMassaPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    }>
      <OcorrenciasMassaContent />
    </Suspense>
  );
}