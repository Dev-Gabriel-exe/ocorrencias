// src/middleware.ts

import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  
  const isLoggedIn = !!token;
  const role = token?.role as string | undefined;

  const { nextUrl } = req;

  const isProfessorRoute = nextUrl.pathname.startsWith("/professor");
  const isSecretariaRoute = nextUrl.pathname.startsWith("/secretaria");
  const isLoginPage = nextUrl.pathname === "/login";

  // logged user accessing login
  if (isLoggedIn && isLoginPage) {
    if (role === "PROFESSOR") {
      return NextResponse.redirect(new URL("/professor/dashboard", nextUrl));
    }
    return NextResponse.redirect(new URL("/secretaria/dashboard", nextUrl));
  }

  // not logged user accessing protected routes
  if (!isLoggedIn && (isProfessorRoute || isSecretariaRoute)) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // secretaria accessing professor route
  if (isLoggedIn && isProfessorRoute && role !== "PROFESSOR") {
    return NextResponse.redirect(new URL("/secretaria/dashboard", nextUrl));
  }

  // professor accessing secretaria route
  if (isLoggedIn && isSecretariaRoute && role === "PROFESSOR") {
    return NextResponse.redirect(new URL("/professor/dashboard", nextUrl));
  }

  return NextResponse.next();
}

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