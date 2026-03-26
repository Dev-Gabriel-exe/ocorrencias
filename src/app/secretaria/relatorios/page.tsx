"use client";
// src/app/secretaria/relatorios/page.tsx

import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, Star,
  AlertTriangle, Filter,
} from "lucide-react";

export default function Page() {
  const [dados, setDados] = useState<any>(null);
  const [dias, setDias] = useState("30");
  const [turmaId, setTurmaId] = useState("");
  const [professorId, setProfessorId] = useState("");

  useEffect(() => { load(); }, [dias, turmaId, professorId]);

  async function load() {
    const params = new URLSearchParams({ dias });
    if (turmaId) params.set("turmaId", turmaId);
    if (professorId) params.set("professorId", professorId);

    const res = await fetch(`/api/relatorios/turma?${params}`);
    setDados(await res.json());
  }

  if (!dados) return null;

  // =========================
  // 🧠 INSIGHTS INTELIGENTES
  // =========================
  function gerarInsights() {
    const list = [];

    const turmaCritica = dados.porTurma?.find((t: any) => t.negativas > t.positivas);
    if (turmaCritica)
      list.push({
        type: "danger",
        text: `Turma ${turmaCritica.nome} com mais negativas que positivas`,
      });

    const professorCritico = dados.porProfessor?.find(
      (p: any) => p.negativas > p.positivas
    );
    if (professorCritico)
      list.push({
        type: "warning",
        text: `Professor ${professorCritico.nome} com alto índice negativo`,
      });

    const alunoCritico = dados.topAlunos?.[0];
    if (alunoCritico && alunoCritico.negativas > 10)
      list.push({
        type: "danger",
        text: `Aluno ${alunoCritico.nome} precisa de atenção urgente`,
      });

    // tendência
    const ultimos = dados.porDia.slice(-5);
    const soma = ultimos.reduce((acc: any, d: any) => acc + d.negativas, 0);
    if (soma > 20)
      list.push({
        type: "warning",
        text: "Aumento recente de ocorrências negativas",
      });

    return list;
  }

  const insights = gerarInsights();

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-bold">BI Escolar</h1>
          <p className="text-sm text-gray-500">Análise inteligente</p>
        </div>

        <div className="flex gap-2">
          <select value={dias} onChange={(e) => setDias(e.target.value)}
            className="border px-3 py-2 rounded-xl text-sm">
            <option value="7">7 dias</option>
            <option value="30">30 dias</option>
            <option value="90">90 dias</option>
          </select>
        </div>
      </div>

      {/* FILTROS ATIVOS */}
      {(turmaId || professorId) && (
        <div className="flex items-center gap-2 text-xs bg-purple-50 p-2 rounded-xl">
          <Filter className="w-3 h-3" />
          Filtro ativo:
          {turmaId && <span className="font-medium">Turma</span>}
          {professorId && <span className="font-medium">Professor</span>}
          <button onClick={() => { setTurmaId(""); setProfessorId(""); }}
            className="ml-2 text-purple-600 underline">
            limpar
          </button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid xl:grid-cols-4 gap-4">
        <Card title="Total" value={dados.totalOcorrencias} />
        <Card title="Positivas" value={dados.totalPositivas} />
        <Card title="Negativas" value={dados.totalNegativas} />
        <Card title="Média ⭐" value={dados.mediaEstrelas} />
      </div>

      {/* INSIGHTS */}
      <div className="bg-white p-6 rounded-2xl border">
        <h2 className="font-semibold mb-4 flex gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          Insights automáticos
        </h2>

        {insights.length === 0 ? (
          <p className="text-sm text-gray-400">Sem alertas</p>
        ) : (
          <div className="space-y-2">
            {insights.map((i, idx) => (
              <div key={idx}
                className={`p-3 rounded-lg text-sm ${
                  i.type === "danger"
                    ? "bg-red-50 text-red-600"
                    : "bg-orange-50 text-orange-600"
                }`}>
                {i.text}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* GRID */}
      <div className="grid xl:grid-cols-12 gap-6">

        {/* TREND */}
        <div className="xl:col-span-8 bg-white p-6 rounded-2xl border">
          <h2 className="mb-4 font-semibold">Tendência</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dados.porDia}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" />
              <YAxis />
              <Tooltip />
              <Line dataKey="positivas" stroke="#10B981" />
              <Line dataKey="negativas" stroke="#EF4444" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* TURMAS CLICK */}
        <div className="xl:col-span-4 bg-white p-6 rounded-2xl border">
          <h2 className="mb-4 font-semibold">Turmas</h2>

          {dados.porTurma.map((t: any, i: number) => (
            <button
              key={i}
              onClick={() => setTurmaId(t.id)}
              className={`w-full flex justify-between p-2 rounded-lg text-sm ${
                turmaId === t.id ? "bg-purple-100" : "hover:bg-gray-50"
              }`}
            >
              <span>{t.nome}</span>
              <span>{t.negativas}</span>
            </button>
          ))}
        </div>

        {/* PROFESSORES CLICK */}
        <div className="xl:col-span-6 bg-white p-6 rounded-2xl border">
          <h2 className="mb-4 font-semibold">Professores</h2>

          {dados.porProfessor.map((p: any, i: number) => (
            <button
              key={i}
              onClick={() => setProfessorId(p.id)}
              className={`w-full flex justify-between p-2 rounded-lg text-sm ${
                professorId === p.id ? "bg-purple-100" : "hover:bg-gray-50"
              }`}
            >
              <span>{p.nome}</span>
              <span>{p.total}</span>
            </button>
          ))}
        </div>

        {/* MOTIVOS */}
        <div className="xl:col-span-6 bg-white p-6 rounded-2xl border">
          <h2 className="mb-4 font-semibold">Motivos</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={dados.porMotivo} dataKey="value">
                {dados.porMotivo.map((e: any, i: number) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}

// =========================
// COMPONENTE KPI
// =========================
function Card({ title, value }: any) {
  return (
    <div className="bg-white p-4 rounded-2xl border shadow-sm">
      <p className="text-xs text-gray-500">{title}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}