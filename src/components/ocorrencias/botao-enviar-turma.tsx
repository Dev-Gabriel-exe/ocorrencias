"use client";
// src/components/ocorrencias/botao-enviar-turma.tsx
import { useState } from "react";
import { Send, Loader2, CheckCircle } from "lucide-react";

interface Props {
  turmaId: string;
  turmaNome: string;
  professorNome: string;
  professorDisciplina?: string | null;
}

export function BotaoEnviarTurma({
  turmaId,
  turmaNome,
  professorNome,
  professorDisciplina,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");

  async function handleEnviar() {
    if (!confirm(`Enviar todas as ocorrências de hoje da turma ${turmaNome} por email?`)) return;
    setLoading(true);
    setErro("");

    try {
      const res = await fetch("/api/email/ocorrencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turmaId, tipo: "TURMA" }),
      });

      const data = await res.json();

      if (res.ok) {
        setSucesso(true);
        setTimeout(() => setSucesso(false), 3000);
      } else {
        setErro(data.error || "Erro ao enviar email.");
      }
    } catch {
      setErro("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleEnviar}
        disabled={loading || sucesso}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
          sucesso
            ? "bg-green-100 text-green-700"
            : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        }`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : sucesso ? (
          <CheckCircle className="w-4 h-4" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        {sucesso ? "Email enviado!" : "Enviar ocorrências da turma"}
      </button>
      {erro && <p className="text-xs text-red-500">{erro}</p>}
    </div>
  );
}
