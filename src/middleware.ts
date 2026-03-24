// src/middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;
  const role = session?.user?.role;

  const isProfessorRoute = nextUrl.pathname.startsWith("/professor");
  const isSecretariaRoute = nextUrl.pathname.startsWith("/secretaria");
  const isLoginPage = nextUrl.pathname === "/login";

  // Redireciona usuário logado que tenta acessar login
  if (isLoggedIn && isLoginPage) {
    if (role === "PROFESSOR") {
      return NextResponse.redirect(new URL("/professor/dashboard", nextUrl));
    }
    return NextResponse.redirect(new URL("/secretaria/dashboard", nextUrl));
  }

  // Redireciona usuário não logado tentando acessar rotas protegidas
  if (!isLoggedIn && (isProfessorRoute || isSecretariaRoute)) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Secretaria tentando acessar rota de professor
  if (isLoggedIn && isProfessorRoute && role !== "PROFESSOR") {
    return NextResponse.redirect(new URL("/secretaria/dashboard", nextUrl));
  }

  // Professor tentando acessar rota de secretaria
  if (isLoggedIn && isSecretariaRoute && role === "PROFESSOR") {
    return NextResponse.redirect(new URL("/professor/dashboard", nextUrl));
  }

  // Secretaria Fund. I tentando acessar turmas de Fund. II / Médio
  // (Validação mais granular é feita nas API routes)

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/professor/:path*",
    "/secretaria/:path*",
    "/login",
    "/api/turmas/:path*",
    "/api/alunos/:path*",
    "/api/ocorrencias/:path*",
    "/api/estrelas/:path*",
    "/api/motivos/:path*",
    "/api/email/:path*",
    "/api/lembretes/:path*",
    "/api/relatorios/:path*",
  ],
};
