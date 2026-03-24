"use client";
// src/app/(auth)/login/page.tsx
import { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"professor" | "secretaria">("professor");
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Particle canvas effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: {
      x: number; y: number; vx: number; vy: number;
      size: number; alpha: number; color: string;
    }[] = [];

    const colors = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#e0e7ff"];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let animId: number;
    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      });

      // Draw connections
      ctx.globalAlpha = 1;
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = "#6366f1";
            ctx.globalAlpha = (1 - dist / 100) * 0.15;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animId = requestAnimationFrame(animate);
    }
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  async function handleGoogle() {
    setLoading(true);
    await signIn("google", { callbackUrl: "/professor/dashboard", redirect: true });
  }

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Email ou senha inválidos.");
      setLoading(false);
    } else {
      router.push("/secretaria/dashboard");
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          background: #050714;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Outfit', sans-serif;
          overflow: hidden;
          position: relative;
        }

        .bg-canvas {
          position: fixed;
          inset: 0;
          z-index: 0;
        }

        .bg-orb-1 {
          position: fixed;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%);
          top: -200px;
          right: -200px;
          animation: orb-drift-1 20s ease-in-out infinite;
          z-index: 0;
        }

        .bg-orb-2 {
          position: fixed;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%);
          bottom: -150px;
          left: -150px;
          animation: orb-drift-2 25s ease-in-out infinite;
          z-index: 0;
        }

        .bg-orb-3 {
          position: fixed;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%);
          top: 50%;
          left: 30%;
          animation: orb-drift-3 18s ease-in-out infinite;
          z-index: 0;
        }

        @keyframes orb-drift-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-80px, 60px) scale(1.1); }
          66% { transform: translate(40px, -40px) scale(0.95); }
        }

        @keyframes orb-drift-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(60px, -80px) scale(1.15); }
          66% { transform: translate(-30px, 50px) scale(0.9); }
        }

        @keyframes orb-drift-3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
          50% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
        }

        .main-wrapper {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 460px;
          padding: 24px;
          animation: fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }

        @keyframes fade-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .logo-section {
          text-align: center;
          margin-bottom: 36px;
          animation: fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
          opacity: 0;
        }

        .logo-ring {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 72px;
          height: 72px;
          border-radius: 20px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          box-shadow: 0 0 40px rgba(99,102,241,0.5), 0 0 80px rgba(99,102,241,0.2);
          margin-bottom: 20px;
          position: relative;
          animation: logo-pulse 3s ease-in-out infinite;
        }

        @keyframes logo-pulse {
          0%, 100% { box-shadow: 0 0 40px rgba(99,102,241,0.5), 0 0 80px rgba(99,102,241,0.2); }
          50% { box-shadow: 0 0 60px rgba(99,102,241,0.7), 0 0 120px rgba(99,102,241,0.3); }
        }

        .logo-icon {
          width: 36px;
          height: 36px;
          fill: white;
        }

        .logo-title {
          font-size: 24px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.5px;
          line-height: 1.2;
        }

        .logo-sub {
          font-size: 13px;
          color: rgba(167,139,250,0.8);
          margin-top: 6px;
          font-weight: 400;
          letter-spacing: 0.5px;
          font-family: 'Space Mono', monospace;
        }

        .card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          backdrop-filter: blur(20px);
          overflow: hidden;
          box-shadow: 0 25px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06);
          animation: fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
          opacity: 0;
        }

        .tabs {
          display: flex;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          position: relative;
        }

        .tab-btn {
          flex: 1;
          padding: 18px 16px;
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.3px;
          cursor: pointer;
          border: none;
          background: transparent;
          color: rgba(255,255,255,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: color 0.3s ease;
          position: relative;
        }

        .tab-btn.active {
          color: #a78bfa;
        }

        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 20%;
          right: 20%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #8b5cf6, transparent);
          border-radius: 2px;
          animation: tab-line-in 0.3s ease forwards;
        }

        @keyframes tab-line-in {
          from { opacity: 0; transform: scaleX(0); }
          to { opacity: 1; transform: scaleX(1); }
        }

        .tab-icon {
          width: 16px;
          height: 16px;
        }

        .card-body {
          padding: 32px;
        }

        .tab-content {
          animation: tab-appear 0.3s ease forwards;
        }

        @keyframes tab-appear {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Professor tab */
        .google-label {
          font-size: 13px;
          color: rgba(255,255,255,0.45);
          text-align: center;
          margin-bottom: 24px;
          line-height: 1.6;
        }

        .google-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 14px 20px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 14px;
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: 0.2px;
          position: relative;
          overflow: hidden;
        }

        .google-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2));
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .google-btn:hover::before { opacity: 1; }
        .google-btn:hover {
          border-color: rgba(139,92,246,0.5);
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(99,102,241,0.2);
        }

        .google-btn:active { transform: translateY(0); }
        .google-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        /* Secretaria form */
        .field {
          margin-bottom: 16px;
        }

        .field-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: rgba(167,139,250,0.8);
          margin-bottom: 8px;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }

        .field-input-wrap {
          position: relative;
        }

        .field-input {
          width: 100%;
          padding: 13px 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          outline: none;
          transition: all 0.2s ease;
        }

        .field-input::placeholder { color: rgba(255,255,255,0.2); }

        .field-input:focus {
          border-color: rgba(139,92,246,0.6);
          background: rgba(99,102,241,0.06);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.1);
        }

        .field-input.has-icon { padding-right: 44px; }

        .field-eye {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255,255,255,0.3);
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }

        .field-eye:hover { color: rgba(167,139,250,0.8); }

        .error-box {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 13px;
          color: #fca5a5;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          animation: shake 0.4s ease;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }

        .submit-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: none;
          border-radius: 14px;
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: 0.3px;
          position: relative;
          overflow: hidden;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 20px;
        }

        .submit-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .submit-btn:hover::before { opacity: 1; }
        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(99,102,241,0.4);
        }
        .submit-btn:active { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

        .hint-box {
          margin-top: 20px;
          background: rgba(99,102,241,0.08);
          border: 1px solid rgba(99,102,241,0.15);
          border-radius: 12px;
          padding: 14px 16px;
        }

        .hint-title {
          font-size: 11px;
          font-weight: 700;
          color: rgba(167,139,250,0.7);
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 8px;
        }

        .hint-row {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: rgba(167,139,250,0.55);
          line-height: 1.8;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 20px 0;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.06);
        }

        .divider-text {
          font-size: 11px;
          color: rgba(255,255,255,0.2);
          font-family: 'Space Mono', monospace;
          letter-spacing: 1px;
        }

        .bottom-text {
          text-align: center;
          margin-top: 24px;
          font-size: 12px;
          color: rgba(255,255,255,0.2);
          font-family: 'Space Mono', monospace;
          animation: fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards;
          opacity: 0;
        }

        .shine-line {
          position: absolute;
          top: 0;
          left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent);
          animation: shine 4s ease-in-out infinite 2s;
          pointer-events: none;
        }

        @keyframes shine {
          0% { left: -100%; }
          50%, 100% { left: 150%; }
        }
      `}</style>

      <div className="login-root">
        <canvas ref={canvasRef} className="bg-canvas" />
        <div className="bg-orb-1" />
        <div className="bg-orb-2" />
        <div className="bg-orb-3" />

        {mounted && (
          <div className="main-wrapper">
            {/* Logo */}
            <div className="logo-section">
              <div className="logo-ring">
                <svg className="logo-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </div>
              <div className="logo-title">Sistema de Ocorrências</div>
              <div className="logo-sub">// gestão escolar · 2026</div>
            </div>

            {/* Card */}
            <div className="card">
              <div className="shine-line" />

              {/* Tabs */}
              <div className="tabs">
                <button
                  className={`tab-btn ${tab === "professor" ? "active" : ""}`}
                  onClick={() => { setTab("professor"); setError(""); }}
                >
                  <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
                  </svg>
                  Professor
                </button>
                <button
                  className={`tab-btn ${tab === "secretaria" ? "active" : ""}`}
                  onClick={() => { setTab("secretaria"); setError(""); }}
                >
                  <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                  </svg>
                  Secretaria
                </button>
              </div>

              <div className="card-body">
                {/* Professor */}
                {tab === "professor" && (
                  <div className="tab-content">
                    <p className="google-label">
                      Professores entram com a conta<br />
                      <span style={{ color: "rgba(167,139,250,0.9)", fontWeight: 600 }}>Google institucional</span>
                    </p>

                    <button className="google-btn" onClick={handleGoogle} disabled={loading}>
                      {loading ? (
                        <Loader2 style={{ width: 20, height: 20, animation: "spin 1s linear infinite" }} />
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      )}
                      Continuar com Google
                    </button>

                    <div className="divider">
                      <div className="divider-line" />
                      <span className="divider-text">acesso seguro</span>
                      <div className="divider-line" />
                    </div>

                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", lineHeight: 1.6 }}>
                        Ao entrar, você concorda com os<br />
                        <span style={{ color: "rgba(167,139,250,0.5)" }}>termos de uso da instituição</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Secretaria */}
                {tab === "secretaria" && (
                  <form className="tab-content" onSubmit={handleCredentials}>
                    <div className="field">
                      <label className="field-label">Email</label>
                      <input
                        type="email"
                        className="field-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="secretaria@escola.com"
                        required
                        autoComplete="email"
                      />
                    </div>

                    <div className="field">
                      <label className="field-label">Senha</label>
                      <div className="field-input-wrap">
                        <input
                          type={showPassword ? "text" : "password"}
                          className="field-input has-icon"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••"
                          required
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          className="field-eye"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword
                            ? <EyeOff style={{ width: 16, height: 16 }} />
                            : <Eye style={{ width: 16, height: 16 }} />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <div className="error-box">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        {error}
                      </div>
                    )}

                    <button type="submit" className="submit-btn" disabled={loading}>
                      {loading && <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />}
                      {loading ? "Autenticando..." : "Acessar Sistema"}
                    </button>

                    <div className="hint-box">
                      <div className="hint-title">Credenciais de acesso</div>
                      <div className="hint-row">secretaria@escola.com · SecGeral@2026</div>
                      <div className="hint-row">fund1@escola.com · Fund1@2026</div>
                      <div className="hint-row">fund2@escola.com · Fund2@2026</div>
                    </div>
                  </form>
                )}
              </div>
            </div>

            <div className="bottom-text">
              Sistema de Ocorrências Escolares · v2.0 · {new Date().getFullYear()}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}