import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const count = await prisma.user.count();
    const users = await prisma.user.findMany({
      select: { email: true, role: true, password: true },
    });
    return NextResponse.json({
      ok: true,
      count,
      users: users.map(u => ({
        email: u.email,
        role: u.role,
        hasPassword: !!u.password,
      })),
      dbUrl: process.env.DATABASE_URL?.substring(0, 30) + "...",
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
