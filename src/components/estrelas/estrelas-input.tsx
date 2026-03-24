"use client";
// src/components/estrelas/estrelas-input.tsx
import { Star } from "lucide-react";
import { useState } from "react";

interface Props {
  value: number;          // 0-10
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

export function EstrelasInput({ value, onChange, readonly = false, size = "md" }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star === value ? star - 1 : star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(null)}
          className={`${readonly ? "cursor-default" : "cursor-pointer"} transition-transform ${
            !readonly && "hover:scale-110 active:scale-95"
          }`}
          title={readonly ? `${value}/10 estrelas` : `${star} estrela${star > 1 ? "s" : ""}`}
        >
          <Star
            className={`${sizes[size]} transition-colors ${
              star <= display
                ? "fill-yellow-400 text-yellow-400"
                : "fill-transparent text-gray-300"
            }`}
          />
        </button>
      ))}
      <span className="ml-2 text-sm font-semibold text-gray-700 tabular-nums">
        {value}<span className="text-gray-400 font-normal">/10</span>
      </span>
    </div>
  );
}

// ── Botões + / - para ajuste rápido ──────────────────────────────────────────

interface EstrelasControlProps {
  alunoId: string;
  value: number;
  onUpdate: (novoValor: number) => void;
}

export function EstrelasControl({ alunoId, value, onUpdate }: EstrelasControlProps) {
  const [loading, setLoading] = useState(false);

  async function ajustar(delta: number) {
    const novo = Math.min(10, Math.max(0, value + delta));
    if (novo === value) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/estrelas/${alunoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta }),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdate(data.estrelas);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => ajustar(-1)}
        disabled={loading || value <= 0}
        className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-red-50 hover:border-red-300 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-bold"
      >
        −
      </button>

      <EstrelasInput value={value} readonly size="sm" />

      <button
        onClick={() => ajustar(+1)}
        disabled={loading || value >= 10}
        className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-green-50 hover:border-green-300 hover:text-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-bold"
      >
        +
      </button>
    </div>
  );
}
