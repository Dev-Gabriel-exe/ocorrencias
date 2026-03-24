# Sistema de Ocorrências Escolares

Plataforma web completa para registro de ocorrências escolares, gestão de turmas, alunos e relatórios.

## Stack

- **Next.js 14** (App Router + TypeScript)
- **Prisma ORM** + **Neon** (PostgreSQL Serverless)
- **NextAuth.js v5** (Google OAuth + Credenciais)
- **Tailwind CSS** + **shadcn/ui**
- **Resend** (envio de emails)
- **Recharts** (gráficos)
- **Vercel** (deploy)

---

## Passo a passo para rodar

### 1. Crie o projeto Next.js

```bash
npx create-next-app@latest ocorrencias \
  --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

cd ocorrencias
```

### 2. Substitua os arquivos

Copie todos os arquivos desta pasta para o projeto criado, substituindo os existentes.

### 3. Instale as dependências

```bash
# Banco e ORM
npm install @prisma/client prisma @neondatabase/serverless

# Auth
npm install next-auth@beta @auth/prisma-adapter bcryptjs @types/bcryptjs

# Email
npm install resend

# UI
npx shadcn@latest init
npx shadcn@latest add button card dialog form input label select table badge tabs

# Gráficos e utilitários
npm install recharts lucide-react date-fns jspdf jspdf-autotable

# Dev
npm install -D tsx
```

### 4. Configure as variáveis de ambiente

Copie `.env.local` e preencha com suas chaves:

```bash
cp .env.local .env.local
```

Preencha:
- `DATABASE_URL` e `DIRECT_URL` → Neon (console.neon.tech)
- `NEXTAUTH_SECRET` → `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` → console.cloud.google.com
- `RESEND_API_KEY` → resend.com
- `INSTITUICAO_EMAIL` → email que receberá as ocorrências

### 5. Configure o Prisma e o banco

```bash
# Gera o Prisma Client
npx prisma generate

# Aplica o schema no Neon
npx prisma migrate dev --name init

# Popula com dados iniciais (secretaria + motivos + turmas de exemplo)
npx prisma db seed
```

### 6. Rode em desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## Logins de teste (após o seed)

### Secretaria
| Email | Senha | Acesso |
|-------|-------|--------|
| secretaria@escola.com | SecGeral@2026 | Todas as turmas |
| fund1@escola.com | Fund1@2026 | 1º ao 5º ano |
| fund2@escola.com | Fund2@2026 | 6º ano ao EM |

### Professor
Faça login com qualquer conta Google — será criado automaticamente com role PROFESSOR.

---

## Deploy no Vercel

```bash
# Instale a CLI
npm install -g vercel

# Deploy
vercel

# Produção
vercel --prod
```

Adicione no dashboard do Vercel (Settings → Environment Variables):
- Todas as variáveis do `.env.local`
- Troque `NEXTAUTH_URL` pela URL do Vercel

---

## Estrutura de pastas

```
src/
├── app/
│   ├── (auth)/login/          # Página de login
│   ├── (professor)/           # Rotas do professor
│   │   ├── dashboard/         # Dashboard com turmas
│   │   ├── turma/[id]/        # Lista de alunos
│   │   ├── aluno/[id]/        # Ocorrências do aluno
│   │   ├── perfil/            # Perfil do professor
│   │   ├── lembretes/         # Agenda
│   │   └── relatorios/        # Relatórios
│   ├── (secretaria)/          # Rotas da secretaria
│   │   ├── dashboard/
│   │   ├── turmas/
│   │   ├── alunos/
│   │   ├── motivos/
│   │   └── relatorios/
│   └── api/                   # API Routes
├── components/
│   ├── layout/                # Sidebars, providers
│   ├── ocorrencias/           # Modal, botões
│   ├── estrelas/              # Componente de estrelas
│   └── relatorios/            # Gráficos Recharts
├── lib/
│   ├── prisma.ts              # Singleton Prisma
│   ├── auth.ts                # Config NextAuth
│   └── email.ts               # Helpers Resend
└── types/
    └── index.ts               # Tipos TypeScript
```

---

## Comandos úteis

```bash
npm run dev          # Dev server
npm run db:migrate   # Migrate dev
npm run db:seed      # Popular banco
npm run db:studio    # Prisma Studio (visual do banco)
npm run build        # Build produção
```
