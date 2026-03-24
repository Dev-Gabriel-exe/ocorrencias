"use client";
// src/app/professor/perfil/page.tsx
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Loader2, Save, UserCircle, Info } from "lucide-react";
import Image from "next/image";

export default function PerfilPage() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [sucesso, setSucesso] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", bio: "",
    disciplinasTexto: "",
    nivelEnsino: "",
  });

  useEffect(() => {
    fetch("/api/perfil").then((r) => r.json()).then((data) => {
      setForm({
        name: data.name || "",
        phone: data.phone || "",
        bio: data.bio || "",
        disciplinasTexto: data.disciplinasNomes || "",
        nivelEnsino: data.nivelEnsino || "",
      });
      setCarregando(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/perfil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setSucesso(true);
      await update({ name: form.name });
      setTimeout(() => setSucesso(false), 3000);
    }
    setLoading(false);
  }

  if (carregando) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie suas informações e disciplinas</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-5">
          {session?.user?.image ? (
            <Image src={session.user.image} alt="" width={72} height={72} className="rounded-full ring-4 ring-blue-100" />
          ) : (
            <div className="w-[72px] h-[72px] bg-blue-100 rounded-full flex items-center justify-center ring-4 ring-blue-50">
              <UserCircle className="w-10 h-10 text-blue-400" />
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{session?.user?.name}</p>
            <p className="text-sm text-gray-400">{session?.user?.email}</p>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium mt-1 inline-block">
              Professor
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Seu nome"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="(86) 99999-9999"
              />
            </div>
          </div>

          {/* Nível de ensino */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nível de ensino que você leciona
            </label>
            <div className="flex gap-3">
              {[
                { value: "FUND_I", label: "Fundamental I", sub: "1º ao 5º ano" },
                { value: "FUND_II_MEDIO", label: "Fund. II + Médio", sub: "6º ano ao Ensino Médio" },
              ].map((op) => (
                <button
                  key={op.value}
                  type="button"
                  onClick={() => setForm({ ...form, nivelEnsino: op.value })}
                  className={`flex-1 px-4 py-3 rounded-xl border-2 text-left transition-colors ${
                    form.nivelEnsino === op.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className={`text-sm font-medium ${form.nivelEnsino === op.value ? "text-blue-700" : "text-gray-700"}`}>
                    {op.label}
                  </p>
                  <p className={`text-xs mt-0.5 ${form.nivelEnsino === op.value ? "text-blue-500" : "text-gray-400"}`}>
                    {op.sub}
                  </p>
                </button>
              ))}
            </div>
            {!form.nivelEnsino && (
              <p className="text-xs text-amber-500 mt-1.5 flex items-center gap-1">
                ⚠ Defina seu nível para aparecer nas turmas corretas
              </p>
            )}
          </div>

          {/* Disciplinas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Disciplinas que você leciona
            </label>
            <input
              value={form.disciplinasTexto}
              onChange={(e) => setForm({ ...form, disciplinasTexto: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Matemática, Física, Química"
            />
            <div className="flex items-start gap-1.5 mt-1.5">
              <Info className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-400">
                Separe com vírgula. Você só verá turmas com suas disciplinas vinculadas.
              </p>
            </div>
            {form.disciplinasTexto && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.disciplinasTexto.split(",").map((d) => d.trim()).filter(Boolean).map((d) => (
                  <span key={d} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    {d}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Uma breve descrição sobre você..."
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar
            </button>
            {sucesso && <span className="text-sm text-green-600 font-medium">✓ Perfil atualizado!</span>}
          </div>
        </form>
      </div>
    </div>
  );
}