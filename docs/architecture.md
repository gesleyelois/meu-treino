# Arquitetura — Meu Treino

## Visão Geral

**Meu Treino** é um PWA offline-first de rastreamento de treinos de academia. A arquitetura prioriza a experiência do usuário em ambientes com conectividade instável (academias, metrôs), garantindo que todo treino possa ser registrado e sincronizado posteriormente.

```
┌─────────────────────────────────────────────────┐
│                    PWA Shell                     │
│         (Service Worker + manifest.json)         │
├─────────────────────────────────────────────────┤
│             Next.js App Router                   │
│  ┌──────────────┐    ┌───────────────────────┐  │
│  │ [locale]/     │    │  api/                 │  │
│  │  (protected)/ │    │   workouts/route.ts   │  │
│  │   page.tsx    │◄──►│   sync/route.ts       │  │
│  │   workout/    │    │   splits/route.ts     │  │
│  │   manage/     │    │   history/route.ts    │  │
│  │   history/    │    │   admin/exercises/    │  │
│  │   admin/      │    │   upload/route.ts     │  │
│  └──────────────┘    └───────────┬───────────┘  │
├────────────────────────────────────────┬────────┤
│           Dexie.js (IndexedDB)         │ Prisma │
│  ┌──────────┐  ┌───────────┐           │  ORM   │
│  │ catalog  │  │ syncQueue │           │   │    │
│  └──────────┘  └───────────┘           │   ▼    │
│                                        │ Neon   │
│                                        │(PgSQL) │
└────────────────────────────────────────┴────────┘
```

---

## Organização do App Router

### Estrutura de Pastas

```
src/app/
├── layout.tsx              # RootLayout — metadata, viewport, Google Font (Inter)
├── globals.css             # Tokens de design (@theme inline), animações
├── favicon.ico
│
├── [locale]/               # Segmento dinâmico de internacionalização
│   ├── layout.tsx          # LocaleLayout — NextIntlClientProvider, TopHeader, BottomNav
│   │
│   ├── (protected)/        # Route Group — exige sessão ativa (Neon Auth)
│   │   ├── layout.tsx      # ProtectedLayout — redirect se não autenticado
│   │   ├── page.tsx        # Home — lista de splits com botão "Iniciar Treino"
│   │   ├── workout/        # Execução de treino em tempo real
│   │   ├── manage/         # CRUD de rotinas/splits
│   │   ├── history/        # Histórico com CalendarView
│   │   └── admin/          # Painel admin (gerenciamento de exercícios)
│   │
│   ├── auth/               # Telas de sign-in/sign-up (Neon Auth)
│   ├── account/            # Configurações da conta
│   └── magic-register/     # Registro via magic link
│
└── api/                    # Route Handlers (REST endpoints)
    ├── auth/[...path]/     # Proxy de autenticação Neon
    ├── workouts/           # GET — catálogo do usuário (splits + exercises + logs recentes)
    ├── sync/               # POST — recebe logs offline e persiste como "synced"
    ├── splits/             # CRUD de WorkoutSplits
    ├── history/            # GET — histórico completo de WorkoutLogs
    ├── upload/             # POST — upload de arquivos de mídia (GIF/vídeo)
    └── admin/exercises/    # CRUD de exercícios (acesso ADMIN)
```

### Segmento `[locale]`

O segmento `[locale]` é o mecanismo do `next-intl` para roteamento baseado em idioma. Todas as URLs do app incluem o locale:

- `/pt-BR/` → Home em português
- `/en/workout/abc123` → Treino em inglês

O locale é validado no `LocaleLayout` contra os locales definidos em `src/i18n/routing.ts` (`pt-BR` e `en`). Se inválido, retorna `notFound()`.

### Route Group `(protected)`

O diretório `(protected)` é um Route Group do Next.js — o nome não aparece na URL. Seu `layout.tsx` verifica a sessão via `auth.getSession()` e redireciona para `/pt-BR/auth/sign-in` se o usuário não estiver autenticado.

---

## Arquitetura Offline-First

### Camada de Dados Local (Dexie.js / IndexedDB)

O banco local é gerenciado pelo **Dexie.js** (wrapper TypeScript para IndexedDB), definido em `src/lib/db.ts`:

| Store       | Finalidade                           | Chave Primária  |
|-------------|--------------------------------------|-----------------|
| `catalog`   | Cache do catálogo de treinos (splits + exercícios) | `id` (string)   |
| `syncQueue` | Fila de logs pendentes de sincronização | `++localId` (autoincrement) |

#### Catalog Store

Contém os `CatalogSplit`, que são uma projeção desnormalizada dos `WorkoutSplit` com seus exercícios aninhados. É preenchido pela função `refreshCatalog()` ao carregar a Home ou quando o app volta online.

#### Sync Queue Store

Cada `SyncWorkoutLog` contém:
- `clientId` — UUID gerado client-side para idempotência
- `date` — ISO string da data do treino
- `workoutSplitId` — referência ao split executado
- `exerciseLogs[]` — array com `exerciseId`, `setNumber`, `repsCompleted`, `weightUsed`

### Fluxo de Sincronização

```
┌───────┐    Treino concluído    ┌──────────┐
│ User  │───────────────────────►│syncQueue  │  (IndexedDB)
└───────┘                       │(Dexie.js) │
                                └─────┬─────┘
                                      │
                    navigator.onLine?  │
                    ┌─────────────┐   │
                    │ SIM (online)│◄──┘
                    └──────┬──────┘
                           │
                    POST /api/sync
                    (batch de logs)
                           │
                    ┌──────▼──────┐
                    │   Prisma    │
                    │ $transaction│
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Neon DB    │
                    │ (PostgreSQL)│
                    └─────────────┘
                           │
                    status = "synced"
                    syncQueue.bulkDelete()
```

1. **Registro:** Ao finalizar um treino, os dados são salvos primeiro na `syncQueue` do IndexedDB.
2. **Tentativa de Sync:** A função `syncPendingLogs()` envia todos os logs pendentes via `POST /api/sync`.
3. **Batch Transaction:** O servidor recebe um array de logs e os persiste em uma `$transaction` do Prisma, garantindo atomicidade.
4. **Limpeza:** Itens sincronizados com sucesso são removidos da `syncQueue`.
5. **Retry Automático:** `registerSyncOnReconnect()` registra um listener no evento `online` do browser para auto-sincronizar ao reconectar.

### Service Worker (next-pwa)

O Service Worker é configurado em `next.config.ts` via `next-pwa`:

```ts
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});
```

- **Produção:** O SW é registrado automaticamente e pré-cacheia os assets estáticos.
- **Desenvolvimento:** O SW é desabilitado para evitar conflitos com HMR.
- **Manifest:** `public/manifest.json` define `display: standalone` e `orientation: portrait`.

---

## Fluxo de Dados

### 1. Carregamento Inicial (Home)

```
Client (Home page.tsx)
   │
   ├─► refreshCatalog()
   │      ├─► fetch GET /api/workouts
   │      │      ├─► requireAuth()  →  Neon Auth session check
   │      │      └─► prisma.workoutSplit.findMany()  →  Neon PostgreSQL
   │      │
   │      ├─► (Online)  → Salva resposta no IndexedDB (catalog store)
   │      └─► (Offline) → Retorna dados do IndexedDB cache
   │
   └─► setState(splits) → Renderiza cards de treino
```

### 2. Execução de Treino

```
Client (Workout page.tsx)
   │
   ├─► getSplit(id) → Lê do IndexedDB (sem rede)
   │
   ├─► Usuário executa séries (SetRow component)
   │      ├─► Ajusta reps (−/+)
   │      ├─► Ajusta peso (−/+)
   │      └─► Marca série como concluída → RestTimer inicia
   │
   └─► "Finalizar Treino"
          ├─► db.syncQueue.add(workoutLog)  →  Salva no IndexedDB
          └─► syncPendingLogs()             →  Tenta enviar para servidor
```

### 3. CRUD de Splits (Manage)

```
Client (Manage page.tsx)
   │
   ├─► Criar/Editar: POST/PUT /api/splits
   │      └─► prisma.workoutSplit.create/update()
   │
   ├─► Excluir: DELETE /api/splits/[id]
   │      └─► prisma.workoutSplit.delete({ cascade })
   │
   └─► Após mutação → refreshCatalog() (atualiza cache local)
```

### 4. Autenticação

```
Neon Auth (servidor)
   │
   ├─► src/lib/auth/server.ts  →  createNeonAuth({ baseUrl, cookies })
   ├─► src/lib/auth/client.ts  →  createAuthClient()
   │
   └─► requireAuth() (src/lib/auth-check.ts)
          ├─► auth.getSession()
          ├─► Verifica role (admin → ADMIN, user → USER)
          └─► prisma.appUser.upsert()  →  Garante registro no banco
```

---

## Middleware

O middleware (`src/middleware.ts`) integra o `next-intl` para:
1. Detectar o locale da URL ou do header `Accept-Language`.
2. Redirecionar para o locale padrão (`pt-BR`) se nenhum for especificado.
3. Excluir do matching: `/api/*`, `/_next/*`, e arquivos estáticos.

```ts
export const config = {
    matcher: ["/((?!api|_next|.*\\..*).*)"],
};
```
