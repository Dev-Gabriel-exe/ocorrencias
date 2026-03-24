import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: "secretaria@escola.com" },
      select: { password: true, role: true },
    });

    if (!user?.password) return NextResponse.json({ error: "user not found or no password" });

    const match = await bcrypt.compare("SecGeral@2026", user.password);

    return NextResponse.json({
      hasPassword: true,
      passwordMatch: match,
      role: user.role,
      hashPreview: user.password.substring(0, 10) + "...",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}