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

### NavMenu (navegação global)

Arquivo: `src/app/components/nav-menu.tsx` (Server Component)

Links de navegação (History, Upcoming, Recurring) + Sign out. Presente em todas as páginas autenticadas.

| Prop | Default | Uso |
|---|---|---|
| `showHome` | `true` | Na Home page, passar `false` para não mostrar self-link |

**Estilo dos links**: `text-small text-muted transition-colors duration-200 hover:text-accent` (inline)
**Sign out hover**: `hover:text-stone-600` (diferenciado dos links de navegação)
**Spacing**: `gap-3 sm:gap-4`

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
