// prisma/seed.ts
import { PrismaClient, Role, Nivel } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  await prisma.configuracaoEscola.upsert({
    where: { id: "escola-config" },
    update: {},
    create: {
      id: "escola-config",
      nomeEscola: "Escola Estadual Exemplo",
      endereco: "Rua das Flores, 123 — Teresina, PI",
      telefone: "(86) 3333-4444",
      emailContato: "secretaria@escola.com",
    },
  });

  const secretarias = [
    { name: "Secretaria Geral", email: "secretaria@escola.com", password: "SecGeral@2026", role: Role.SECRETARIA_GERAL },
    { name: "Secretaria Fund. I", email: "fund1@escola.com", password: "Fund1@2026", role: Role.SECRETARIA_FUND1 },
    { name: "Secretaria Fund. II", email: "fund2@escola.com", password: "Fund2@2026", role: Role.SECRETARIA_FUND2 },
  ];

  for (const s of secretarias) {
    const hash = await bcrypt.hash(s.password, 12);
    await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: { name: s.name, email: s.email, password: hash, role: s.role, emailVerified: new Date() },
    });
    console.log(`  ✅ ${s.email}`);
  }

  const disciplinasBase = [
    "Matemática","Português","Ciências","História","Geografia",
    "Educação Física","Artes","Inglês","Física","Química",
    "Biologia","Filosofia","Sociologia","Literatura","Redação","Programação","Religião",
  ];

  const discMap: Record<string, string> = {};

for (const nome of disciplinasBase) {
  const d = await prisma.disciplina.upsert({
    where: {
      nome_criadaPor: {
        nome,
        criadaPor: Role.SECRETARIA_GERAL,
      },
    },
    update: {},
    create: {
      nome,
      criadaPor: Role.SECRETARIA_GERAL,
    },
  });

  discMap[nome] = d.id;
}

console.log(`  ✅ ${disciplinasBase.length} disciplinas`);
  const turmasData = [
    { nome: "1º Ano A", serie: "1º Ano", turno: "Manhã", nivel: Nivel.FUND_I },
    { nome: "3º Ano B", serie: "3º Ano", turno: "Tarde", nivel: Nivel.FUND_I },
    { nome: "5º Ano A", serie: "5º Ano", turno: "Manhã", nivel: Nivel.FUND_I },
    { nome: "6º Ano A", serie: "6º Ano", turno: "Manhã", nivel: Nivel.FUND_II },
    { nome: "8º Ano B", serie: "8º Ano", turno: "Tarde", nivel: Nivel.FUND_II },
    { nome: "1º EM A",  serie: "1º EM",  turno: "Manhã", nivel: Nivel.MEDIO },
    { nome: "3º EM B",  serie: "3º EM",  turno: "Noite", nivel: Nivel.MEDIO },
  ];

  const turmaMap: Record<string, string> = {};
  for (const t of turmasData) {
    const turma = await prisma.turma.create({ data: t });
    turmaMap[t.nome] = turma.id;
  }
  console.log(`  ✅ ${turmasData.length} turmas`);

  const vinculos: Array<{ turma: string; disciplinas: string[] }> = [
    { turma: "6º Ano A", disciplinas: ["Matemática","Português","Ciências","História","Geografia","Educação Física","Artes","Inglês"] },
    { turma: "8º Ano B", disciplinas: ["Matemática","Português","Física","Química","Biologia","História","Geografia","Educação Física","Inglês"] },
    { turma: "1º EM A",  disciplinas: ["Matemática","Física","Química","Biologia","Português","Literatura","Redação","História","Geografia","Filosofia","Sociologia","Inglês","Educação Física"] },
    { turma: "1º Ano A", disciplinas: ["Matemática","Português","Ciências","História","Geografia","Educação Física","Artes","Religião"] },
  ];

  for (const v of vinculos) {
    const turmaId = turmaMap[v.turma];
    if (!turmaId) continue;
    for (const disc of v.disciplinas) {
      const disciplinaId = discMap[disc];
      if (!disciplinaId) continue;
      await prisma.disciplinaTurma.upsert({
        where: { disciplinaId_turmaId: { disciplinaId, turmaId } },
        update: {}, create: { disciplinaId, turmaId },
      });
    }
  }
  console.log("  ✅ Vínculos disciplina ↔ turma");

  const motivos = [
    { titulo: "Comportamento inadequado", positivo: false },
    { titulo: "Atraso injustificado", positivo: false },
    { titulo: "Falta sem justificativa", positivo: false },
    { titulo: "Uso indevido de celular", positivo: false },
    { titulo: "Não entregou atividade", positivo: false },
    { titulo: "Desrespeito ao professor", positivo: false },
    { titulo: "Conflito com colega", positivo: false },
    { titulo: "Excelente participação", positivo: true },
    { titulo: "Melhora no desempenho", positivo: true },
    { titulo: "Ajudou colega", positivo: true },
    { titulo: "Entrega exemplar", positivo: true },
    { titulo: "Dificuldade com fórmulas", positivo: false, disciplina: "Matemática" },
    { titulo: "Destaque em resolução", positivo: true,  disciplina: "Matemática" },
    { titulo: "Destaque na redação",   positivo: true,  disciplina: "Português" },
    { titulo: "Dificuldade de interpretação", positivo: false, disciplina: "Português" },
    { titulo: "Recusa em participar",  positivo: false, disciplina: "Educação Física" },
    { titulo: "Destaque esportivo",    positivo: true,  disciplina: "Educação Física" },
  ];

  for (const m of motivos) {
    await prisma.motivo.create({
      data: { titulo: m.titulo, positivo: m.positivo, disciplinaId: m.disciplina ? discMap[m.disciplina] : null },
    });
  }
  console.log(`  ✅ ${motivos.length} motivos`);

  const turma6A = await prisma.turma.findFirst({ where: { nome: "6º Ano A" } });
  if (turma6A) {
    const nomes = [
      "Ana Beatriz Souza","Carlos Eduardo Lima","Fernanda Oliveira","Gabriel Santos",
      "Isabela Carvalho","João Pedro Alves","Larissa Mendes","Matheus Costa",
      "Natália Rodrigues","Pedro Henrique Ferreira","Rafaela Martins","Thiago Barbosa",
    ];
    for (let i = 0; i < nomes.length; i++) {
      await prisma.aluno.upsert({
        where: { matricula: `2026${String(i + 1).padStart(4, "0")}` },
        update: {},
        create: { nome: nomes[i], matricula: `2026${String(i + 1).padStart(4, "0")}`, turmaId: turma6A.id, estrelas: 5 },
      });
    }
    console.log("  ✅ 12 alunos no 6º Ano A");
  }

  console.log("\n🎉 Seed concluído!");
  console.log("  secretaria@escola.com → SecGeral@2026");
  console.log("  fund1@escola.com      → Fund1@2026");
  console.log("  fund2@escola.com      → Fund2@2026");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());