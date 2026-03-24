// src/app/secretaria/relatorios/page.tsx
"use client";
import { useState, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  BarChart3, Download, Loader2, TrendingUp, TrendingDown,
  ClipboardList, Users, Star, Award, BookOpen, GraduationCap,
} from "lucide-react";

export default function RelatoriosSecretariaPage() {
  const [dados, setDados] = useState<any>(null);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [turmaId, setTurmaId] = useState("");
  const [dias, setDias] = useState("30");
  const [loading, setLoading] = useState(false);
  const [aba, setAba] = useState<"visao-geral" | "alunos" | "disciplinas" | "professores">("visao-geral");

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
    const turma = turmas.find((t) => t.id === turmaId);

    doc.setFontSize(20);
    doc.setTextColor(88, 28, 135);
    doc.text("Relatório Escolar de Ocorrências", 14, 20);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Período: últimos ${dias} dias`, 14, 30);
    doc.text(`Turma: ${turma?.nome || "Todas"}`, 14, 36);
    doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`, 14, 42);

    // Resumo
    doc.setFontSize(12);
    doc.setTextColor(88, 28, 135);
    doc.text("Resumo Geral", 14, 54);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Total de ocorrências: ${dados.totalOcorrencias}`, 14, 62);
    doc.text(`Positivas: ${dados.totalPositivas}  |  Negativas: ${dados.totalNegativas}`, 14, 68);
    doc.text(`Total de alunos: ${dados.totalAlunos}  |  Média de estrelas: ${dados.mediaEstrelas}`, 14, 74);

    let y = 84;

    // Ranking melhores alunos
    if (dados.rankingMelhores?.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(88, 28, 135);
      doc.text("Ranking — Melhores Alunos", 14, y);
      doc.setTextColor(0, 0, 0);
      autoTable(doc, {
        startY: y + 4,
        head: [["#", "Aluno", "Turma", "Estrelas", "Positivas", "Negativas"]],
        body: dados.rankingMelhores.map((a: any, i: number) => [
          i + 1, a.nome, a.turma, `⭐ ${a.estrelas}`, a.positivas, a.negativas,
        ]),
        headStyles: { fillColor: [88, 28, 135] },
        alternateRowStyles: { fillColor: [248, 245, 255] },
      });
      y = (doc as any).lastAutoTable.finalY + 12;
    }

    // Top ocorrências negativas
    if (dados.topAlunos?.length > 0) {
      if (y > 220) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setTextColor(88, 28, 135);
      doc.text("Alunos com mais ocorrências negativas", 14, y);
      doc.setTextColor(0, 0, 0);
      autoTable(doc, {
        startY: y + 4,
        head: [["Aluno", "Total", "Negativas", "Positivas", "Estrelas"]],
        body: dados.topAlunos.map((a: any) => [
          a.nome, a.total, a.negativas, a.positivas, `⭐ ${a.estrelas}`,
        ]),
        headStyles: { fillColor: [185, 28, 28] },
      });
      y = (doc as any).lastAutoTable.finalY + 12;
    }

    // Por disciplina
    if (dados.porDisciplina?.length > 0) {
      if (y > 220) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setTextColor(88, 28, 135);
      doc.text("Ocorrências por Disciplina", 14, y);
      doc.setTextColor(0, 0, 0);
      autoTable(doc, {
        startY: y + 4,
        head: [["Disciplina", "Total", "Positivas", "Negativas"]],
        body: dados.porDisciplina.map((d: any) => [d.nome, d.total, d.positivas, d.negativas]),
        headStyles: { fillColor: [30, 64, 175] },
      });
      y = (doc as any).lastAutoTable.finalY + 12;
    }

    // Por turma
    if (dados.porTurma?.length > 1) {
      if (y > 220) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setTextColor(88, 28, 135);
      doc.text("Ocorrências por Turma", 14, y);
      doc.setTextColor(0, 0, 0);
      autoTable(doc, {
        startY: y + 4,
        head: [["Turma", "Total", "Positivas", "Negativas"]],
        body: dados.porTurma.map((t: any) => [t.nome, t.total, t.positivas, t.negativas]),
        headStyles: { fillColor: [5, 150, 105] },
      });
      y = (doc as any).lastAutoTable.finalY + 12;
    }

    // Por motivo
    if (dados.porMotivo?.length > 0) {
      if (y > 220) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setTextColor(88, 28, 135);
      doc.text("Distribuição por Motivo", 14, y);
      doc.setTextColor(0, 0, 0);
      autoTable(doc, {
        startY: y + 4,
        head: [["Motivo", "Ocorrências"]],
        body: dados.porMotivo.map((m: any) => [m.name, m.value]),
        headStyles: { fillColor: [88, 28, 135] },
      });
    }

    doc.save(`relatorio-secretaria-${dias}dias.pdf`);
  }

  const abas = [
    { id: "visao-geral", label: "Visão Geral", icon: BarChart3 },
    { id: "alunos", label: "Alunos", icon: Users },
    { id: "disciplinas", label: "Disciplinas", icon: BookOpen },
    { id: "professores", label: "Professores", icon: GraduationCap },
  ] as const;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-500 text-sm mt-1">Visão completa das ocorrências escolares</p>
        </div>
        <button onClick={exportarPDF} disabled={!dados}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40">
          <Download className="w-4 h-4" /> Exportar PDF
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
          {/* Cards resumo */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            {[
              { label: "Total", value: dados.totalOcorrencias, icon: ClipboardList, color: "blue" },
              { label: "Positivas", value: dados.totalPositivas, icon: TrendingUp, color: "green" },
              { label: "Negativas", value: dados.totalNegativas, icon: TrendingDown, color: "red" },
              { label: "Alunos", value: dados.totalAlunos, icon: Users, color: "purple" },
              { label: "Média ⭐", value: dados.mediaEstrelas, icon: Star, color: "amber" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${
                    color === "blue" ? "text-blue-500" : color === "green" ? "text-green-500" :
                    color === "red" ? "text-red-500" : color === "purple" ? "text-purple-500" : "text-amber-500"
                  }`} />
                  <span className="text-xs text-gray-500">{label}</span>
                </div>
                <p className={`text-2xl font-bold ${
                  color === "green" ? "text-green-600" : color === "red" ? "text-red-600" : "text-gray-900"
                }`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Abas */}
          <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
            {abas.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setAba(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  aba === id ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}>
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Aba Visão Geral */}
          {aba === "visao-geral" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
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
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h2 className="text-base font-semibold text-gray-900 mb-4">Distribuição por motivo</h2>
                  {dados.porMotivo.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">Sem dados</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={dados.porMotivo} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                          {dados.porMotivo.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 12, border: "none" }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {dados.porTurma?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">Ocorrências por turma</h2>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={dados.porTurma} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="nome" tick={{ fontSize: 10 }} tickLine={false} />
                        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: "none" }} />
                        <Bar dataKey="positivas" name="Positivas" fill="#10B981" radius={[4, 4, 0, 0]} stackId="a" />
                        <Bar dataKey="negativas" name="Negativas" fill="#EF4444" radius={[4, 4, 0, 0]} stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Aba Alunos */}
          {aba === "alunos" && (
            <div className="space-y-6">
              {/* Ranking melhores */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-amber-500" />
                  <h2 className="text-base font-semibold text-gray-900">Ranking — Melhores Alunos</h2>
                  <span className="text-xs text-gray-400 ml-1">(estrelas + ocorrências positivas - negativas)</span>
                </div>
                <div className="space-y-2">
                  {dados.rankingMelhores?.map((a: any, i: number) => (
                    <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                      i === 0 ? "bg-amber-50 border border-amber-200" :
                      i === 1 ? "bg-gray-50 border border-gray-200" :
                      i === 2 ? "bg-orange-50 border border-orange-200" :
                      "border border-gray-100"
                    }`}>
                      <span className={`text-sm font-bold w-6 text-center ${
                        i === 0 ? "text-amber-600" : i === 1 ? "text-gray-500" : i === 2 ? "text-orange-600" : "text-gray-300"
                      }`}>
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{a.nome}</p>
                        <p className="text-xs text-gray-400">{a.turma}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-amber-600 font-medium">⭐ {a.estrelas}</span>
                        <span className="text-green-600">+{a.positivas}</span>
                        <span className="text-red-500">-{a.negativas}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top ocorrências negativas */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                  <h2 className="text-base font-semibold text-gray-900">Alunos com mais ocorrências</h2>
                </div>
                <div className="space-y-2.5">
                  {dados.topAlunos.map((a: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-4 font-mono">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm font-medium text-gray-800">{a.nome}</span>
                          <div className="flex items-center gap-2 text-xs ml-2">
                            <span className="text-green-600">+{a.positivas}</span>
                            <span className="text-red-500">-{a.negativas}</span>
                            <span className="text-gray-400">{a.total} total</span>
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
              </div>
            </div>
          )}

          {/* Aba Disciplinas */}
          {aba === "disciplinas" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Ocorrências por Disciplina</h2>
              {dados.porDisciplina?.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Sem dados</p>
              ) : (
                <div className="space-y-3">
                  {dados.porDisciplina?.map((d: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:bg-gray-50">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{d.nome}</span>
                          <span className="text-xs text-gray-400">{d.total} total</span>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div className="bg-green-500 h-1.5 rounded-full"
                              style={{ width: `${(d.positivas / d.total) * 100}%` }} />
                          </div>
                        </div>
                        <div className="flex gap-3 mt-1 text-xs">
                          <span className="text-green-600">{d.positivas} positivas</span>
                          <span className="text-red-500">{d.negativas} negativas</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Aba Professores */}
          {aba === "professores" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Atividade por Professor</h2>
              {dados.porProfessor?.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Sem dados</p>
              ) : (
                <div className="space-y-3">
                  {dados.porProfessor?.map((p: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:bg-gray-50">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-700 font-bold text-sm">{p.nome.charAt(0)}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{p.nome}</span>
                          <span className="text-xs text-gray-400">{p.total} registros</span>
                        </div>
                        <div className="flex gap-3 text-xs">
                          <span className="text-green-600">✓ {p.positivas} positivas</span>
                          <span className="text-red-500">✗ {p.negativas} negativas</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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