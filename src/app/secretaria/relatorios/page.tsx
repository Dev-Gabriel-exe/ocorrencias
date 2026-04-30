"use client";
// src/app/secretaria/relatorios/page.tsx
import { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  Legend, AreaChart, Area,
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, Star, AlertTriangle,
  Trophy, Medal, Award, RefreshCw, ChevronDown, ChevronUp,
  BookOpen, BarChart3, Zap, Target, ArrowUpRight, ArrowDownRight,
  Calendar, ThumbsUp,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const CORES_GRAFICO = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#3b82f6","#f97316","#14b8a6"];
const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Barinha de estrelas compatível com Float
function BarraEstrelas({ valor, max = 10, cor = "yellow" }: { valor: number; max?: number; cor?: string }) {
  const preenchidos = Math.round(valor); // arredonda só para exibição visual
  return (
    <div className="flex gap-px">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i < preenchidos
              ? cor === "yellow" ? "bg-yellow-400"
              : cor === "purple" ? "bg-purple-400"
              : "bg-emerald-400"
              : "bg-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

export default function RelatoriosSecretariaPage() {
  const [dados, setDados] = useState<any>(null);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [dias, setDias] = useState("30");
  const [turmaId, setTurmaId] = useState("");
  const [nivelFiltro, setNivelFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<"geral" | "turmas" | "alunos" | "semana">("geral");
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date>(new Date());
  const [expandidoTurma, setExpandidoTurma] = useState<string | null>(null);
  const [alunosSemOcorrencia, setAlunosSemOcorrencia] = useState<any[]>([]);
  const [positivasPorAluno, setPositivasPorAluno] = useState<Record<string, { total: number; disciplinas: string[] }>>({});
  const [turmaFiltroSemOc, setTurmaFiltroSemOc] = useState("");

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ dias });
      if (turmaId) params.set("turmaId", turmaId);

      const [resRel, resTurmas] = await Promise.all([
        fetch(`/api/relatorios/turma?${params}`),
        fetch("/api/turmas"),
      ]);

      const [dadosRel, dadosTurmas] = await Promise.all([
        resRel.json(),
        resTurmas.json(),
      ]);

      setDados(dadosRel);
      setTurmas(dadosTurmas);
      setPositivasPorAluno(dadosRel.positivasPorAluno ?? {});
      setUltimaAtualizacao(new Date());

      // Alunos sem ocorrência negativa
      const resAlunos = await fetch("/api/alunos");
      const todosAlunos: any[] = resAlunos.ok ? await resAlunos.json() : [];
      const idsComNegativa = new Set(dadosRel.todosAlunosComOcorrencia || []);
      setAlunosSemOcorrencia(todosAlunos.filter((a: any) => !idsComNegativa.has(a.id)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [dias, turmaId]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => {
    const interval = setInterval(carregar, 60000);
    return () => clearInterval(interval);
  }, [carregar]);

  if (loading && !dados) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Carregando análise...</p>
      </div>
    );
  }
  if (!dados) return null;

  // ── Cálculos ─────────────────────────────────────────────────────────────

  const taxaPositividade = dados.totalOcorrencias > 0
    ? ((dados.totalPositivas / dados.totalOcorrencias) * 100).toFixed(1)
    : "0.0";

  const porDiaComVariacao = (dados.porDia || []).map((d: any, i: number, arr: any[]) => ({
    ...d,
    variacaoNeg: arr[i - 1] ? d.negativas - arr[i - 1].negativas : 0,
  }));

  const ultimaSemana = (dados.porDia || []).slice(-7);
  const semanaAnterior = (dados.porDia || []).slice(-14, -7);
  const negSemana = ultimaSemana.reduce((acc: number, d: any) => acc + (d.negativas || 0), 0);
  const negSemanaAnterior = semanaAnterior.reduce((acc: number, d: any) => acc + (d.negativas || 0), 0);
  const posSemana = ultimaSemana.reduce((acc: number, d: any) => acc + (d.positivas || 0), 0);
  const variacaoSemana = negSemanaAnterior > 0
    ? (((negSemana - negSemanaAnterior) / negSemanaAnterior) * 100).toFixed(1)
    : "0";

  // Heatmap por dia da semana — soma ocorrências negativas por dia (0=Dom…6=Sáb)
  const heatmapDiaSemana: { dia: string; negativas: number; positivas: number }[] = DIAS_SEMANA.map((dia) => ({
    dia, negativas: 0, positivas: 0,
  }));
  (dados.porDia || []).forEach((d: any, idx: number) => {
    // A API retorna porDia em ordem cronológica — calculamos o dia da semana relativo ao final
    const totalDias = dados.porDia.length;
    const hoje = new Date();
    const dataItem = new Date(hoje);
    dataItem.setDate(hoje.getDate() - (totalDias - 1 - idx));
    const dow = dataItem.getDay();
    heatmapDiaSemana[dow].negativas += d.negativas || 0;
    heatmapDiaSemana[dow].positivas += d.positivas || 0;
  });
  const maxHeatmap = Math.max(...heatmapDiaSemana.map((d) => d.negativas), 1);

  // Turmas filtradas por nível
  const turmasFiltradas = turmas.filter((t) => !nivelFiltro || t.nivel === nivelFiltro);
  const turmasRankeadas = (dados.porTurma || [])
    .filter((t: any) => !nivelFiltro || turmasFiltradas.some((tf) => tf.nome === t.nome))
    .map((t: any) => ({
      ...t,
      score: (t.positivas || 0) - (t.negativas || 0),
      taxa: t.total > 0 ? ((t.positivas / t.total) * 100).toFixed(1) : "0",
    }))
    .sort((a: any, b: any) => b.score - a.score);

  // Ranking de disciplinas
  const porDisciplinaOrdenado = [...(dados.porDisciplina || [])]
    .sort((a: any, b: any) => b.total - a.total);

  const alunosDestaque = (dados.topAlunos || [])
    .filter((a: any) => a.estrelas >= 7).slice(0, 10);

  const alunosCriticos = (dados.topAlunos || [])
    .filter((a: any) => (a.negativas || 0) > 3)
    .sort((a: any, b: any) => b.negativas - a.negativas).slice(0, 10);

  const professoresRanking = [...(dados.porProfessor || [])]
    .sort((a: any, b: any) => b.total - a.total).slice(0, 8);

  // Insights automáticos
  const insights: { tipo: "danger" | "warning" | "success" | "info"; titulo: string; detalhe: string }[] = [];
  if (Number(variacaoSemana) > 20)
    insights.push({ tipo: "danger", titulo: "Aumento de ocorrências negativas", detalhe: `+${variacaoSemana}% vs semana anterior` });
  if (Number(variacaoSemana) < -20)
    insights.push({ tipo: "success", titulo: "Redução de ocorrências negativas", detalhe: `${variacaoSemana}% vs semana anterior` });
  if (turmasRankeadas.length > 0 && turmasRankeadas[turmasRankeadas.length - 1]?.score < -5)
    insights.push({ tipo: "warning", titulo: `Turma em atenção: ${turmasRankeadas[turmasRankeadas.length - 1]?.nome}`, detalhe: "Score negativo elevado" });
  if (Number(taxaPositividade) > 60)
    insights.push({ tipo: "success", titulo: "Clima escolar positivo", detalhe: `${taxaPositividade}% das ocorrências são positivas` });
  if (alunosCriticos.length > 5)
    insights.push({ tipo: "warning", titulo: `${alunosCriticos.length} alunos precisam de acompanhamento`, detalhe: "Mais de 3 ocorrências negativas no período" });

  // Pior dia da semana
  const piorDia = heatmapDiaSemana.reduce((a, b) => b.negativas > a.negativas ? b : a, heatmapDiaSemana[0]);
  if (piorDia.negativas > 3)
    insights.push({ tipo: "info", titulo: `${piorDia.dia}feira concentra mais ocorrências`, detalhe: `${piorDia.negativas} negativas nesse dia no período` });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-12">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            Painel de Análise
          </h1>
          <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3" />
            Atualizado {format(ultimaAtualizacao, "HH:mm:ss", { locale: ptBR })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro por nível */}
          <select
            value={nivelFiltro}
            onChange={(e) => setNivelFiltro(e.target.value)}
            className="border border-gray-200 px-3 py-2 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Todos os níveis</option>
            <option value="FUND_I">Fund. I</option>
            <option value="FUND_II">Fund. II</option>
            <option value="MEDIO">Médio</option>
          </select>

          <select
            value={dias}
            onChange={(e) => setDias(e.target.value)}
            className="border border-gray-200 px-3 py-2 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="60">Últimos 60 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>

          <select
            value={turmaId}
            onChange={(e) => setTurmaId(e.target.value)}
            className="border border-gray-200 px-3 py-2 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Todas as turmas</option>
            {turmasFiltradas.map((t: any) => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </select>

          <button
            onClick={carregar}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-purple-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* ABAS */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit">
        {([
          { id: "geral", label: "Geral", icon: BarChart3 },
          { id: "turmas", label: "Turmas", icon: Users },
          { id: "alunos", label: "Alunos", icon: Trophy },
          { id: "semana", label: "Esta semana", icon: Calendar },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setAbaAtiva(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition ${
              abaAtiva === id ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <KpiCard titulo="Total" valor={dados.totalOcorrencias} sub="ocorrências" cor="blue" icon={<BarChart3 className="w-4 h-4" />} />
        <KpiCard titulo="Positivas" valor={dados.totalPositivas} sub={`${taxaPositividade}% do total`} cor="green" icon={<TrendingUp className="w-4 h-4" />} tendencia="up" />
        <KpiCard titulo="Negativas" valor={dados.totalNegativas} sub={`${(100 - Number(taxaPositividade)).toFixed(1)}% do total`} cor="red" icon={<TrendingDown className="w-4 h-4" />} tendencia="down" />
        <KpiCard
          titulo="Média ⭐"
          valor={Number(dados.mediaEstrelas).toFixed(1)}
          sub="estrelas por aluno"
          cor="amber"
          icon={<Star className="w-4 h-4" />}
        />
        <KpiCard
          titulo="Semana"
          valor={negSemana}
          sub={`${Number(variacaoSemana) > 0 ? "+" : ""}${variacaoSemana}% vs anterior`}
          cor={Number(variacaoSemana) > 0 ? "red" : "green"}
          icon={<Zap className="w-4 h-4" />}
          tendencia={Number(variacaoSemana) > 0 ? "down" : "up"}
        />
      </div>

      {/* INSIGHTS */}
      {insights.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4 text-amber-500" /> Alertas automáticos
          </h2>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {insights.map((ins, i) => (
              <div key={i} className={`flex items-start gap-2.5 p-3 rounded-xl text-sm ${
                ins.tipo === "danger" ? "bg-red-50 text-red-700"
                : ins.tipo === "warning" ? "bg-amber-50 text-amber-700"
                : ins.tipo === "success" ? "bg-emerald-50 text-emerald-700"
                : "bg-blue-50 text-blue-700"
              }`}>
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">{ins.titulo}</p>
                  <p className="opacity-80 text-xs mt-0.5">{ins.detalhe}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ABA GERAL ── */}
      {abaAtiva === "geral" && (
        <div className="space-y-6">

          {/* Evolução */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" /> Evolução de ocorrências
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={porDiaComVariacao}>
                <defs>
                  <linearGradient id="gradPos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gradNeg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="data" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
                  formatter={(v: any, name: string) => [v, name === "positivas" ? "Positivas" : "Negativas"]} />
                <Legend formatter={(v) => v === "positivas" ? "Positivas" : "Negativas"} />
                <Area type="monotone" dataKey="positivas" stroke="#10b981" strokeWidth={2} fill="url(#gradPos)" />
                <Area type="monotone" dataKey="negativas" stroke="#ef4444" strokeWidth={2} fill="url(#gradNeg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid xl:grid-cols-3 gap-6">

            {/* Por motivo */}
<div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
  <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
    <BookOpen className="w-4 h-4 text-blue-600" /> Por motivo
  </h2>
  {dados.porMotivo?.length > 0 ? (
    <div className="space-y-2.5">
      {dados.porMotivo.slice(0, 6).map((m: any, i: number) => {
        const max = dados.porMotivo[0]?.value || 1;
        const pct = ((m.value / max) * 100).toFixed(0);
        return (
          <div key={i}>
            <div className="flex items-center justify-between mb-1 text-xs">
              <span className="text-gray-700 font-medium truncate max-w-[70%]">{m.name}</span>
              <span className="font-semibold text-gray-900 ml-2 flex-shrink-0">{m.value}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: CORES_GRAFICO[i % CORES_GRAFICO.length] }}
              />
            </div>
          </div>
        );
      })}
      {dados.porMotivo.length > 6 && (
        <p className="text-xs text-gray-400 pt-1">
          +{dados.porMotivo.length - 6} outros motivos
        </p>
      )}
    </div>
  ) : (
    <p className="text-sm text-gray-400 text-center py-8">Sem dados</p>
  )}
</div>

            {/* Heatmap por dia da semana — NOVO */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" /> Pior dia da semana
              </h2>
              <p className="text-xs text-gray-400 mb-4">Concentração de negativas por dia</p>
              <div className="space-y-2.5">
                {heatmapDiaSemana.map((d) => {
                  const pct = maxHeatmap > 0 ? (d.negativas / maxHeatmap) * 100 : 0;
                  const isPior = d.dia === piorDia.dia && d.negativas > 0;
                  return (
                    <div key={d.dia} className="flex items-center gap-3">
                      <span className={`text-xs w-7 font-medium flex-shrink-0 ${isPior ? "text-red-500" : "text-gray-400"}`}>
                        {d.dia}
                      </span>
                      <div className="flex-1 h-5 bg-gray-100 rounded-lg overflow-hidden relative">
                        <div
                          className={`h-full rounded-lg transition-all ${isPior ? "bg-red-400" : "bg-purple-300"}`}
                          style={{ width: `${pct}%` }}
                        />
                        {d.negativas > 0 && (
                          <span className="absolute inset-0 flex items-center px-2 text-[10px] font-bold text-white mix-blend-multiply">
                            {d.negativas} neg.
                          </span>
                        )}
                      </div>
                      {d.positivas > 0 && (
                        <span className="text-[10px] text-emerald-600 font-medium flex-shrink-0">+{d.positivas}</span>
                      )}
                      {isPior && (
                        <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">⚠</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Por professor */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" /> Professores mais ativos
              </h2>
              {professoresRanking.length > 0 ? (
                <div className="space-y-2">
                  {professoresRanking.map((p: any, i: number) => {
                    const pct = ((p.total / (professoresRanking[0]?.total || 1)) * 100).toFixed(0);
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-4 text-right">{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium text-gray-800 truncate max-w-[130px]">{p.nome}</span>
                            <span className="text-gray-500">{p.total}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: CORES_GRAFICO[i % CORES_GRAFICO.length] }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">Sem dados</p>
              )}
            </div>
          </div>

          {/* Ranking de disciplinas — NOVO */}
          {porDisciplinaOrdenado.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" /> Ocorrências por disciplina
              </h2>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {porDisciplinaOrdenado.map((d: any, i: number) => {
                  const taxaPos = d.total > 0 ? ((d.positivas / d.total) * 100) : 0;
                  return (
                    <div key={i} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-900 truncate flex-1">{d.nome}</span>
                        <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{d.total} total</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        {/* Barra positivas/negativas */}
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden flex">
                          <div
                            className="h-full bg-emerald-400 rounded-l-full"
                            style={{ width: `${taxaPos}%` }}
                          />
                          <div
                            className="h-full bg-red-400 rounded-r-full"
                            style={{ width: `${100 - taxaPos}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">{taxaPos.toFixed(0)}% pos.</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-emerald-600 font-medium">+{d.positivas}</span>
                        <span className="text-red-500 font-medium">−{d.negativas}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ABA TURMAS ── */}
      {abaAtiva === "turmas" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-600" /> Comparativo geral
            </h2>
            {turmasRankeadas.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={turmasRankeadas} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="nome" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }} />
                  <Legend />
                  <Bar dataKey="positivas" name="Positivas" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="negativas" name="Negativas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-400 text-center py-12">Sem dados de turmas</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-500" /> Ranking de desempenho
            </h2>
            <div className="space-y-3">
              {turmasRankeadas.map((t: any, i: number) => {
                const isTop = i === 0;
                const isBad = i === turmasRankeadas.length - 1 && turmasRankeadas.length > 1;
                const aberta = expandidoTurma === t.id;
                return (
                  <div key={t.id || i} className={`rounded-2xl border transition-all ${
                    isTop ? "border-amber-200 bg-amber-50/40"
                    : isBad ? "border-red-100 bg-red-50/20"
                    : "border-gray-100 bg-white hover:border-gray-200"
                  }`}>
                    <button className="w-full flex items-center gap-4 p-4 text-left" onClick={() => setExpandidoTurma(aberta ? null : (t.id || t.nome))}>
                      <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                        isTop ? "bg-amber-400 text-white" : i === 1 ? "bg-gray-300 text-gray-700" : i === 2 ? "bg-orange-300 text-white" : "bg-gray-100 text-gray-500"
                      }`}>
                        {isTop ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 text-sm">{t.nome}</span>
                          {isTop && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Melhor turma</span>}
                          {isBad && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Precisa atenção</span>}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1 text-emerald-600 font-medium"><TrendingUp className="w-3 h-3" />{t.positivas || 0}</span>
                          <span className="flex items-center gap-1 text-red-500 font-medium"><TrendingDown className="w-3 h-3" />{t.negativas || 0}</span>
                          <span className="text-gray-400">{t.total || 0} total</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className={`text-lg font-bold ${t.score > 0 ? "text-emerald-600" : t.score < 0 ? "text-red-500" : "text-gray-400"}`}>
                          {t.score > 0 ? "+" : ""}{t.score}
                        </div>
                        <div className="text-xs text-gray-400">score</div>
                      </div>
                      {aberta ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                    {aberta && (
                      <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
                            <p className="text-lg font-bold text-gray-900">{t.taxa}%</p>
                            <p className="text-xs text-gray-400">taxa positiva</p>
                          </div>
                          <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
                            <p className="text-lg font-bold text-gray-900">{t.total}</p>
                            <p className="text-xs text-gray-400">ocorrências</p>
                          </div>
                          <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
                            <p className={`text-lg font-bold ${t.score > 0 ? "text-emerald-600" : "text-red-500"}`}>
                              {t.score > 0 ? "↑" : t.score < 0 ? "↓" : "→"}
                            </p>
                            <p className="text-xs text-gray-400">tendência</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── ABA ALUNOS ── */}
      {abaAtiva === "alunos" && (
        <div className="space-y-6">

          {/* Pódio */}
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl border border-amber-100 p-6">
            <h2 className="font-semibold text-amber-900 mb-1 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" /> Alunos Destaque
            </h2>
            <p className="text-xs text-amber-600 mb-5">7+ estrelas — candidatos a premiação</p>
            {alunosDestaque.length === 0 ? (
              <p className="text-sm text-amber-600 text-center py-6">Nenhum aluno atingiu os critérios no período</p>
            ) : (
              <>
                {alunosDestaque.length >= 3 && (
                  <div className="flex items-end justify-center gap-4 mb-6">
                    {[1, 0, 2].map((pos) => {
                      const a = alunosDestaque[pos];
                      const isFirst = pos === 0;
                      return (
                        <div key={pos} className={`text-center ${isFirst ? "-mt-4" : ""}`}>
                          <div className={`rounded-2xl flex items-center justify-center font-bold text-white mx-auto mb-2 shadow-lg ${
                            isFirst ? "w-16 h-16 text-2xl bg-amber-300"
                            : pos === 1 ? "w-14 h-14 text-xl bg-gray-300 text-gray-700"
                            : "w-14 h-14 text-xl bg-orange-300"
                          }`}>
                            {a?.nome?.charAt(0)}
                          </div>
                          <div className={`rounded-xl px-3 py-2 text-center border ${
                            isFirst ? "bg-amber-100 border-amber-200"
                            : pos === 1 ? "bg-gray-100 border-gray-200"
                            : "bg-orange-50 border-orange-100"
                          }`}>
                            {isFirst ? <Trophy className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                            : pos === 1 ? <Medal className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                            : <Award className="w-4 h-4 text-orange-400 mx-auto mb-1" />}
                            <p className="text-xs font-bold truncate max-w-[80px]">{a?.nome?.split(" ")[0]}</p>
                            <BarraEstrelas valor={Math.min(a?.estrelas || 0, 5)} max={5} cor="yellow" />
                            <p className="text-xs text-gray-400 mt-0.5">{a?.turma}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="grid sm:grid-cols-2 gap-2">
                  {alunosDestaque.slice(3).map((a: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 bg-white/80 rounded-xl p-3 border border-amber-100">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-700">{i + 4}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{a.nome}</p>
                        <p className="text-xs text-gray-400">{a.turma}</p>
                      </div>
                      <div className="text-right">
                        <BarraEstrelas valor={Math.min(a.estrelas, 5)} max={5} cor="yellow" />
                        <p className="text-xs text-emerald-600 font-semibold mt-0.5">{a.positivas || 0} elogios</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Sem ocorrências negativas */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Star className="w-4 h-4 text-blue-500" /> Alunos sem ocorrências negativas
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Ordenados por elogios recebidos no período</p>
              </div>
              <select
                value={turmaFiltroSemOc}
                onChange={(e) => setTurmaFiltroSemOc(e.target.value)}
                className="border border-gray-200 px-3 py-2 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]"
              >
                <option value="">Todas as turmas</option>
                {turmas.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
            </div>

            {(() => {
              const filtrados = alunosSemOcorrencia
                .filter((a) => turmaFiltroSemOc ? a.turma?.id === turmaFiltroSemOc : true)
                .sort((a: any, b: any) => {
                  const posA = positivasPorAluno[a.id]?.total ?? 0;
                  const posB = positivasPorAluno[b.id]?.total ?? 0;
                  if (posB !== posA) return posB - posA;
                  return (b.estrelas ?? 0) - (a.estrelas ?? 0);
                });

              if (filtrados.length === 0) {
                return (
                  <div className="text-center py-10">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-2">
                      <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <p className="text-sm text-gray-500">
                      {turmaFiltroSemOc ? "Todos desta turma têm ocorrências negativas" : "Todos os alunos têm pelo menos uma ocorrência negativa"}
                    </p>
                  </div>
                );
              }

              const comElogios = filtrados.filter((a: any) => (positivasPorAluno[a.id]?.total ?? 0) > 0);

              return (
                <>
                  <div className="mb-3 flex items-center gap-2 flex-wrap">
                    <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">
                      {filtrados.length} aluno{filtrados.length !== 1 ? "s" : ""} sem negativos
                    </span>
                    {comElogios.length > 0 && (
                      <span className="text-xs bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" /> {comElogios.length} com elogios
                      </span>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2">
                    {filtrados.map((a: any) => {
                      const elogios = positivasPorAluno[a.id];
                      const temElogio = (elogios?.total ?? 0) > 0;
                      return (
                        <div key={a.id} className={`flex flex-col gap-2 p-3 rounded-xl border transition ${
                          temElogio ? "bg-emerald-50/60 border-emerald-200 hover:bg-emerald-50" : "bg-blue-50/40 border-blue-100 hover:bg-blue-50"
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                              temElogio ? "bg-emerald-200 text-emerald-800" : "bg-blue-100 text-blue-700"
                            }`}>
                              {a.nome?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{a.nome}</p>
                              <p className="text-xs text-gray-400 truncate">{a.turma?.nome}</p>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <BarraEstrelas valor={a.estrelas ?? 5} />
                              <div className="mt-1">
                                {temElogio ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                    +{elogios!.total} 👍
                                  </span>
                                ) : (
                                  <span className="text-xs text-blue-500 font-medium">sem ocorr.</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {temElogio && elogios!.disciplinas.length > 0 && (
                            <div className="flex flex-wrap gap-1 pl-12">
                              {elogios!.disciplinas.map((disc) => (
                                <span key={disc} className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">
                                  {disc}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>

          {/* Alunos críticos */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" /> Alunos que precisam de acompanhamento
            </h2>
            <p className="text-xs text-gray-400 mb-4">Mais de 3 ocorrências negativas no período</p>
            {alunosCriticos.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-sm text-gray-500">Nenhum aluno em situação crítica</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alunosCriticos.map((a: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-red-50/50 border border-red-100">
                    <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center text-sm font-bold text-red-600">
                      {a.nome?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{a.nome}</p>
                      <p className="text-xs text-gray-400">{a.turma}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">{a.negativas} neg.</p>
                      <BarraEstrelas valor={a.estrelas ?? 0} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ABA SEMANA ── */}
      {abaAtiva === "semana" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "variação negativos", valor: `${Number(variacaoSemana) > 0 ? "+" : ""}${variacaoSemana}%`, cor: Number(variacaoSemana) > 0 ? "text-red-500" : "text-emerald-600", sub: "vs semana anterior" },
              { label: "negativos esta semana", valor: negSemana, cor: "text-red-500", sub: "" },
              { label: "positivos esta semana", valor: posSemana, cor: "text-emerald-600", sub: "" },
              { label: "total esta semana", valor: negSemana + posSemana, cor: "text-gray-900", sub: "" },
            ].map((card, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
                <div className={`text-2xl font-bold ${card.cor}`}>{card.valor}</div>
                <p className="text-xs text-gray-400 mt-1">{card.label}</p>
                {card.sub && <p className="text-xs text-gray-300">{card.sub}</p>}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Dia a dia desta semana</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={ultimaSemana}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="data" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }} />
                <Legend />
                <Bar dataKey="positivas" name="Positivas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="negativas" name="Negativas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Esta semana vs semana anterior</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { label: "Positivas", "Esta semana": posSemana, "Semana anterior": semanaAnterior.reduce((a: number, d: any) => a + (d.positivas || 0), 0) },
                { label: "Negativas", "Esta semana": negSemana, "Semana anterior": negSemanaAnterior },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6b7280" }} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }} />
                <Legend />
                <Bar dataKey="Esta semana" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Semana anterior" fill="#d1d5db" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ titulo, valor, sub, cor, icon, tendencia }: {
  titulo: string; valor: any; sub: string; cor: string;
  icon: React.ReactNode; tendencia?: "up" | "down";
}) {
  const corMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600", green: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-500", amber: "bg-amber-50 text-amber-600", purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-xl ${corMap[cor] ?? corMap.blue}`}>{icon}</div>
        {tendencia && (tendencia === "up"
          ? <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          : <ArrowDownRight className="w-4 h-4 text-red-400" />)}
      </div>
      <p className="text-2xl font-bold text-gray-900">{valor}</p>
      <p className="text-xs text-gray-400 mt-0.5">{titulo}</p>
      <p className="text-xs text-gray-300 mt-0.5">{sub}</p>
    </div>
  );
}