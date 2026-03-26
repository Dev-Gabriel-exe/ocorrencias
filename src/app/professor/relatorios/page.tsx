
// src/app/professor/relatorios/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  BarChart3, Download, Loader2,
  TrendingUp, TrendingDown, ClipboardList
} from "lucide-react";
import { useSession } from "next-auth/react";

export default function RelatoriosProfessorPage() {
  const { data: session } = useSession();

  const [dados, setDados] = useState<any>(null);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [turmaId, setTurmaId] = useState("");
  const [dias, setDias] = useState("30");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/turmas").then((r) => r.json()).then(setTurmas);
  }, []);

  useEffect(() => {
    carregarDados();
  }, [turmaId, dias]);

  async function carregarDados() {
    setLoading(true);
    const params = new URLSearchParams({ dias });
    if (turmaId) params.set("turmaId", turmaId);

    const res = await fetch(`/api/relatorios/turma?${params}`);
    if (res.ok) setDados(await res.json());

    setLoading(false);
  }

  async function exportarPDF() {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF();
    doc.text("Relatório de Ocorrências", 14, 20);
    doc.text(`Professor: ${session?.user?.name}`, 14, 30);

    if (dados?.topAlunos?.length > 0) {
      autoTable(doc, {
        startY: 40,
        head: [["Aluno", "Total"]],
        body: dados.topAlunos.map((a: any) => [a.nome, a.total]),
      });
    }

    doc.save("relatorio.pdf");
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-500 text-sm">
            Insights inteligentes da sua turma
          </p>
        </div>

        <button
          onClick={exportarPDF}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm hover:bg-black transition"
        >
          <Download className="w-4 h-4" />
          Exportar
        </button>
      </div>

      {/* FILTROS MODERNOS */}
      <div className="flex flex-wrap gap-2">
        <select
          value={turmaId}
          onChange={(e) => setTurmaId(e.target.value)}
          className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm"
        >
          <option value="">Todas as turmas</option>
          {turmas.map((t) => (
            <option key={t.id} value={t.id}>{t.nome}</option>
          ))}
        </select>

        {["7", "30", "90", "180"].map((d) => (
          <button
            key={d}
            onClick={() => setDias(d)}
            className={`px-4 py-2 rounded-full text-sm border ${
              dias === d
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            {d} dias
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : dados ? (
        <>
          {/* KPI PREMIUM */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <ClipboardList className="w-5 h-5 mb-2 opacity-80" />
              <p className="text-3xl font-bold">{dados.totalOcorrencias}</p>
              <p className="text-sm opacity-80">Total</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white">
              <TrendingUp className="w-5 h-5 mb-2 opacity-80" />
              <p className="text-3xl font-bold">{dados.totalPositivas}</p>
              <p className="text-sm opacity-80">Positivas</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 text-white">
              <TrendingDown className="w-5 h-5 mb-2 opacity-80" />
              <p className="text-3xl font-bold">{dados.totalNegativas}</p>
              <p className="text-sm opacity-80">Negativas</p>
            </div>
          </div>

          {/* GRÁFICO */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h2 className="font-semibold mb-4">Evolução</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dados.porDia}>
                <CartesianGrid stroke="#f1f5f9" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="positivas" fill="#22c55e" radius={6} />
                <Bar dataKey="negativas" fill="#ef4444" radius={6} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PIE */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="font-semibold mb-4">Motivos</h2>

              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={dados.porMotivo}
                    dataKey="value"
                    innerRadius={50}
                    outerRadius={80}
                  >
                    {dados.porMotivo.map((e: any, i: number) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* TOP ALUNOS */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="font-semibold mb-4">Ranking</h2>

              <div className="space-y-3">
                {dados.topAlunos.map((a: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50"
                  >
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-sm font-bold">
                      {i + 1}
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-medium">{a.nome}</p>
                      <div className="w-full bg-gray-200 h-1.5 rounded-full mt-1">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{
                            width: `${(a.total / (dados.topAlunos[0]?.total || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    <span className="text-sm font-bold text-gray-700">
                      {a.total}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-3" />
          Sem dados
        </div>
      )}
    </div>
  );
}