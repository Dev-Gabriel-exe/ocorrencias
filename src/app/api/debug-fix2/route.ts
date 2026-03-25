import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Apaga accounts E usuários professor (não secretaria)
  const deletedAccounts = await prisma.account.deleteMany({});
  const deletedProfessores = await prisma.user.deleteMany({
    where: { role: "PROFESSOR" },
  });
  return NextResponse.json({
    deletedAccounts: deletedAccounts.count,
    deletedProfessores: deletedProfessores.count,
  });
}