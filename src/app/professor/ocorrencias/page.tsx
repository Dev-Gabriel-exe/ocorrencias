// src/app/professor/ocorrencias/page.tsx
"use client";
import { useState, useEffect } from "react";
import { Trash2, Loader2, ClipboardList, Lock, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

export default function OcorrenciasProfessorPage() {
  const [ocorrencias, setOcorrencias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletando, setDeletando] = useState<string | null>(null);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [turmaId, setTurmaId] = useState("");

  async function carregar() {
    setLoading(true);
    const params = new URLSearchParams();
    if (turmaId) params.set("turmaId", turmaId);
    const [oRes, tRes] = await Promise.all([
      fetch(`/api/ocorrencias?${params}`),
      fetch("/api/turmas"),
    ]);
    if (oRes.ok) setOcorrencias(await oRes.json());
    if (tRes.ok) setTurmas(await tRes.json());
    setLoading(false);
  }

  useEffect(() => { carregar(); }, [turmaId]);

  async function handleDeletar(id: string) {
    if (!confirm("Apagar esta ocorrência? Esta ação não pode ser desfeita.")) return;
    setDeletando(id);
    const res = await fetch(`/api/ocorrencias/${id}`, { method: "DELETE" });
    if (res.ok) {
      setOcorrencias((prev) => prev.filter((o) => o.id !== id));
    } else {
      const data = await res.json();
      alert(data.error || "Erro ao apagar ocorrência.");
    }
    setDeletando(null);
  }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Minhas Ocorrências</h1>
          <p className="text-gray-500 text-sm mt-1">Visualize e gerencie os registros que você criou</p>
        </div>
        <Link
          href="/professor/ocorrencias/massa"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors flex-shrink-0"
        >
          <Users className="w-4 h-4" />
          Registrar em Massa
        </Link>
      </div>

      <div className="flex gap-3 mb-6">
        <select
          value={turmaId}
          onChange={(e) => setTurmaId(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas as turmas</option>
          {turmas.map((t: any) => (
            <option key={t.id} value={t.id}>{t.nome}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : ocorrencias.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <ClipboardList className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">Nenhuma ocorrência registrada.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="divide-y divide-gray-50">
            {ocorrencias.map((o: any) => {
              const jaVista = o.vistaPelaSecretaria;
              return (
                <div key={o.id} className="px-6 py-4 flex items-start gap-4">
                  <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${o.motivo?.positivo ? "bg-green-400" : "bg-red-400"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-gray-900">{o.aluno?.nome}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-400">{o.turma?.nome}</span>
                      {o.motivo && (
                        <>
                          <span className="text-xs text-gray-400">·</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                            o.motivo.positivo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}>
                            {o.motivo.titulo}
                          </span>
                        </>
                      )}
                      {o.disciplina && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                          {o.disciplina.nome}
                        </span>
                      )}
                      {o.deltaEstrelas !== 0 && (
                        <span className={`text-xs font-bold ${o.deltaEstrelas > 0 ? "text-green-600" : "text-red-600"}`}>
                          {o.deltaEstrelas > 0 ? `+${o.deltaEstrelas}` : o.deltaEstrelas} ⭐
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{o.descricao}</p>
                    <p className="text-xs text-gray-300 mt-1">
                      {format(new Date(o.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>

                  <div className="flex-shrink-0">
                    {jaVista ? (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                        <Lock className="w-3 h-3" />
                        Visualizada
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDeletar(o.id)}
                        disabled={deletando === o.id}
                        className="flex items-center gap-1.5 text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {deletando === o.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Trash2 className="w-3 h-3" />}
                        Apagar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}