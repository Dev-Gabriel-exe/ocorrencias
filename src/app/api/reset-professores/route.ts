import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await prisma.account.deleteMany({
    where: { user: { role: "PROFESSOR" } },
  });
  await prisma.user.deleteMany({
    where: { role: "PROFESSOR" },
  });
  return NextResponse.json({ ok: true });
}