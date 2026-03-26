
// src/app/professor/aluno/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Star, ClipboardList, User,
  Loader2, TrendingUp, TrendingDown
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Ocorrencia {
  id: string;
  data: string;
  descricao: string;
  deltaEstrelas: number;
  motivo?: { titulo: string; positivo: boolean } | null;
  professor: { name: string | null; discipline: string | null };
}

interface Aluno {
  id: string;
  nome: string;
  matricula: string;
  estrelas: number;
  turma: { id: string; nome: string };
  ocorrencias: Ocorrencia[];
}

export default function AlunoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/alunos/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setAluno(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!aluno) {
    return (
      <div className="text-center py-20 text-gray-400">
        <User className="w-12 h-12 mx-auto mb-3" />
        Aluno não encontrado
      </div>
    );
  }

  const positivas = aluno.ocorrencias.filter((o) => o.deltaEstrelas > 0).length;
  const negativas = aluno.ocorrencias.filter((o) => o.deltaEstrelas < 0).length;

  return (
    <div className="space-y-6">
      {/* VOLTAR */}
      <Link
        href={`/professor/turma/${aluno.turma.id}`}
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Link>

      {/* HEADER PERFIL */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold">
              {aluno.nome.charAt(0)}
            </div>

            <div>
              <h1 className="text-xl font-bold">{aluno.nome}</h1>
              <p className="text-sm opacity-80">{aluno.turma.nome}</p>
              <p className="text-xs opacity-70 font-mono">{aluno.matricula}</p>
            </div>
          </div>

          {/* SCORE */}
          <div className="text-right">
            <p className="text-sm opacity-80 mb-1">Pontuação</p>
            <p className="text-3xl font-bold">{aluno.estrelas}/10</p>

            <div className="w-40 h-2 bg-white/20 rounded-full mt-2 ml-auto">
              <div
                className="h-2 bg-yellow-400 rounded-full"
                style={{ width: `${(aluno.estrelas / 10) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <ClipboardList className="w-5 h-5 text-blue-500 mb-2" />
          <p className="text-2xl font-bold">{aluno.ocorrencias.length}</p>
          <p className="text-sm text-gray-500">Ocorrências</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <TrendingUp className="w-5 h-5 text-green-500 mb-2" />
          <p className="text-2xl font-bold text-green-600">{positivas}</p>
          <p className="text-sm text-gray-500">Positivas</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <TrendingDown className="w-5 h-5 text-red-500 mb-2" />
          <p className="text-2xl font-bold text-red-500">{negativas}</p>
          <p className="text-sm text-gray-500">Negativas</p>
        </div>
      </div>

      {/* HISTÓRICO */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b">
          <h2 className="font-semibold">Histórico</h2>
        </div>

        {aluno.ocorrencias.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            Sem ocorrências
          </div>
        ) : (
          <div className="divide-y">
            {aluno.ocorrencias.map((oc) => (
              <div key={oc.id} className="p-5 flex gap-4">
                {/* timeline dot */}
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <div className="flex-1 w-px bg-gray-200 mt-1" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {oc.motivo && (
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          oc.motivo.positivo
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {oc.motivo.titulo}
                      </span>
                    )}

                    {oc.deltaEstrelas !== 0 && (
                      <span
                        className={`text-xs font-bold ${
                          oc.deltaEstrelas > 0
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {oc.deltaEstrelas > 0 ? "+" : ""}
                        {oc.deltaEstrelas}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-700">{oc.descricao}</p>

                  <p className="text-xs text-gray-400 mt-1">
                    {oc.professor.name}
                  </p>
                </div>

                <div className="text-xs text-gray-400 whitespace-nowrap">
                  {format(new Date(oc.data), "dd MMM", { locale: ptBR })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}