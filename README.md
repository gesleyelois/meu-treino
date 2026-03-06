# Meu Treino 💪

PWA offline-first de acompanhamento de treinos. Registre séries, cargas e repetições na academia — mesmo sem internet.

## Stack

- **Next.js 16** (App Router)
- **Prisma 6** + **Neon** (Serverless PostgreSQL)
- **Tailwind CSS 4** (Dark Mode-First)
- **Dexie.js** (IndexedDB para offline)
- **next-pwa** (Service Worker)

## Setup

```bash
# Instalar dependências
npm install

# Configurar banco de dados
cp .env.example .env
# Edite .env com sua connection string do Neon

# Rodar migrations e seed
npx prisma migrate dev --name init
npx prisma db seed

# Iniciar dev server
npm run dev
```

## Deploy na Vercel

1. Conecte o repositório no [vercel.com](https://vercel.com)
2. Adicione a variável de ambiente `DATABASE_URL` com sua connection string do Neon
3. Deploy automático a cada push na `main`

## Funcionalidades

- 📱 **PWA Installável** — adicione à tela inicial do celular
- 📶 **Offline-First** — registre treinos sem internet
- 🔄 **Sync automático** — dados sincronizam ao reconectar
- ⏱️ **Timer de descanso** — cronômetro circular embutido
- 🎯 **Planejado vs Realizado** — compare metas com execução
- 🎬 **Vídeos demo** — veja a execução correta de cada exercício
