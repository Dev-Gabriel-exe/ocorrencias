"use client";
// src/app/secretaria/relatorios/page.tsx
import { useState, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { BarChart3, Download, Loader2, TrendingUp, TrendingDown, ClipboardList, Users } from "lucide-react";

export default function RelatoriosSecretariaPage() {
  const [dados, setDados] = useState<any>(null);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [turmaId, setTurmaId] = useState("");
  const [dias, setDias] = useState("30");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/turmas").then((r) => r.json()).then(setTurmas);
  }, []);

  useEffect(() => { carregarDados(); }, [turmaId, dias]);

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

    doc.setFontSize(18);
    doc.text("Relatório Geral de Ocorrências", 14, 20);
    doc.setFontSize(11);
    doc.text(`Período: últimos ${dias} dias`, 14, 30);
    doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 38);

    if (dados) {
      doc.setFontSize(13);
      doc.text(`Total: ${dados.totalOcorrencias} | Positivas: ${dados.totalPositivas} | Negativas: ${dados.totalNegativas}`, 14, 50);

      if (dados.topAlunos?.length > 0) {
        doc.setFontSize(12);
        doc.text("Alunos com mais ocorrências", 14, 64);
        autoTable(doc, {
          startY: 68,
          head: [["Aluno", "Total", "Negativas"]],
          body: dados.topAlunos.map((a: any) => [a.nome, a.total, a.negativas]),
          headStyles: { fillColor: [88, 28, 135] },
        });
      }

      if (dados.porMotivo?.length > 0) {
        const finalY = (doc as any).lastAutoTable?.finalY || 120;
        doc.text("Distribuição por motivo", 14, finalY + 16);
        autoTable(doc, {
          startY: finalY + 20,
          head: [["Motivo", "Ocorrências"]],
          body: dados.porMotivo.map((m: any) => [m.name, m.value]),
          headStyles: { fillColor: [88, 28, 135] },
        });
      }
    }

    doc.save(`relatorio-secretaria-${dias}dias.pdf`);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-500 text-sm mt-1">Visão geral das ocorrências escolares</p>
        </div>
        <button
          onClick={exportarPDF}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar PDF
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select value={turmaId} onChange={(e) => setTurmaId(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
          <option value="">Todas as turmas</option>
          {turmas.map((t: any) => <option key={t.id} value={t.id}>{t.nome}</option>)}
        </select>
        <select value={dias} onChange={(e) => setDias(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
          <option value="180">Últimos 6 meses</option>
          <option value="365">Último ano</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        </div>
      ) : dados ? (
        <>
          {/* Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Total", value: dados.totalOcorrencias, icon: ClipboardList, color: "blue" },
              { label: "Positivas", value: dados.totalPositivas, icon: TrendingUp, color: "green" },
              { label: "Negativas", value: dados.totalNegativas, icon: TrendingDown, color: "red" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${color === "blue" ? "text-blue-500" : color === "green" ? "text-green-500" : "text-red-500"}`} />
                  <span className="text-sm text-gray-500">{label}</span>
                </div>
                <p className={`text-3xl font-bold ${color === "green" ? "text-green-600" : color === "red" ? "text-red-600" : "text-gray-900"}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Gráfico de linha — tendência */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Tendência de ocorrências</h2>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={dados.porDia} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="data" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                <Legend />
                <Line type="monotone" dataKey="positivas" name="Positivas" stroke="#10B981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="negativas" name="Negativas" stroke="#EF4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="ocorrencias" name="Total" stroke="#6366F1" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Pizza */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Distribuição por motivo</h2>
              {dados.porMotivo.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Sem dados</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={dados.porMotivo} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                      {dados.porMotivo.map((entry: any, index: number) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top alunos */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-500" />
                  Top alunos com mais ocorrências
                </span>
              </h2>
              {dados.topAlunos.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Sem dados</p>
              ) : (
                <div className="space-y-2.5">
                  {dados.topAlunos.map((a: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-4 text-right font-mono">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm font-medium text-gray-800 truncate">{a.nome}</span>
                          <div className="flex items-center gap-2 ml-2">
                            <span className="text-xs text-red-500">{a.negativas}↓</span>
                            <span className="text-xs text-gray-400">{a.total} total</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="bg-purple-500 h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, (a.total / (dados.topAlunos[0]?.total || 1)) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <BarChart3 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">Nenhum dado encontrado para o período selecionado.</p>
        </div>
      )}
    </div>
  );
}
