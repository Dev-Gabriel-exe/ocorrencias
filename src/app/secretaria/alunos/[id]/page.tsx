"use client";
// src/app/secretaria/alunos/[id]/page.tsx
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Star, ClipboardList, Loader2, TrendingUp, TrendingDown, User,
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
  email?: string;
  telefone?: string;
  turma: { id: string; nome: string };
  ocorrencias: Ocorrencia[];
}

export default function AlunoSecretariaPage() {
  const { id } = useParams<{ id: string }>();
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/alunos/${id}`)
      .then((r) => r.json())
      .then((data) => { setAluno(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!aluno?.nome) {
    return (
      <div className="text-center py-20 text-gray-400">
        <User className="w-12 h-12 mx-auto mb-3" />
        <p>Aluno não encontrado.</p>
        <Link href="/secretaria/alunos" className="mt-4 text-purple-500 hover:underline text-sm block">
          Voltar para Alunos
        </Link>
      </div>
    );
  }

  const positivas = aluno.ocorrencias.filter((o) => o.deltaEstrelas > 0).length;
  const negativas = aluno.ocorrencias.filter((o) => o.deltaEstrelas < 0).length;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/secretaria/alunos"
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Alunos
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center">
                <span className="text-purple-600 font-bold text-xl">{aluno.nome.charAt(0)}</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{aluno.nome}</h1>
                <p className="text-sm text-gray-400">Matrícula: <span className="font-mono">{aluno.matricula}</span></p>
                <Link href={`/secretaria/turmas/${aluno.turma.id}`} className="text-sm text-purple-500 hover:underline">
                  {aluno.turma.nome}
                </Link>
                {aluno.email && <p className="text-xs text-gray-400 mt-0.5">{aluno.email}</p>}
                {aluno.telefone && <p className="text-xs text-gray-400">{aluno.telefone}</p>}
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-0.5 justify-end">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < aluno.estrelas ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">{aluno.estrelas}/10 estrelas</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-50">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{aluno.ocorrencias.length}</p>
              <p className="text-xs text-gray-400 flex items-center justify-center gap-1 mt-1">
                <ClipboardList className="w-3 h-3" /> Total
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{positivas}</p>
              <p className="text-xs text-gray-400 flex items-center justify-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-green-500" /> Positivas
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{negativas}</p>
              <p className="text-xs text-gray-400 flex items-center justify-center gap-1 mt-1">
                <TrendingDown className="w-3 h-3 text-red-400" /> Negativas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Histórico */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900">Histórico de Ocorrências</h2>
        </div>

        {aluno.ocorrencias.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Nenhuma ocorrência registrada.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {aluno.ocorrencias.map((oc) => (
              <div key={oc.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {oc.motivo && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          oc.motivo.positivo ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                        }`}>
                          {oc.motivo.titulo}
                        </span>
                      )}
                      {oc.deltaEstrelas !== 0 && (
                        <span className={`text-xs font-mono font-bold ${oc.deltaEstrelas > 0 ? "text-green-600" : "text-red-500"}`}>
                          {oc.deltaEstrelas > 0 ? "+" : ""}{oc.deltaEstrelas} ⭐
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{oc.descricao}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {oc.professor.name}
                      {oc.professor.discipline}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {format(new Date(oc.data), "dd MMM yyyy", { locale: ptBR })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
