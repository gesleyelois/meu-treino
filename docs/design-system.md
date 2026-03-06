# Design System — Meu Treino

## Filosofia

O design system do Meu Treino é construído para uso em **ambientes de academia**: telas vistas sob iluminação forte, mãos suadas, luvas, e atenção dividida entre o treino e o celular. Cada decisão prioriza:

1. **Alto contraste** — legibilidade em qualquer iluminação
2. **Alvos de toque grandes** — operação com dedos largos ou luvas
3. **Números alinhados** — leitura rápida de cargas e repetições
4. **Feedback tátil** — resposta visual imediata a cada interação

---

## Tema Base: Dark Mode-First

O app é **exclusivamente dark mode**. Não existe alternância para light mode.

```css
html {
  color-scheme: dark;
}

body {
  background: var(--color-background); /* #09090b — zinc-950 */
  color: var(--color-text-primary);     /* #fafafa — zinc-50  */
  font-family: var(--font-sans);        /* Inter, system-ui   */
}
```

### Hierarquia de Superfícies

| Nível          | Classe Tailwind   | Cor Hex   | Uso                                   |
|----------------|-------------------|-----------|---------------------------------------|
| Fundo base     | `bg-background`   | `#09090b` | Body, fundo geral                     |
| Superfície     | `bg-surface`      | `#18181b` | Cards, modais, containers elevados    |
| Borda          | `border-border`   | `#27272a` | Bordas de cards, separadores          |
| Scrollbar      | —                 | `#3f3f46` | Scrollbar customizada (zinc-700)      |

> **Nota:** Variáveis CSS como `--color-background`, `--color-surface`, etc., estão definidas no bloco `@theme inline { ... }` de `src/app/globals.css`.

---

## Paleta de Cores

### Cores Semânticas

| Token                | Hex / rgba                      | Classe Tailwind Direta | Significado                        |
|----------------------|---------------------------------|------------------------|------------------------------------|
| `--color-primary`     | `#059669`                      | `bg-emerald-600`       | Ação principal: iniciar, confirmar, completar |
| `--color-primary-hover` | `#047857`                    | `bg-emerald-700`       | Hover do primário                  |
| `--color-primary-glow` | `rgba(5, 150, 105, 0.15)`    | —                      | Glow/shadow em botões primários    |
| `--color-warning`     | `#f59e0b`                      | `text-amber-500`       | Timer de descanso, itens pendentes |
| `--color-danger`      | `#ef4444`                      | `bg-red-500`           | Exclusão, ações destrutivas        |
| `--color-success-bg`  | `rgba(6, 78, 59, 0.3)`        | —                      | Background de séries concluídas    |

### Cores de Texto

| Token                   | Hex       | Classe Tailwind     | Uso                          |
|-------------------------|-----------|---------------------|------------------------------|
| `--color-text-primary`  | `#fafafa` | `text-zinc-50/100`  | Títulos, nomes, valores      |
| `--color-text-secondary`| `#a1a1aa` | `text-zinc-400`     | Subtítulos, labels, metadata |
| —                       | `#71717a` | `text-zinc-500`     | Texto desabilitado, hints    |

### Aplicação de Cores por Contexto

| Contexto                  | Cor Principal     | Exemplo                              |
|---------------------------|-------------------|--------------------------------------|
| Iniciar treino            | 🟢 Emerald-600   | Botão "Iniciar Treino"               |
| Completar série           | 🟢 Emerald-600   | Botão "Concluir Série"               |
| Timer de descanso         | 🟡 Amber-500     | Círculo do cronômetro                |
| Sync pendente             | 🟡 Amber-500     | Badge de itens na sync queue         |
| Online                    | 🟢 Emerald-500   | Dot indicator no SyncBadge           |
| Offline                   | 🔴 Red-500       | Dot indicator pulsante              |
| Excluir                   | 🔴 Red-600       | Botão "Excluir" no ConfirmModal      |
| Treino concluído (card)   | — Opacity 70%    | Card com `opacity-70` e borda muted  |

---

## Tipografia

### Fonte

- **Primária:** Inter (Google Fonts), carregada via `next/font/google`
- **Fallback:** `ui-sans-serif, system-ui, sans-serif`
- **Variável CSS:** `--font-inter` / `--font-sans`
- **Body class:** `font-sans antialiased`

### Escala Tipográfica

| Elemento              | Classe Tailwind                  | Peso           |
|-----------------------|----------------------------------|----------------|
| Título H1 (página)   | `text-2xl font-bold tracking-tight` | bold (700)  |
| Título H2 (card)     | `text-lg font-bold`              | bold (700)     |
| Título H3 (modal)    | `text-lg font-bold`              | bold (700)     |
| Subtítulo             | `text-sm text-zinc-400`          | normal (400)   |
| Label (input)         | `text-xs text-zinc-500 uppercase tracking-wider` | normal (400) |
| Label (nav)           | `text-[10px] font-medium`       | medium (500)   |
| Valor numérico grande | `text-2xl font-bold tabular-nums`| bold (700)     |
| Badge/tag             | `text-xs font-medium`           | medium (500)   |

### Regra: `tabular-nums`

A classe `tabular-nums` (definida por `font-variant-numeric: tabular-nums` no CSS) é **obrigatória** para:

- Valores de repetições exibidos no `SetRow`
- Valores de carga (kg) no `SetRow`
- Timer de descanso (MM:SS) no `RestTimer`
- Contadores de sync no `SyncBadge`

Isso garante que dígitos tenham largura fixa, evitando "pulos" quando valores mudam.

---

## Componentes de UI

### Botões

#### Botão Primário (CTA)

```
h-14 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700
text-white font-bold text-base
shadow-lg shadow-emerald-600/20
transition-all active:scale-[0.97]
```

Usado para: "Iniciar Treino", "Salvar", "Finalizar Treino".

#### Botão Secundário

```
h-12 w-full rounded-xl bg-zinc-900 hover:bg-zinc-800
border border-zinc-800 text-zinc-300 font-medium text-sm
transition-colors active:scale-[0.98]
```

Usado para: "Sincronizar Treinos", ações secundárias.

#### Botão de Incremento/Decremento (SetRow)

```
h-14 w-14 rounded-lg bg-zinc-800 hover:bg-zinc-700
text-xl font-bold text-zinc-300
active:scale-95 transition-all
flex items-center justify-center
```

Esses botões exibem `−` e `+` para ajustar reps e peso. O tamanho `h-14 w-14` segue a Fat Finger Rule.

#### Botão Destrutivo (Modal)

```
h-10 px-4 rounded-xl font-medium text-sm text-white
bg-red-600/90 hover:bg-red-500
shadow-lg shadow-red-900/20 transition-colors
```

### Cards

#### Card de Treino (Home)

```
border rounded-2xl p-5 bg-zinc-900 border-zinc-800
hover:border-zinc-700 hover:shadow-lg hover:shadow-emerald-950/20
transition-all duration-200
```

#### Card Concluído (Home)

```
bg-zinc-900/40 border-zinc-800/40 opacity-70
```

Exercícios internos recebem `grayscale opacity-70` para dessaturar.

#### Card de Série (SetRow)

```
rounded-xl p-4 bg-zinc-900 border border-zinc-800
transition-colors duration-300
```

Estado concluído:
```
bg-emerald-950/30 border border-emerald-800/40
```

### Inputs Numéricos (Planejado vs. Realizado)

O `SetRow` implementa o padrão "Planejado vs. Realizado":

```
┌──────────────────────────────────┐
│  ① Série 1    Meta: 12 reps     │ ← Planejado (targetReps)
│                                  │
│  Repetições         Carga (kg)   │
│  [−]   12   [+]    [−]  40  [+] │ ← Realizado (editável)
│                                  │
│  [     ✓ Concluir Série        ]│
└──────────────────────────────────┘
```

- Os valores numéricos centrais usam `text-2xl font-bold tabular-nums`
- Os botões `−` / `+` são `h-14 w-14` (Fat Finger Rule)
- O incremento de peso é de **2.5 kg** (padrão de academia para anilhas)

### Timer de Descanso (RestTimer)

Componente circular SVG com:
- Arco de progresso: `stroke="amber-500"` (em andamento) → `stroke="emerald-600"` (concluído)
- Display central: `text-2xl font-bold tabular-nums text-amber-500`
- Vibração ao concluir: `navigator.vibrate([200, 100, 200])`
- Botões de controle: Iniciar (emerald-600), Pausar (zinc-700), Reset (zinc-800)

### Navegação

#### Bottom Nav

```
fixed bottom-0 z-50 bg-zinc-950/95 backdrop-blur-xl
border-t border-zinc-800/50 h-16
```

- 3 itens: Início, Gerenciar, Histórico
- Ativo: `text-emerald-500`
- Inativo: `text-zinc-500 hover:text-zinc-300`
- **Esconde-se** durante treino ativo (`/workout/*`)

#### Top Header

```
fixed top-0 z-50 h-14 bg-zinc-950/80 backdrop-blur-md
border-b border-zinc-800
```

- Logo "Meu Treino" à esquerda
- Badge "Painel Admin" (se role === ADMIN) em emerald
- Botão SignOut à direita

### Modal de Confirmação (ConfirmModal)

```
Overlay: fixed inset-0 z-[100] bg-zinc-950/80 backdrop-blur-sm
Card:    max-w-sm bg-zinc-900 border-zinc-800 rounded-2xl shadow-2xl
Footer:  bg-zinc-950/50 border-t border-zinc-800/50
```

- Botão cancelar: `bg-zinc-800`
- Botão confirmar (destrutivo): `bg-red-600/90`
- Botão confirmar (positivo): `bg-emerald-600/90`

---

## Media Player (Vídeos/GIFs de Exercícios)

### Regras de Exibição

Todo media de exercício (vídeo ou imagem/GIF) deve seguir estas classes:

```
w-full aspect-video object-cover rounded-xl
```

### Vídeos

```html
<video
  src={mediaUrl}
  autoPlay
  loop
  muted
  playsInline
  className="w-full aspect-video object-cover rounded-xl bg-zinc-800"
/>
```

### Imagens/GIFs

```html
<img
  src={mediaUrl}
  alt={exerciseName}
  className="w-full aspect-video object-cover rounded-xl bg-zinc-800"
/>
```

### Detecção de Tipo

O tipo é detectado pela extensão da URL:
- `.mp4`, `.webm`, `.mov` → `<video>`
- `.gif`, `.jpg`, `.jpeg`, `.png`, `.webp` → `<img>`

---

## Animações

### Entrada de Página

```css
.page-enter {
  animation: fadeSlideIn 0.3s ease-out;
}

@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### Pulso do Sync Badge (Offline)

```css
.animate-pulse-dot {
  animation: pulse-dot 2s ease-in-out infinite;
}
```

### Micro-interações em Botões

- Primary: `active:scale-[0.97]`
- Secondary: `active:scale-[0.98]`
- Increment/Decrement: `active:scale-95`
- Todas com `transition-all` ou `transition-colors`

---

## Responsividade

- Layout centralizado: `max-w-lg mx-auto`
- Viewport: `width=device-width, initialScale=1, maximumScale=1, userScalable=false`
- Orientação: apenas `portrait` (manifest.json)
- Safe areas: `min-h-dvh`, `pb-20` (para bottom nav), `pt-14` (para top header)
- `-webkit-tap-highlight-color: transparent` para remover highlight de toque no iOS
- `overscroll-behavior-y: contain` para prevenir pull-to-refresh indesejado

---

## Scrollbar Customizada

```css
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 2px; }
```

Scrollbar fina e discreta, combinando com o tema dark.
