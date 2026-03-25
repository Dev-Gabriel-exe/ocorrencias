import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Mostra os vínculos do Google
    const accounts = await prisma.account.findMany({
      include: { user: { select: { email: true, role: true } } },
    });
    return NextResponse.json({ accounts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}

export async function DELETE() {
  try {
    // Apaga todos os vínculos OAuth (Account table)
    const deleted = await prisma.account.deleteMany({});
    return NextResponse.json({ deleted: deleted.count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}