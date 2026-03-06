# Domínio — Meu Treino

## Visão Geral do Domínio

O Meu Treino modela o fluxo de treino de academia em duas fases:

1. **Planejamento:** O usuário (ou admin) configura *rotinas* com exercícios, séries, repetições-alvo e tempos de descanso.
2. **Execução:** O usuário realiza o treino, registrando a carga e repetições *reais* de cada série.

Essa separação é refletida diretamente no schema do banco de dados.

---

## Modelo de Dados

### Diagrama de Entidades

```
┌──────────────┐
│   AppUser    │
│──────────────│
│ id (PK)      │
│ role          │  "USER" | "ADMIN"
│ createdAt     │
└──────┬───────┘
       │ 1:N
       ▼
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│WorkoutSplit  │ M:N   │ WorkoutExercise   │  N:1  │  Exercise    │
│──────────────│◄─────►│──────────────────│──────►│──────────────│
│ id (PK)      │       │ id (PK)          │       │ id (PK)      │
│ userId (FK)  │       │ workoutSplitId   │       │ name         │
│ name         │       │ exerciseId       │       │ muscleGroup  │
│ description  │       │ sets             │       │ mediaUrl     │
│ createdAt    │       │ targetReps       │       │ createdAt    │
└──────┬───────┘       │ restTimeSeconds  │       └──────┬───────┘
       │               │ order            │              │
       │ 1:N           └──────────────────┘              │ 1:N
       ▼                                                 ▼
┌──────────────┐       ┌──────────────────┐
│ WorkoutLog   │ 1:N   │  ExerciseLog     │
│──────────────│──────►│──────────────────│
│ id (PK)      │       │ id (PK)          │
│ date         │       │ workoutLogId (FK)│
│ workoutSplitId│      │ exerciseId (FK)  │
│ status       │       │ setNumber        │
│ createdAt    │       │ repsCompleted    │
└──────────────┘       │ weightUsed       │
                       └──────────────────┘
```

---

## Entidades de Planejamento

### WorkoutSplit (Rotina de Treino)

```prisma
model WorkoutSplit {
  id          String            @id @default(cuid())
  userId      String            @map("user_id")
  name        String
  description String?
  exercises   WorkoutExercise[]
  logs        WorkoutLog[]
  createdAt   DateTime          @default(now())
}
```

**O que é:** Uma *rotina* ou *divisão* de treino. Exemplos: "Full Body A", "Push Day", "Perna + Glúteo".

**Responsabilidades:**
- Pertence a um `AppUser` (relação `userId`).
- Agrupa um conjunto de exercícios planejados (via `WorkoutExercise`).
- É referenciada por `WorkoutLog` para saber *qual rotina* foi executada.

**Analogia:** É o "template" do treino. Você cria uma vez e executa várias vezes.

---

### Exercise (Catálogo de Exercícios)

```prisma
model Exercise {
  id          String            @id @default(cuid())
  name        String
  muscleGroup String            @map("muscle_group")
  mediaUrl    String?           @map("media_url")
  workouts    WorkoutExercise[]
  logs        ExerciseLog[]
  createdAt   DateTime          @default(now())
}
```

**O que é:** Uma entrada no *catálogo global* de exercícios. Exemplos: "Barbell Squat", "Bench Press", "Deadlift".

**Responsabilidades:**
- É um registro compartilhado (não pertence a um usuário específico).
- Gerenciado por administradores via `/admin/exercises`.
- Possui `muscleGroup` (grupo muscular: "Quadríceps", "Peitoral", etc.).
- Pode ter uma `mediaUrl` apontando para um vídeo ou GIF demonstrativo.
- É reutilizado por múltiplos `WorkoutSplit` via `WorkoutExercise`.

**Diferença chave: Exercise ≠ ExerciseLog**

| Exercise (Catálogo)         | ExerciseLog (Execução)           |
|-----------------------------|----------------------------------|
| "Barbell Squat"             | "Barbell Squat — Série 1: 8 reps × 80kg" |
| Definição estática          | Registro de uma execução real    |
| Grupo muscular, mídia       | setNumber, repsCompleted, weightUsed |
| Criado uma vez pelo admin   | Criado a cada treino pelo usuário |

---

### WorkoutExercise (Exercício Planejado na Rotina)

```prisma
model WorkoutExercise {
  id              String       @id @default(cuid())
  workoutSplitId  String       @map("workout_split_id")
  exerciseId      String       @map("exercise_id")
  sets            Int          @default(3)
  targetReps      Int          @default(12)
  restTimeSeconds Int          @default(60)
  order           Int          @default(0)
}
```

**O que é:** A tabela de junção entre `WorkoutSplit` e `Exercise`, com dados de planejamento.

**Responsabilidades:**
- Define *quantas séries* (`sets`), *quantas reps-alvo* (`targetReps`) e *quanto descanso* (`restTimeSeconds`) são planejados para aquele exercício naquela rotina.
- O campo `order` define a sequência de execução dos exercícios dentro da rotina.

**Exemplo prático:**

O `WorkoutSplit` "Full Body A" pode ter:

| Exercício      | Sets | Target Reps | Rest (s) | Order |
|----------------|------|-------------|-----------|-------|
| Barbell Squat  | 4    | 8           | 120       | 0     |
| Bench Press    | 4    | 10          | 90        | 1     |

---

## Entidades de Execução

### WorkoutLog (Registro de Treino)

```prisma
model WorkoutLog {
  id             String        @id @default(cuid())
  date           DateTime      @default(now())
  workoutSplitId String        @map("workout_split_id")
  status         String        @default("pending_sync")
  exerciseLogs   ExerciseLog[]
  createdAt      DateTime      @default(now())
}
```

**O que é:** O registro de uma *sessão de treino realizada*. Cada vez que o usuário finaliza um treino, um `WorkoutLog` é criado.

**Responsabilidades:**
- Registra *quando* o treino foi feito (`date`).
- Referencia *qual rotina* foi executada (`workoutSplitId`).
- Contém os detalhes de cada exercício executado (via `ExerciseLog`).
- Gerencia o estado de sincronização via `status`.

**Diferença chave: WorkoutSplit ≠ WorkoutLog**

| WorkoutSplit (Template)       | WorkoutLog (Execução)            |
|-------------------------------|----------------------------------|
| "Full Body A"                 | "Full Body A — 06/03/2026 14:30" |
| Definição da rotina           | Registro de uma sessão real      |
| Exercícios planejados         | Exercícios executados com carga  |
| Criado uma vez                | Criado a cada treino             |
| Editável pelo usuário         | Imutável após finalização        |

---

### ExerciseLog (Registro de Série Executada)

```prisma
model ExerciseLog {
  id            String     @id @default(cuid())
  workoutLogId  String     @map("workout_log_id")
  exerciseId    String     @map("exercise_id")
  setNumber     Int        @map("set_number")
  repsCompleted Int        @map("reps_completed")
  weightUsed    Float      @map("weight_used")
}
```

**O que é:** O registro de *uma série* de um exercício executado durante um treino.

**Responsabilidades:**
- Registra qual série foi (`setNumber`), quantas repetições foram feitas (`repsCompleted`) e qual carga foi usada (`weightUsed` em kg).
- Referencia o `WorkoutLog` (sessão de treino) e o `Exercise` (exercício do catálogo).

**Exemplo prático:**

Para um treino de "Full Body A" com Barbell Squat (4 × 8):

| setNumber | repsCompleted | weightUsed |
|-----------|---------------|------------|
| 1         | 8             | 80.0       |
| 2         | 8             | 80.0       |
| 3         | 7             | 80.0       |
| 4         | 6             | 75.0       |

---

## Status de Sincronização

### Campo `WorkoutLog.status`

O campo `status` do `WorkoutLog` controla o ciclo de vida de sincronização entre o IndexedDB local e o banco PostgreSQL remoto.

| Status          | Significado                                         |
|-----------------|-----------------------------------------------------|
| `pending_sync`  | Log existe apenas localmente (IndexedDB). Aguardando sincronização. |
| `synced`        | Log foi persistido com sucesso no servidor (Neon PostgreSQL).       |

### Fluxo da Fila de Sincronização

```
                         OFFLINE                              ONLINE
┌──────────────────────────────────────┐    ┌──────────────────────────────────┐
│                                      │    │                                  │
│  1. Usuário finaliza treino          │    │  4. navigator.onLine === true    │
│     │                                │    │     │                            │
│  2. WorkoutLog salvo no IndexedDB    │    │  5. syncPendingLogs() é chamada  │
│     syncQueue.add({                  │    │     │                            │
│       clientId: "uuid-v4",           │    │  6. POST /api/sync              │
│       date: "2026-03-06T...",        │    │     body: { logs: [...] }        │
│       workoutSplitId: "clxyz...",    │    │     │                            │
│       exerciseLogs: [...]            │    │  7. Servidor: $transaction       │
│     })                               │    │     WorkoutLog.create({          │
│     │                                │    │       status: "synced"           │
│  3. Status implícito: pending_sync   │    │     })                           │
│     (dado vive apenas no IndexedDB)  │    │     │                            │
│                                      │    │  8. syncQueue.bulkDelete(ids)    │
│                                      │    │     Itens removidos do IndexedDB │
│                                      │    │                                  │
└──────────────────────────────────────┘    └──────────────────────────────────┘
```

### Detalhes Técnicos

1. **Client-Side (IndexedDB → `src/lib/db.ts`):**
   - A tabela `syncQueue` usa `++localId` (auto-increment) como PK.
   - Cada entry tem um `clientId` (UUID gerado no client) para idempotência.
   - Ao finalizar um treino, um `SyncWorkoutLog` é adicionado à queue.

2. **Sync Trigger (`src/lib/sync.ts`):**
   - `syncPendingLogs()` — Lê todos os itens da `syncQueue`, envia via `POST /api/sync`, e limpa os sincronizados.
   - `registerSyncOnReconnect()` — Registra listener no evento `online` do browser para auto-sync.
   - O `SyncBadge` exibe o count da queue e polled a cada 5 segundos.

3. **Server-Side (`/api/sync/route.ts`):**
   - Recebe um array `logs` no body.
   - Verifica ownership (o split pertence ao usuário autenticado?).
   - Persiste em uma `$transaction` do Prisma — tudo ou nada.
   - Cada `WorkoutLog` é criado com `status: "synced"`.

4. **Importante — `pending_sync` é um estado implícito:**
   - Enquanto o log está na `syncQueue` do IndexedDB, ele *não existe* no banco PostgreSQL.
   - O valor `pending_sync` como `@default("pending_sync")` no schema está preparado para casos onde o log é criado diretamente no servidor mas ainda não confirmado (futuro).
   - Na prática atual, logs no servidor sempre têm `status: "synced"`.

---

## Modelo de Autorização

### AppUser

```prisma
model AppUser {
  id        String  @id
  role      String  @default("USER")  // "USER" | "ADMIN"
  splits    WorkoutSplit[]
  createdAt DateTime @default(now())
}
```

### Roles

| Role    | Permissões                                              |
|---------|---------------------------------------------------------|
| `USER`  | CRUD dos próprios splits, executar treinos, ver histórico |
| `ADMIN` | Tudo do USER + gerenciar catálogo global de exercícios   |

### Mapeamento de Role

O role é mapeado a partir do sistema de autenticação Neon:
- Neon Auth role `"admin"` → `AppUser.role = "ADMIN"`
- Neon Auth role `"user"` (ou qualquer outro) → `AppUser.role = "USER"`

O mapeamento é feito em `requireAuth()` (`src/lib/auth-check.ts`) usando `prisma.appUser.upsert()`, garantindo que:
1. O `AppUser` é criado na primeira autenticação.
2. O role é atualizado a cada sessão (caso mude no provedor de auth).

---

## Convenções de Schema

### Naming

- **Models:** PascalCase (ex: `WorkoutSplit`, `ExerciseLog`).
- **Campos TypeScript:** camelCase (ex: `workoutSplitId`, `targetReps`).
- **Colunas SQL:** snake_case via `@map()` (ex: `workout_split_id`, `target_reps`).
- **Tabelas SQL:** snake_case plural via `@@map()` (ex: `workout_splits`, `exercise_logs`).

### IDs

- Todos os IDs usam `cuid()` (Collision-resistant Unique IDentifier), exceto `AppUser.id` que é fornecido pelo Neon Auth.

### Timestamps

- `createdAt` com `@default(now())` e mapeado para `created_at` no SQL.
- `WorkoutLog.date` é separado de `createdAt` — o `date` pode ser retroativo (caso o sync ocorra depois).
