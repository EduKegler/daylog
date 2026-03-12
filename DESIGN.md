# Daylog Design System

> Source of truth para consistência visual. Toda skill de frontend DEVE seguir estas specs.

## Filosofia

- **Quiet luxury** — minimalista, elegante, sem decoração desnecessária
- Mobile-first, funcionalidade sobre estética
- Espaçamento generoso, hierarquia clara via tipografia
- Sem gradientes, sem glassmorphism, sem sombras pesadas

---

## Paleta de Cores

NUNCA usar cores fora desta paleta.

| Token | Hex | Uso |
|---|---|---|
| `--color-warm-bg` | `#F7F6F3` | Fundo da página |
| `--color-accent` | `#B45309` | CTAs, links hover, checkboxes ativos |
| `--color-accent-hover` | `#92400E` | Hover de botões primários |
| `--color-border` | `#E7E5E4` | Bordas, divisores, badges bg |
| `--color-muted` | `#78716C` | Texto secundário, labels, placeholders |
| `--color-stone-900` | (Tailwind) | Texto principal (preto quente) |
| `white` | `#FFFFFF` | Cards, superfícies elevadas |

### Cores semânticas (uso pontual)

| Contexto | Bg | Texto |
|---|---|---|
| Erro / Delete hover | `#FEF2F2` | `#DC2626` |
| Carry-over badge | `#FEF3C7` | `#92400E` |

---

## Tipografia

NUNCA usar fontes ou tamanhos fora desta tabela.

### Fontes

| Variável | Fonte | Uso |
|---|---|---|
| `--font-display` | Instrument Serif (400) | Títulos, datas históricas |
| `--font-body` | DM Sans | Todo o resto (body, buttons, inputs, labels) |

### Escala de tamanhos (tokens)

Piso tipográfico: **0.8125rem (13px)** para badges/tags, **0.875rem (14px)** para texto.

Todos os tamanhos são definidos como CSS custom properties no `@theme` do globals.css usando o namespace `--text-*` (obrigatório para Tailwind v4 gerar utilities). Usados como Tailwind utilities inline nos componentes TSX.

| Token | Rem | Tailwind utility | Uso |
|---|---|---|---|
| `--text-display` | `2rem` | `text-display` | Títulos de página |
| `--text-heading` | `1.375rem` | `text-heading` | Títulos de seção (font-display) |
| `--text-icon` | `1.25rem` | `text-icon` | Ícone "+" do add button |
| `--text-body` | `1rem` | `text-body` | Títulos de task, inputs |
| `--text-subtext` | `0.9375rem` | `text-subtext` | Datas, mensagens vazias, add button |
| `--text-small` | `0.875rem` | `text-small` | Descrições, labels, botões, links, status |
| `--text-tag` | `0.8125rem` | `text-tag` | Badges, section count |
| `--text-stat` | `1.875rem` | `text-stat` | Stat cards (day-summary) |

### Componente `<Text>`

Arquivo: `src/app/components/text.tsx` (Server Component)

Para texto estático com 3+ propriedades tipográficas bundled. Não usar para elementos interativos (links, buttons) — preferir utility `text-small` nesses casos.

**`label` vs `caption`**: `label` é para form labels (`font-medium`, `tracking-wider`). `caption` é para stat card captions (`tracking-wide`, sem `font-medium`).

| Variant | Classes | Default `as` | Default `muted` |
|---|---|---|---|
| `display` | `font-display text-display leading-none` | `h1` | false |
| `heading` | `font-display text-heading` | `h2` | false |
| `body` | `text-body` | `p` | false |
| `subtext` | `text-subtext` | `p` | true |
| `small` | `text-small` | `span` | false |
| `label` | `text-small font-medium uppercase tracking-wider` | `span` | true |
| `caption` | `text-small uppercase tracking-wide` | `span` | true |
| `stat` | `text-stat font-semibold tabular-nums` | `span` | false |

Props adicionais: `as` (elemento HTML), `muted` (cor muted), `accent` (cor accent), `className`.

---

## Spacing & Layout

### Container principal

`max-w-[42rem] mx-auto py-8 px-6` (Tailwind inline)

### Gaps padrão

| Contexto | Valor |
|---|---|
| Entre seções | `2rem` (margin-top) |
| Dentro de task-item | `0.75rem` (gap) |
| Form fields | `0.75rem` (gap) |
| Form row (side-by-side) | `1rem` (gap) |
| Form actions | `0.75rem` (gap) |
| Section title → content | `0.75rem` (margin-bottom) |
| Badge padding | `0.125rem 0.5rem` |

### Grid (stats)

```
mobile:  grid-cols-2 gap-3
sm:      grid-cols-4 gap-4
```

---

## Componentes

### Buttons

Todos os estilos vivem inline via Tailwind utilities nos componentes TSX.

**Submit (primário)**: `text-small font-medium text-white bg-accent border-none rounded-md py-1.5 px-4 transition-[background] duration-200 hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed`

**Cancel (ghost)**: `text-small text-muted bg-transparent border-none py-1.5 px-3 hover:text-stone-900`

**Action (icon button)**: `flex items-center justify-center w-7 h-7 rounded-md text-border bg-transparent border-none transition-all duration-200 shrink-0 group-hover:text-muted` + `data-action-btn` para touch target
- Edit variant: + `hover:text-muted hover:bg-border`
- Delete variant: + `hover:text-red-600 hover:bg-red-50`

**Add task (full-width ghost)**: `flex items-center gap-2 w-full py-3.5 text-subtext text-muted bg-transparent border-0 border-b border-border transition-colors duration-200 hover:text-accent`

### Inputs

Estilo underline — sem bordas laterais, sem background.

`w-full py-2 text-body bg-transparent border-0 border-b border-border outline-none text-stone-900 transition-[border-color] duration-200 focus:border-b-accent placeholder:text-muted`

Small variant: trocar `text-body` por `text-small`

### Cards

`bg-white border border-border rounded-xl p-4`

### Badges

`text-tag font-medium px-2 py-0.5 rounded-full bg-border text-muted whitespace-nowrap`

Carry-over variant: `bg-amber-100 text-amber-800` (sobrescreve bg e text)

### Tag Badges

Arquivo: `src/app/components/tag-badge.tsx`

Renders a tag with its pastel color. Colors use inline `style` from `TAG_COLORS` map (not Tailwind classes). Uses `text-xs` instead of `text-tag` because `tailwind-merge` strips unrecognized custom font-size tokens.

`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap inline-flex items-center gap-1` + inline `style={{ background, color }}` from color map.

Prop `onRemove` shows a 14×14 × button (SVG, opacity 0.6 → 1 on hover).

**Tag color palette** (10 predefined pastel colors in `src/lib/tags/colors.ts`):

| Key | Background | Text |
|---|---|---|
| `rose` | `#FECDD3` | `#9F1239` |
| `orange` | `#FED7AA` | `#9A3412` |
| `amber` | `#FDE68A` | `#854D0E` |
| `lime` | `#D9F99D` | `#3F6212` |
| `emerald` | `#A7F3D0` | `#065F46` |
| `sky` | `#BAE6FD` | `#075985` |
| `blue` | `#BFDBFE` | `#1E40AF` |
| `violet` | `#E9D5FF` | `#6B21A8` |
| `pink` | `#FBCFE8` | `#9D174D` |
| `stone` | `#E7E5E4` | `#44403C` |

### Tags Input

Arquivo: `src/app/components/tags-input.tsx` (Client Component)

Input for selecting/creating tags in task forms. Underline input container with tag chips + autocomplete dropdown.

**Container**: `flex flex-wrap items-center gap-1.5 py-1.5 border-0 border-b border-border min-h-[36px]` + `focus-within:border-b-accent`

**Dropdown**: `bg-white border border-border rounded-lg shadow-md z-20`. Items: color dot + name, highlighted match text. "Criar tag" option with inline color picker (10 circles).

Max 5 tags per task. Keyboard: arrows, enter, backspace, escape.

### Tooltip

Arquivo: `src/app/components/tooltip.tsx` (Client Component)

Wrapper sobre `@radix-ui/react-tooltip`. Usado para dar contexto visual a ícones e botões.

| Prop | Tipo | Default | Uso |
|---|---|---|---|
| `children` | `ReactNode` | — | Elemento trigger (usa `asChild`) |
| `content` | `string` | — | Texto exibido no tooltip |
| `side` | `"top" \| "bottom" \| "left" \| "right"` | `"top"` | Posição preferida |

**Estilo**: `bg-stone-900 text-white text-[0.8125rem] rounded-md px-2.5 py-1` com `sideOffset={6}`

**Animação**: fade + scale via `animate-tooltip-in` / `animate-tooltip-out` (200ms / 150ms)

**Provider**: `<TooltipProvider delayDuration={300}>` em `src/app/providers.tsx`

**Touch devices**: Radix desabilita tooltips automaticamente em pointer coarse (mobile).

### Collapsible

Arquivo: `src/app/components/collapsible.tsx` (Client Component)

Wrapper sobre `@radix-ui/react-collapsible`. Usado para seções expansíveis (ex: dias no histórico).

**Exports**:

| Componente | Base Radix | Uso |
|---|---|---|
| `Collapsible` | `Root` | Container — aceita `open`, `onOpenChange`, `asChild` |
| `CollapsibleTrigger` | `Trigger` | Elemento clicável que alterna open/close |
| `CollapsibleContent` | `Content` | Conteúdo colapsável com animação |

**Animação**: height + opacity via `animate-collapsible-open` / `animate-collapsible-close` (200ms ease). Usa `--radix-collapsible-content-height` (injetada automaticamente pelo Radix).

**Padrão de chevron**: SVG 14×14, `rotate-180` no estado aberto, `transition-transform duration-200`. Cor `text-muted`.

### NavMenu (navegação global)

Arquivo: `src/app/components/nav-menu.tsx` (async Server Component)

Links de navegação (Home, History, Upcoming, Recurring) + avatar do usuário. Presente em todas as páginas autenticadas. Busca user data internamente via `getCurrentUser()` (cached).

| Prop | Tipo | Uso |
|---|---|---|
| `activePath` | `"/" \| "/history" \| "/upcoming" \| "/recurring" \| "/profile"` | Indica a página ativa — link correspondente recebe estilo `text-stone-900` |

**Link ativo**: `text-stone-900` (texto primário, sem hover effect)
**Links inativos**: `text-small text-muted transition-colors duration-200 hover:text-accent`
**Avatar**: substitui o antigo "Sign out" — `<UserAvatar>` dentro de `<Link href="/profile">` com `aria-label="Profile"`
**Spacing**: `gap-3 sm:gap-4`, `items-center` (alinha avatar com texto)

### UserAvatar

Arquivo: `src/app/components/user-avatar.tsx` (Server Component)

Avatar circular do usuário com 3 níveis de fallback.

| Prop | Default | Uso |
|---|---|---|
| `name` | `null` | Nome do usuário (para iniciais no fallback) |
| `image` | `null` | URL da foto (Google OAuth) |
| `size` | `24` | Dimensão em px (width/height) |

**Prioridade de renderização**:
1. Com `image`: `<img>` circular, `referrerPolicy="no-referrer"` (necessário para Google photos)
2. Sem `image`, com `name`: iniciais (1ª letra do 1º e último nome) em círculo `bg-border text-muted`
3. Sem nada: ícone SVG silhueta genérica em `bg-border text-muted`

### Checkbox (circular)

`w-5 h-5 rounded-full border-2 border-border flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200 bg-transparent hover:border-accent`

Checked: + `border-accent bg-accent text-white` (via `cn()` condicional)

### Task item

`flex items-start gap-3 py-3.5 border-b border-border transition-transform duration-200 hover:translate-x-0.5`

Completed: + `opacity-60` (via `cn()` condicional)

Action buttons ficam invisíveis e aparecem no hover do task-item (desktop) via `group` / `group-hover:text-muted`.

---

## Interações

- **TODAS** as transições: `200ms ease` — nunca mais, nunca menos
- Task item hover: `translateX(2px)`
- Links/buttons hover: mudança de cor (muted → accent ou stone-900)
- Progress circle: `transition-all 700ms ease-out` (exceção única)

### Mobile (`@media (hover: none)`)

- Action buttons sempre visíveis com `opacity: 0.5` (via `[data-action-btn]` selector no globals.css — única regra CSS customizada restante)
- Sem efeitos de hover

---

## Responsividade

- **Breakpoint único**: `sm:` (640px via Tailwind)
- Padrão: `flex-col` → `sm:flex-row`
- Stats grid: `grid-cols-2` → `sm:grid-cols-4`

---

## Ícones

- SVG inline — sem icon libraries externas
- Action icons: `14x14`
- Checkmark: `12x12`
- Status (history): Unicode — `✓` (completed), `—` (pending), `↗` (skipped)
- Carry-over: `↗`
- Recurring: `↻`

### Ilustrações de Empty State

Arquivo: `src/app/components/empty-state-illustrations.tsx`

SVGs decorativos exibidos quando uma lista está vazia. Todas seguem regras consistentes:

**Shared props** (objeto `shared`): `width=64 height=64 viewBox="0 0 64 64" fill=none strokeWidth=1.5 strokeLinecap=round strokeLinejoin=round`

**Regras de consistência**:

| Regra | Detalhe |
|---|---|
| Cor base | `currentColor` (`#E7E5E4` via parent) — formas principais visíveis contra fundo `#F7F6F3` |
| Detalhe accent | Cada ícone tem **exatamente um detalhe** em `var(--color-accent)` semanticamente relevante |
| Peso visual | Elementos grandes o suficiente (círculos r=18–20, retângulos ~14×14+) para não desaparecerem |
| Centralização | Composição centrada no viewBox 64×64 |

**Padrão de arrowhead para setas circulares** (baseado em Lucide/Feather): arco SVG conectado a uma ponta em formato "L" (duas linhas perpendiculares). O arco termina exatamente no canto do L — nunca usar chevron desconectado.

**Ícones atuais**:

| Ícone | Forma base | Detalhe accent |
|---|---|---|
| AllClear | Círculo r=20 + 4 shine lines | Checkmark dentro do círculo |
| NoCompleted | 2 checkboxes 14×14 + linhas de texto | Dash horizontal dentro do primeiro checkbox |
| NoUpcoming | Calendário (retângulo + header + presilhas + dots) | Presilhas + todos os day dots |
| NoHistory | Relógio (círculo r=20 + 4 tick marks nos eixos) | Ponteiro único (~2h) + center dot |
| NoRecurring | Arco ~300° r=18 com bezier para arrowhead | L-shaped arrowhead no upper-right |

---

## Acessibilidade

- `aria-label` obrigatório em todos os botões interativos
- `aria-hidden="true"` em ícones decorativos
- Semantic HTML: `<main>`, `<header>`, `<section>`, `<form>`
- `<button type="submit">` em formulários (nunca `<div>` clicável)

---

## Login page

- Layout: flex centralizado (min-h-screen items-center justify-center)
- Logo: DaylogIcon size 64
- Título: font-display, text-5xl
- Subtítulo: stone-500
- Botão sign-in: bg stone-900, color white, border-radius lg, hover stone-800
