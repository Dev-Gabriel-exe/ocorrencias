"use client";
// src/app/secretaria/relatorios/page.tsx
import { useEffect, useState, useCallback, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  Legend, Cell, PieChart, Pie,
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, Star, AlertTriangle,
  Trophy, Medal, Award, RefreshCw, ChevronDown, ChevronUp,
  BookOpen, BarChart3, Zap, Target, ArrowUpRight, ArrowDownRight,
  Calendar, ThumbsUp, Download, Search, Activity, Shield,
  Flame, Layers,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const CORES_GRAFICO = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#3b82f6","#f97316","#14b8a6"];
const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// ── Animated counter hook ──────────────────────────────────────────────────
function useAnimatedCounter(target: number, duration = 700) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);
  useEffect(() => {
    if (target === prevTarget.current) return;
    const start = prevTarget.current;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(start + (target - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
      else { setValue(target); prevTarget.current = target; }
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

// ── Sparkline SVG ──────────────────────────────────────────────────────────
function Sparkline({ data, cor = "#6366f1", altura = 28 }: { data: number[]; cor?: string; altura?: number }) {
  if (!data?.length || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 80;
  const h = altura;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-60">
      <polyline points={pts} fill="none" stroke={cor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(data.length - 1) / (data.length - 1) * w} cy={h - ((data[data.length - 1] - min) / range) * (h - 4) - 2} r="2.5" fill={cor} />
    </svg>
  );
}

// ── Gauge de clima escolar (semicírculo) ───────────────────────────────────
function GaugeClima({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  // Semicírculo: arco de 180°, começa às 9h (180°), vai até 3h (0°)
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const radius = 52;
  const cx = 70; const cy = 68;
  const startAngle = 180;
  const endAngle = 0;
  const progressAngle = 180 - (clamped / 100) * 180;
  const arcX = (angle: number) => cx + radius * Math.cos(toRad(angle));
  const arcY = (angle: number) => cy + radius * Math.sin(toRad(angle));
  const trackPath = `M ${arcX(180)} ${arcY(180)} A ${radius} ${radius} 0 0 1 ${arcX(0)} ${arcY(0)}`;
  const progressPath = clamped > 0
    ? `M ${arcX(180)} ${arcY(180)} A ${radius} ${radius} 0 ${clamped > 50 ? 0 : 0} 1 ${arcX(progressAngle)} ${arcY(progressAngle)}`
    : "";
  const cor = clamped >= 70 ? "#10b981" : clamped >= 40 ? "#f59e0b" : "#ef4444";
  const label = clamped >= 70 ? "Excelente" : clamped >= 50 ? "Bom" : clamped >= 30 ? "Regular" : "Atenção";
  const needleAngle = 180 - (clamped / 100) * 180;
  const nx = cx + 40 * Math.cos(toRad(needleAngle));
  const ny = cy + 40 * Math.sin(toRad(needleAngle));
  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="82" viewBox="0 0 140 82">
        <path d={trackPath} fill="none" stroke="#f3f4f6" strokeWidth="10" strokeLinecap="round" />
        {/* Segmentos coloridos de fundo */}
        <path d={`M ${arcX(180)} ${arcY(180)} A ${radius} ${radius} 0 0 1 ${arcX(120)} ${arcY(120)}`} fill="none" stroke="#fecaca" strokeWidth="10" strokeLinecap="butt" opacity="0.5" />
        <path d={`M ${arcX(120)} ${arcY(120)} A ${radius} ${radius} 0 0 1 ${arcX(60)} ${arcY(60)}`} fill="none" stroke="#fde68a" strokeWidth="10" strokeLinecap="butt" opacity="0.5" />
        <path d={`M ${arcX(60)} ${arcY(60)} A ${radius} ${radius} 0 0 1 ${arcX(0)} ${arcY(0)}`} fill="none" stroke="#a7f3d0" strokeWidth="10" strokeLinecap="butt" opacity="0.5" />
        {/* Progresso */}
        {clamped > 0 && (
          <path d={progressPath} fill="none" stroke={cor} strokeWidth="10" strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease, stroke 0.5s ease" }} />
        )}
        {/* Ponteiro */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#374151" strokeWidth="2" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="5" fill="#374151" />
        <circle cx={cx} cy={cy} r="3" fill="white" />
        {/* Score central */}
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize="18" fontWeight="700" fill={cor}>{clamped}</text>
        <text x={cx} y={cy + 18} textAnchor="middle" fontSize="9" fill="#9ca3af">/ 100</text>
      </svg>
      <span className="text-xs font-bold mt-1" style={{ color: cor }}>{label}</span>
    </div>
  );
}

// ── BarraEstrelas ──────────────────────────────────────────────────────────
function BarraEstrelas({ valor, max = 10, cor = "yellow" }: { valor: number; max?: number; cor?: string }) {
  const preenchidos = Math.round(valor);
  return (
    <div className="flex gap-px">
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
          i < preenchidos
            ? cor === "yellow" ? "bg-yellow-400" : cor === "purple" ? "bg-purple-400" : "bg-emerald-400"
            : "bg-gray-200"
        }`} />
      ))}
    </div>
  );
}

// ── Export helpers ─────────────────────────────────────────────────────────
function exportarCSV(dados: any, dias: string) {
  if (!dados) return;
  const linhas = [
    ["Data", "Positivas", "Negativas"],
    ...(dados.porDia || []).map((d: any) => [d.data, d.positivas, d.negativas]),
  ];
  const csv = linhas.map((l) => l.join(";")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `relatorio_${dias}dias_${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportarCSVAlunos(alunos: any[]) {
  const linhas = [
    ["Nome", "Turma", "Negativos", "Estrelas"],
    ...alunos.map((a) => [a.nome, a.turma, a.negativas, a.estrelas ?? 0]),
  ];
  const csv = linhas.map((l) => l.join(";")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `alunos_criticos_${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ══════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════
export default function RelatoriosSecretariaPage() {
  const [dados, setDados] = useState<any>(null);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [dias, setDias] = useState("30");
  const [turmaId, setTurmaId] = useState("");
  const [nivelFiltro, setNivelFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<"geral" | "turmas" | "alunos" | "analise" | "semana">("geral");
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date>(new Date());
  const [expandidoTurma, setExpandidoTurma] = useState<string | null>(null);
  const [alunosSemOcorrencia, setAlunosSemOcorrencia] = useState<any[]>([]);
  const [positivasPorAluno, setPositivasPorAluno] = useState<Record<string, { total: number; disciplinas: string[] }>>({});
  const [turmaFiltroSemOc, setTurmaFiltroSemOc] = useState("");
  const [buscaAluno, setBuscaAluno] = useState("");
  const [metaPositividade, setMetaPositividade] = useState(60);

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

  // Animated counters
  const totalAnim = useAnimatedCounter(dados?.totalOcorrencias ?? 0);
  const positivasAnim = useAnimatedCounter(dados?.totalPositivas ?? 0);
  const negativasAnim = useAnimatedCounter(dados?.totalNegativas ?? 0);

  if (loading && !dados) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Carregando análise...</p>
      </div>
    );
  }
  if (!dados) return null;

  // ── Cálculos ──────────────────────────────────────────────────────────────
  const taxaPositividade = dados.totalOcorrencias > 0
    ? ((dados.totalPositivas / dados.totalOcorrencias) * 100).toFixed(1)
    : "0.0";

  // Score de clima escolar (0-100)
  const scoreClima = Math.round(
    Math.min(100, Math.max(0,
      (dados.totalPositivas / Math.max(dados.totalOcorrencias, 1)) * 70 +
      Math.min(30, (dados.mediaEstrelas / 10) * 30)
    ))
  );

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

  // Sparklines (últimos 7 dias)
  const sparklinePos = ultimaSemana.map((d: any) => d.positivas || 0);
  const sparklineNeg = ultimaSemana.map((d: any) => d.negativas || 0);
  const sparklineTotal = ultimaSemana.map((d: any, i: number) => (sparklinePos[i] || 0) + (sparklineNeg[i] || 0));

  // Heatmap por dia da semana
  const heatmapDiaSemana: { dia: string; negativas: number; positivas: number }[] = DIAS_SEMANA.map((dia) => ({
    dia, negativas: 0, positivas: 0,
  }));
  (dados.porDia || []).forEach((d: any, idx: number) => {
    const totalDias = dados.porDia.length;
    const hoje = new Date();
    const dataItem = new Date(hoje);
    dataItem.setDate(hoje.getDate() - (totalDias - 1 - idx));
    const dow = dataItem.getDay();
    heatmapDiaSemana[dow].negativas += d.negativas || 0;
    heatmapDiaSemana[dow].positivas += d.positivas || 0;
  });
  const maxHeatmap = Math.max(...heatmapDiaSemana.map((d) => d.negativas), 1);

  // Turmas
  const turmasFiltradas = turmas.filter((t) => !nivelFiltro || t.nivel === nivelFiltro);
  const turmasRankeadas = (dados.porTurma || [])
    .filter((t: any) => !nivelFiltro || turmasFiltradas.some((tf) => tf.nome === t.nome))
    .map((t: any) => ({
      ...t,
      score: (t.positivas || 0) - (t.negativas || 0),
      taxa: t.total > 0 ? ((t.positivas / t.total) * 100).toFixed(1) : "0",
    }))
    .sort((a: any, b: any) => b.score - a.score);

  // Radar data
  const radarData = turmasRankeadas.slice(0, 8).map((t: any) => ({
    turma: t.nome,
    positivas: t.positivas || 0,
    negativas: t.negativas || 0,
  }));

  // Disciplinas
  const porDisciplinaOrdenado = [...(dados.porDisciplina || [])].sort((a: any, b: any) => b.total - a.total);

  // Alunos
  const alunosDestaque = (dados.topAlunos || []).filter((a: any) => a.estrelas >= 7).slice(0, 10);
  const alunosCriticos = (dados.topAlunos || [])
    .filter((a: any) => (a.negativas || 0) > 3)
    .sort((a: any, b: any) => b.negativas - a.negativas)
    .slice(0, 10);

  // Professores
  const professoresRanking = [...(dados.porProfessor || [])].sort((a: any, b: any) => b.total - a.total).slice(0, 8);
  const todosProfs = [...(dados.porProfessor || [])].sort((a: any, b: any) => b.total - a.total);
  const professoresInativos = (dados.porProfessor || []).filter((p: any) => {
    if (!p.ultimaOcorrencia) return false;
    const diasSem = Math.floor((Date.now() - new Date(p.ultimaOcorrencia).getTime()) / 86400000);
    return diasSem > 7;
  });

  // Evolução mensal
  const porMes: Record<string, { mes: string; positivas: number; negativas: number }> = {};
  (dados.porDia || []).forEach((d: any) => {
    const mes = d.data?.slice(0, 7) || "";
    if (!porMes[mes]) porMes[mes] = { mes, positivas: 0, negativas: 0 };
    porMes[mes].positivas += d.positivas || 0;
    porMes[mes].negativas += d.negativas || 0;
  });
  const evolucaoMensal = Object.values(porMes).sort((a, b) => a.mes.localeCompare(b.mes));

  // Distribuição de estrelas
  const distEstrelas: Record<number, number> = {};
  (dados.topAlunos || []).forEach((a: any) => {
    const faixa = Math.floor(Math.min(a.estrelas || 0, 10));
    distEstrelas[faixa] = (distEstrelas[faixa] || 0) + 1;
  });
  const distData = Array.from({ length: 11 }, (_, i) => ({ estrelas: i, alunos: distEstrelas[i] || 0 }));

  // Pior dia
  const piorDia = heatmapDiaSemana.reduce((a, b) => b.negativas > a.negativas ? b : a, heatmapDiaSemana[0]);

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
  if (piorDia.negativas > 3)
    insights.push({ tipo: "info", titulo: `${piorDia.dia}feira concentra mais ocorrências`, detalhe: `${piorDia.negativas} negativas nesse dia no período` });
  if (professoresInativos.length > 0)
    insights.push({ tipo: "warning", titulo: `${professoresInativos.length} professor(es) sem registros recentes`, detalhe: "Mais de 7 dias sem ocorrência registrada" });
  if (Number(taxaPositividade) < metaPositividade)
    insights.push({ tipo: "danger", titulo: "Meta de positividade não atingida", detalhe: `${taxaPositividade}% atual vs meta de ${metaPositividade}%` });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-12">

      {/* ── HEADER ── */}
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
          <select value={nivelFiltro} onChange={(e) => setNivelFiltro(e.target.value)}
            className="border border-gray-200 px-3 py-2 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option value="">Todos os níveis</option>
            <option value="FUND_I">Fund. I</option>
            <option value="FUND_II">Fund. II</option>
            <option value="MEDIO">Médio</option>
          </select>

          <select value={dias} onChange={(e) => setDias(e.target.value)}
            className="border border-gray-200 px-3 py-2 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="60">Últimos 60 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>

          <select value={turmaId} onChange={(e) => setTurmaId(e.target.value)}
            className="border border-gray-200 px-3 py-2 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option value="">Todas as turmas</option>
            {turmasFiltradas.map((t: any) => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </select>

          <button onClick={() => exportarCSV(dados, dias)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 transition">
            <Download className="w-4 h-4" /> Exportar CSV
          </button>

          <button onClick={carregar} disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 transition">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-purple-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── ABAS ── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit flex-wrap">
        {([
          { id: "geral",   label: "Geral",        icon: BarChart3  },
          { id: "turmas",  label: "Turmas",        icon: Users      },
          { id: "alunos",  label: "Alunos",        icon: Trophy     },
          { id: "analise", label: "Análise",       icon: Activity   },
          { id: "semana",  label: "Esta semana",   icon: Calendar   },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setAbaAtiva(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition ${
              abaAtiva === id ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <KpiCard titulo="Total" valor={totalAnim} sub="ocorrências" cor="blue"
          icon={<BarChart3 className="w-4 h-4" />}
          sparkline={sparklineTotal} sparkCor="#6366f1" />
        <KpiCard titulo="Positivas" valor={positivasAnim} sub={`${taxaPositividade}% do total`} cor="green"
          icon={<TrendingUp className="w-4 h-4" />} tendencia="up"
          sparkline={sparklinePos} sparkCor="#10b981" />
        <KpiCard titulo="Negativas" valor={negativasAnim} sub={`${(100 - Number(taxaPositividade)).toFixed(1)}% do total`} cor="red"
          icon={<TrendingDown className="w-4 h-4" />} tendencia="down"
          sparkline={sparklineNeg} sparkCor="#ef4444" />
        <KpiCard titulo="Média ⭐" valor={Number(dados.mediaEstrelas).toFixed(1)} sub="estrelas por aluno" cor="amber"
          icon={<Star className="w-4 h-4" />} />
        <KpiCard titulo="Semana" valor={negSemana}
          sub={`${Number(variacaoSemana) > 0 ? "+" : ""}${variacaoSemana}% vs anterior`}
          cor={Number(variacaoSemana) > 0 ? "red" : "green"}
          icon={<Zap className="w-4 h-4" />}
          tendencia={Number(variacaoSemana) > 0 ? "down" : "up"}
          sparkline={sparklineNeg} sparkCor="#f59e0b" />
      </div>

      {/* ── INSIGHTS ── */}
      {insights.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4 text-amber-500" /> Alertas automáticos
          </h2>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {insights.map((ins, i) => (
              <div key={i} className={`flex items-start gap-2.5 p-3 rounded-xl text-sm transition-all ${
                ins.tipo === "danger"  ? "bg-red-50 text-red-700"
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

      {/* ════════════════════════════ ABA GERAL ════════════════════════════ */}
      {abaAtiva === "geral" && (
        <div className="space-y-6">

          {/* Painel de indicadores de topo */}
          <div className="grid xl:grid-cols-4 gap-4">

            {/* Gauge clima */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col items-center justify-center">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-purple-500" /> Clima escolar
              </p>
              <GaugeClima score={scoreClima} />
              <p className="text-xs text-gray-400 mt-1 text-center">Índice de saúde comportamental</p>
            </div>

            {/* Meta de positividade ajustável */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-purple-500" /> Meta de positividade
              </p>
              <div className="flex items-end gap-2 mb-2">
                <span className={`text-3xl font-bold ${Number(taxaPositividade) >= metaPositividade ? "text-emerald-600" : "text-orange-500"}`}>
                  {taxaPositividade}%
                </span>
                <span className="text-sm text-gray-400 mb-1">/ meta {metaPositividade}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div className={`h-full rounded-full transition-all duration-700 ${Number(taxaPositividade) >= metaPositividade ? "bg-emerald-400" : "bg-orange-400"}`}
                  style={{ width: `${Math.min(100, (Number(taxaPositividade) / metaPositividade) * 100)}%` }} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 flex-shrink-0">Meta:</span>
                <input type="range" min="30" max="90" value={metaPositividade}
                  onChange={(e) => setMetaPositividade(Number(e.target.value))}
                  className="flex-1 accent-purple-500 cursor-pointer" />
                <span className="text-xs font-bold text-gray-700 w-8 text-right">{metaPositividade}%</span>
              </div>
            </div>

            {/* Resumo rápido */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-500" /> Resumo do período
              </p>
              <div className="space-y-3">
                {[
                  { label: "Turmas monitoradas", valor: turmasRankeadas.length, cor: "text-purple-600", bg: "bg-purple-50" },
                  { label: "Professores ativos",  valor: professoresRanking.length, cor: "text-blue-600",   bg: "bg-blue-50" },
                  { label: "Alunos em destaque",  valor: alunosDestaque.length,     cor: "text-amber-600",  bg: "bg-amber-50" },
                  { label: "Alunos críticos",     valor: alunosCriticos.length,     cor: "text-red-500",    bg: "bg-red-50" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{item.label}</span>
                    <span className={`text-sm font-bold px-2 py-0.5 rounded-lg ${item.cor} ${item.bg}`}>{item.valor}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Proporção visual */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-500" /> Proporção geral
              </p>
              <div className="h-7 rounded-xl overflow-hidden flex mb-3">
                <div className="h-full bg-emerald-400 flex items-center justify-center text-[10px] font-bold text-white transition-all duration-700"
                  style={{ width: `${taxaPositividade}%` }}>
                  {Number(taxaPositividade) > 20 ? `${taxaPositividade}%` : ""}
                </div>
                <div className="h-full bg-red-400 flex items-center justify-center text-[10px] font-bold text-white transition-all duration-700"
                  style={{ width: `${100 - Number(taxaPositividade)}%` }}>
                  {(100 - Number(taxaPositividade)) > 20 ? `${(100 - Number(taxaPositividade)).toFixed(1)}%` : ""}
                </div>
              </div>
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1 text-emerald-600 font-medium"><div className="w-2 h-2 rounded-full bg-emerald-400" /> Positivas: {dados.totalPositivas}</span>
                <span className="flex items-center gap-1 text-red-500 font-medium"><div className="w-2 h-2 rounded-full bg-red-400" /> Negativas: {dados.totalNegativas}</span>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">{dados.totalOcorrencias} total no período</p>
            </div>
          </div>

          {/* Gráfico de evolução */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" /> Evolução de ocorrências
              </h2>
              <span className="text-xs text-gray-400 flex items-center gap-1.5">
                <div className="w-4 h-0.5 bg-dashed bg-purple-300 border-t-2 border-dashed border-purple-300" />
                meta {metaPositividade}% positividade
              </span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={porDiaComVariacao}>
                <defs>
                  <linearGradient id="gradPos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradNeg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
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

          {/* Linha dos 3: Por motivo | Heatmap | Professores */}
          <div className="grid xl:grid-cols-3 gap-6">

            {/* Por motivo — barras horizontais (sem corte) */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" /> Por motivo
              </h2>
              {dados.porMotivo?.length > 0 ? (
                <div className="space-y-2.5">
                  {dados.porMotivo.slice(0, 7).map((m: any, i: number) => {
                    const max = dados.porMotivo[0]?.value || 1;
                    const pct = ((m.value / max) * 100).toFixed(0);
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1 text-xs">
                          <span className="text-gray-700 font-medium truncate max-w-[72%]">{m.name}</span>
                          <span className="font-semibold text-gray-900 ml-2 flex-shrink-0">{m.value}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: CORES_GRAFICO[i % CORES_GRAFICO.length] }} />
                        </div>
                      </div>
                    );
                  })}
                  {dados.porMotivo.length > 7 && (
                    <p className="text-xs text-gray-400 pt-1 text-center">+{dados.porMotivo.length - 7} outros motivos</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">Sem dados</p>
              )}
            </div>

            {/* Heatmap por dia da semana */}
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
                      <span className={`text-xs w-7 font-medium flex-shrink-0 ${isPior ? "text-red-500" : "text-gray-400"}`}>{d.dia}</span>
                      <div className="flex-1 h-5 bg-gray-100 rounded-lg overflow-hidden relative">
                        <div className={`h-full rounded-lg transition-all duration-700 ${isPior ? "bg-red-400" : "bg-purple-300"}`}
                          style={{ width: `${pct}%` }} />
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
                    const inativo = professoresInativos.some((pi: any) => pi.id === p.id);
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-4 text-right">{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium text-gray-800 truncate max-w-[110px]">{p.nome}</span>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {inativo && <span className="text-[9px] bg-amber-100 text-amber-600 px-1 py-px rounded font-semibold">inativo</span>}
                              <span className="text-gray-500">{p.total}</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, background: CORES_GRAFICO[i % CORES_GRAFICO.length] }} />
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

          {/* Ocorrências por disciplina */}
          {porDisciplinaOrdenado.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" /> Ocorrências por disciplina
              </h2>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {porDisciplinaOrdenado.map((d: any, i: number) => {
                  const taxaPos = d.total > 0 ? ((d.positivas / d.total) * 100) : 0;
                  return (
                    <div key={i} className="border border-gray-100 rounded-xl p-4 hover:border-purple-100 hover:shadow-sm transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-900 truncate flex-1">{d.nome}</span>
                        <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{d.total} total</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden flex">
                          <div className="h-full bg-emerald-400 transition-all duration-700" style={{ width: `${taxaPos}%` }} />
                          <div className="h-full bg-red-400 transition-all duration-700" style={{ width: `${100 - taxaPos}%` }} />
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

          {/* Evolução mensal */}
          {evolucaoMensal.length > 1 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" /> Evolução mensal consolidada
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={evolucaoMensal} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }} />
                  <Legend />
                  <Bar dataKey="positivas" name="Positivas" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="negativas" name="Negativas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════ ABA TURMAS ════════════════════════════ */}
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
                const aberta = expandidoTurma === (t.id || t.nome);
                return (
                  <div key={t.id || i} className={`rounded-2xl border transition-all ${
                    isTop ? "border-amber-200 bg-amber-50/40"
                    : isBad ? "border-red-100 bg-red-50/20"
                    : "border-gray-100 bg-white hover:border-gray-200"
                  }`}>
                    <button className="w-full flex items-center gap-4 p-4 text-left"
                      onClick={() => setExpandidoTurma(aberta ? null : (t.id || t.nome))}>
                      <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                        isTop ? "bg-amber-400 text-white"
                        : i === 1 ? "bg-gray-300 text-gray-700"
                        : i === 2 ? "bg-orange-300 text-white"
                        : "bg-gray-100 text-gray-500"
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
                      <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
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
                        {/* Barra visual positivas vs negativas */}
                        <div>
                          <p className="text-xs text-gray-400 mb-1.5">Proporção nesta turma</p>
                          <div className="h-3 rounded-full overflow-hidden flex">
                            <div className="h-full bg-emerald-400 transition-all duration-700" style={{ width: `${t.taxa}%` }} />
                            <div className="h-full bg-red-400 transition-all duration-700" style={{ width: `${100 - Number(t.taxa)}%` }} />
                          </div>
                        </div>
                        {/* Top motivos desta turma (se disponível na API) */}
                        {t.topMotivos?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-400 mb-2">Top motivos nesta turma</p>
                            <div className="space-y-1.5">
                              {t.topMotivos.slice(0, 4).map((m: any, mi: number) => {
                                const maxM = t.topMotivos[0]?.value || 1;
                                return (
                                  <div key={mi}>
                                    <div className="flex justify-between text-xs mb-0.5">
                                      <span className="text-gray-600 truncate max-w-[70%]">{m.name}</span>
                                      <span className="font-semibold">{m.value}</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                      <div className="h-full rounded-full bg-purple-400 transition-all duration-700"
                                        style={{ width: `${(m.value / maxM) * 100}%` }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════ ABA ALUNOS ════════════════════════════ */}
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
              <div className="flex items-center gap-2 flex-wrap">
                {/* Campo de busca */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input type="text" placeholder="Buscar aluno..." value={buscaAluno}
                    onChange={(e) => setBuscaAluno(e.target.value)}
                    className="border border-gray-200 pl-8 pr-3 py-2 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-36" />
                </div>
                <select value={turmaFiltroSemOc} onChange={(e) => setTurmaFiltroSemOc(e.target.value)}
                  className="border border-gray-200 px-3 py-2 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]">
                  <option value="">Todas as turmas</option>
                  {turmas.map((t: any) => (<option key={t.id} value={t.id}>{t.nome}</option>))}
                </select>
              </div>
            </div>

            {(() => {
              const filtrados = alunosSemOcorrencia
                .filter((a) => turmaFiltroSemOc ? a.turma?.id === turmaFiltroSemOc : true)
                .filter((a) => buscaAluno ? a.nome?.toLowerCase().includes(buscaAluno.toLowerCase()) : true)
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
                      {turmaFiltroSemOc || buscaAluno
                        ? "Nenhum resultado para os filtros aplicados"
                        : "Todos os alunos têm pelo menos uma ocorrência negativa"}
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
                        <div key={a.id} className={`flex flex-col gap-2 p-3 rounded-xl border transition-all ${
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
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" /> Alunos que precisam de acompanhamento
              </h2>
              {alunosCriticos.length > 0 && (
                <button onClick={() => exportarCSVAlunos(alunosCriticos)}
                  className="text-xs flex items-center gap-1 text-gray-400 hover:text-gray-700 transition-colors">
                  <Download className="w-3 h-3" /> Exportar lista
                </button>
              )}
            </div>
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
                {alunosCriticos.map((a: any, i: number) => {
                  const nivelRisco = a.negativas > 8 ? "alto" : a.negativas > 5 ? "medio" : "baixo";
                  return (
                    <div key={i} className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                      nivelRisco === "alto" ? "bg-red-50 border-red-200"
                      : nivelRisco === "medio" ? "bg-orange-50/60 border-orange-100"
                      : "bg-red-50/30 border-red-100"
                    }`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        nivelRisco === "alto" ? "bg-red-200 text-red-700" : "bg-red-100 text-red-600"
                      }`}>
                        {a.nome?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{a.nome}</p>
                        <p className="text-xs text-gray-400">{a.turma}</p>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        {nivelRisco === "alto" && (
                          <span className="text-[9px] bg-red-200 text-red-700 px-1.5 py-0.5 rounded-full font-bold tracking-wide">CRÍTICO</span>
                        )}
                        <div>
                          <p className="text-sm font-bold text-red-600">{a.negativas} neg.</p>
                          <BarraEstrelas valor={a.estrelas ?? 0} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════ ABA ANÁLISE ════════════════════════════ */}
      {abaAtiva === "analise" && (
        <div className="space-y-6">

          {/* Radar de turmas */}
          {radarData.length >= 3 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-600" /> Radar comparativo de turmas
              </h2>
              <p className="text-xs text-gray-400 mb-4">Comparação multidimensional entre turmas</p>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#f0f0f0" />
                  <PolarAngleAxis dataKey="turma" tick={{ fontSize: 11, fill: "#6b7280" }} />
                  <PolarRadiusAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <Radar name="Positivas" dataKey="positivas" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
                  <Radar name="Negativas" dataKey="negativas" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} strokeWidth={2} />
                  <Legend />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tabela intensidade por disciplina */}
          {porDisciplinaOrdenado.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" /> Intensidade por disciplina
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-gray-400 font-medium pb-3 pr-4">Disciplina</th>
                      <th className="text-center text-emerald-600 font-medium pb-3 px-3">Positivas</th>
                      <th className="text-center text-red-500 font-medium pb-3 px-3">Negativas</th>
                      <th className="text-center text-gray-400 font-medium pb-3 px-3">Total</th>
                      <th className="text-center text-gray-400 font-medium pb-3 px-3 w-36">Equilíbrio</th>
                      <th className="text-center text-gray-400 font-medium pb-3 px-3">% pos.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {porDisciplinaOrdenado.map((d: any, i: number) => {
                      const taxaPos = d.total > 0 ? (d.positivas / d.total) * 100 : 0;
                      const intensidade = Math.min(1, d.total / (porDisciplinaOrdenado[0]?.total || 1));
                      return (
                        <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="py-2.5 pr-4 font-semibold text-gray-900">{d.nome}</td>
                          <td className="text-center py-2.5 px-3 text-emerald-600 font-semibold">{d.positivas}</td>
                          <td className="text-center py-2.5 px-3 text-red-500 font-semibold">{d.negativas}</td>
                          <td className="text-center py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-white text-[10px] font-bold"
                              style={{ background: `rgba(99,102,241,${0.25 + intensidade * 0.75})` }}>
                              {d.total}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                              <div className="h-full bg-emerald-400 transition-all duration-700" style={{ width: `${taxaPos}%` }} />
                              <div className="h-full bg-red-400 transition-all duration-700" style={{ width: `${100 - taxaPos}%` }} />
                            </div>
                          </td>
                          <td className="text-center py-2.5 px-3">
                            <span className={`font-bold ${taxaPos >= 50 ? "text-emerald-600" : "text-red-500"}`}>
                              {taxaPos.toFixed(0)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Professores + Distribuição de estrelas */}
          <div className="grid xl:grid-cols-2 gap-6">

            {/* Ranking completo professores com taxa pos/neg */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" /> Professores — análise detalhada
              </h2>
              {todosProfs.length > 0 ? (
                <div className="space-y-2">
                  {todosProfs.slice(0, 12).map((p: any, i: number) => {
                    const taxaPos = p.total > 0 ? Math.round((p.positivas || 0) / p.total * 100) : 0;
                    return (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                        <span className="text-xs text-gray-300 w-5 text-right flex-shrink-0">{i + 1}</span>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: CORES_GRAFICO[i % CORES_GRAFICO.length] }}>
                          {p.nome?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium text-gray-800 truncate max-w-[130px]">{p.nome}</span>
                            <span className="text-gray-400 flex-shrink-0">{p.total}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                            <div className="h-full bg-emerald-400 transition-all duration-700" style={{ width: `${taxaPos}%` }} />
                            <div className="h-full bg-red-300 transition-all duration-700" style={{ width: `${100 - taxaPos}%` }} />
                          </div>
                        </div>
                        <span className={`text-xs font-bold flex-shrink-0 w-8 text-right ${taxaPos >= 50 ? "text-emerald-600" : "text-red-500"}`}>
                          {taxaPos}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">Sem dados</p>
              )}
            </div>

            {/* Distribuição de estrelas */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" /> Distribuição de estrelas dos alunos
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={distData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="estrelas" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
                    formatter={(v: any) => [v, "Alunos"]} />
                  <Bar dataKey="alunos" name="Alunos" radius={[4, 4, 0, 0]}>
                    {distData.map((entry, index) => (
                      <Cell key={index} fill={entry.estrelas >= 7 ? "#f59e0b" : entry.estrelas >= 4 ? "#6366f1" : "#ef4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-5 mt-2">
                {[
                  { cor: "bg-red-400", label: "0–3 ⭐ Atenção" },
                  { cor: "bg-purple-400", label: "4–6 ⭐ Regular" },
                  { cor: "bg-amber-400", label: "7–10 ⭐ Destaque" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-1 text-xs text-gray-500">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.cor}`} />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════ ABA SEMANA ════════════════════════════ */}
      {abaAtiva === "semana" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "variação negativos", valor: `${Number(variacaoSemana) > 0 ? "+" : ""}${variacaoSemana}%`, cor: Number(variacaoSemana) > 0 ? "text-red-500" : "text-emerald-600", sub: "vs semana anterior" },
              { label: "negativos esta semana",  valor: negSemana,          cor: "text-red-500",    sub: "" },
              { label: "positivos esta semana",  valor: posSemana,          cor: "text-emerald-600", sub: "" },
              { label: "total esta semana",      valor: negSemana + posSemana, cor: "text-gray-900", sub: "" },
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

          {/* Termômetro diário */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" /> Termômetro — qualidade do dia
            </h2>
            <div className="grid grid-cols-7 gap-2">
              {ultimaSemana.map((d: any, i: number) => {
                const total = (d.positivas || 0) + (d.negativas || 0);
                const taxa = total > 0 ? (d.positivas / total) * 100 : 0;
                const nivel = taxa >= 70 ? "great" : taxa >= 40 ? "ok" : "bad";
                return (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <div className={`w-full aspect-square rounded-xl flex items-center justify-center text-lg transition-all ${
                      nivel === "great" ? "bg-emerald-100" : nivel === "ok" ? "bg-amber-50" : "bg-red-50"
                    }`}>
                      {nivel === "great" ? "😊" : nivel === "ok" ? "😐" : "😟"}
                    </div>
                    <span className="text-[9px] text-gray-400 text-center truncate w-full">{d.data?.slice(5)}</span>
                    <span className={`text-[10px] font-bold ${nivel === "great" ? "text-emerald-600" : nivel === "ok" ? "text-amber-500" : "text-red-500"}`}>
                      {taxa.toFixed(0)}%
                    </span>
                    <span className="text-[9px] text-gray-300">{total} reg.</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// COMPONENTE KpiCard (com sparkline integrada)
// ══════════════════════════════════════════════════════════════════════════
function KpiCard({
  titulo, valor, sub, cor, icon, tendencia, sparkline, sparkCor,
}: {
  titulo: string; valor: any; sub: string; cor: string;
  icon: React.ReactNode; tendencia?: "up" | "down";
  sparkline?: number[]; sparkCor?: string;
}) {
  const corMap: Record<string, string> = {
    blue:   "bg-blue-50 text-blue-600",
    green:  "bg-emerald-50 text-emerald-600",
    red:    "bg-red-50 text-red-500",
    amber:  "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 rounded-xl ${corMap[cor] ?? corMap.blue}`}>{icon}</div>
        {tendencia && (
          tendencia === "up"
            ? <ArrowUpRight className="w-4 h-4 text-emerald-500" />
            : <ArrowDownRight className="w-4 h-4 text-red-400" />
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-2xl font-bold text-gray-900 leading-none">{valor}</p>
          <p className="text-xs text-gray-400 mt-1">{titulo}</p>
          <p className="text-xs text-gray-300 mt-0.5 leading-tight">{sub}</p>
        </div>
        {sparkline && sparkline.length > 1 && (
          <div className="flex-shrink-0 mb-1">
            <Sparkline data={sparkline} cor={sparkCor} />
          </div>
        )}
      </div>
    </div>
  );
}