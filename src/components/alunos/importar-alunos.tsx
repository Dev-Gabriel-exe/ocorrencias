//src/components/alunos/importar-alunos.tsx
"use client";
import { useState } from "react";
import { Loader2, Upload, X, CheckCircle } from "lucide-react";

interface AlunoParseado {
  nome: string;
  matricula: string;
}

interface Props {
  turmaId: string;
  onImportado?: () => void;
}

function toTitleCase(str: string): string {
  const minusculas = ["de", "da", "do", "das", "dos", "e", "a", "o", "em", "por", "com", "para"];
  return str
    .toLowerCase()
    .split(" ")
    .map((w, i) => (i === 0 || !minusculas.includes(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function parseLista(texto: string): AlunoParseado[] {
  return texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((linha) => {
      const partes = linha.split(/\s+/);
      // Primeiro token é só dígitos → é matrícula
      if (partes.length >= 2 && /^\d+$/.test(partes[0])) {
        return {
          matricula: partes[0],
          nome: toTitleCase(partes.slice(1).join(" ")),
        };
      }
      // Formato "Nome, matrícula"
      const comVirgula = linha.match(/^(.+),\s*(\d+)$/);
      if (comVirgula) {
        return { nome: comVirgula[1].trim(), matricula: comVirgula[2].trim() };
      }
      // Só nome
      return { nome: toTitleCase(linha), matricula: "" };
    })
    .filter((a) => a.nome)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")); // ordena alfabeticamente
}

export function ImportarAlunos({ turmaId, onImportado }: Props) {
  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState("");
  const [preview, setPreview] = useState<AlunoParseado[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{ importados: number; erros: number } | null>(null);
  const [turmaSelecionada, setTurmaSelecionada] = useState(turmaId);
  const [turmas, setTurmas] = useState<{ id: string; nome: string }[]>([]);

  async function abrirModal() {
    setOpen(true);
    const res = await fetch("/api/turmas");
    if (res.ok) setTurmas(await res.json());
  }

  function handleTexto(t: string) {
    setTexto(t);
    setResultado(null);
    setPreview(t.trim() ? parseLista(t) : []);
  }

  async function handleImportar() {
    if (!turmaSelecionada) return alert("Selecione uma turma.");
    if (preview.length === 0) return;
    setLoading(true);

    let importados = 0;
    let erros = 0;

    for (const aluno of preview) {
      const res = await fetch("/api/alunos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: aluno.nome,
          matricula: aluno.matricula || `M${Date.now()}${Math.random().toString(36).slice(2, 5)}`,
          turmaId: turmaSelecionada,
        }),
      });
      if (res.ok) importados++;
      else erros++;
    }

    setResultado({ importados, erros });
    setLoading(false);
    if (importados > 0) onImportado?.();
  }

  function fechar() {
    setOpen(false);
    setTexto("");
    setPreview([]);
    setResultado(null);
  }

  return (
    <>
      <button
        onClick={abrirModal}
        className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <Upload className="w-4 h-4" />
        Importar lista
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

            <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="font-semibold text-gray-900">Importar lista de alunos</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Aceita: <code className="bg-gray-100 px-1 rounded">180053 ALICE LIMA DE MORAIS</code>
                </p>
              </div>
              <button onClick={fechar} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Turma destino <span className="text-red-500">*</span>
                </label>
                <select
                  value={turmaSelecionada}
                  onChange={(e) => setTurmaSelecionada(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Selecione a turma...</option>
                  {turmas.map((t) => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Cole a lista aqui</label>
                <textarea
                  value={texto}
                  onChange={(e) => handleTexto(e.target.value)}
                  rows={8}
                  placeholder={"180053 ALICE LIMA DE MORAIS\n220108 ANA ELISABETH CARVALHO SANTOS MONTE\n170092 EDUARDO FRANCISCO GOMES PAULA"}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-mono"
                />
              </div>

              {preview.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-gray-700">Preview — ordem alfabética</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      {preview.length} alunos
                    </span>
                  </div>
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 grid grid-cols-12 text-xs font-medium text-gray-400 uppercase tracking-wide">
                      <span className="col-span-7">Nome</span>
                      <span className="col-span-5">Matrícula</span>
                    </div>
                    <div className="divide-y divide-gray-50 max-h-56 overflow-y-auto">
                      {preview.map((p, i) => (
                        <div key={i} className="px-4 py-2.5 grid grid-cols-12 items-center">
                          <span className="col-span-7 text-sm text-gray-900">{p.nome}</span>
                          <span className="col-span-5 text-xs text-gray-500 font-mono">
                            {p.matricula || <span className="text-gray-300">gerada automaticamente</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {resultado && (
                <div className={`rounded-xl p-4 flex items-center gap-3 ${resultado.erros === 0 ? "bg-green-50 border border-green-100" : "bg-amber-50 border border-amber-100"}`}>
                  <CheckCircle className={`w-5 h-5 flex-shrink-0 ${resultado.erros === 0 ? "text-green-500" : "text-amber-500"}`} />
                  <p className="text-sm font-medium text-gray-900">
                    {resultado.importados} aluno{resultado.importados !== 1 ? "s" : ""} importado{resultado.importados !== 1 ? "s" : ""}
                    {resultado.erros > 0 && ` · ${resultado.erros} ignorado${resultado.erros !== 1 ? "s" : ""} (matrícula duplicada)`}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-100 flex-shrink-0">
              <button onClick={fechar}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                {resultado ? "Fechar" : "Cancelar"}
              </button>
              {!resultado && (
                <button
                  onClick={handleImportar}
                  disabled={loading || preview.length === 0 || !turmaSelecionada}
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {preview.length > 0 ? `Importar ${preview.length} alunos` : "Importar"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}