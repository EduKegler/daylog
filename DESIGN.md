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

### Escala de tamanhos

| Tamanho | Rem | Onde é usado |
|---|---|---|
| App title | `2rem` | `.app-title` |
| History day title | `1.125rem` | `.history-day-title` (font-display) |
| Add icon | `1.125rem` | `.add-icon` |
| Today date, empty msg | `0.875rem` | `.today-date`, `.empty-message`, `.add-task-btn` |
| Task title, input | `0.9375rem` | `.task-title`, `.task-input` |
| Task description, small input, buttons, pagination | `0.8125rem` | `.task-description`, `.task-input.small`, `.btn-cancel`, `.btn-submit`, `.pagination-link`, `.history-status-icon` |
| Section title, stats, history day stats, recurring badge | `0.75rem` | `.section-title`, `.section-count`, `.history-day-stats`, `.upcoming-relative`, `.task-badge.recurring` |
| Badge | `0.6875rem` | `.task-badge` |

---

## Spacing & Layout

### Container principal

```css
.dashboard {
  max-width: 42rem;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}
```

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

**Submit (primário)**
```css
font-size: 0.8125rem; font-weight: 500;
background: var(--color-accent); color: white;
border: none; border-radius: 0.375rem;
padding: 0.375rem 1rem;
/* hover */ background: var(--color-accent-hover);
/* disabled */ opacity: 0.5; cursor: not-allowed;
```

**Cancel (ghost)**
```css
font-size: 0.8125rem;
background: none; border: none;
color: var(--color-muted);
padding: 0.375rem 0.75rem;
/* hover */ color: var(--color-stone-900);
```

**Action (icon button)**
```css
width: 1.75rem; height: 1.75rem;
border-radius: 0.375rem;
background: transparent; border: none;
color: var(--color-border);
/* hover */ color: var(--color-muted); background: var(--color-border);
/* delete hover */ color: #DC2626; background: #FEF2F2;
```

**Add task (full-width ghost)**
```css
width: 100%; padding: 0.875rem 0;
font-size: 0.875rem; color: var(--color-muted);
background: none; border: none;
border-bottom: 1px solid var(--color-border);
/* hover */ color: var(--color-accent);
```

### Inputs

Estilo underline — sem bordas laterais, sem background.

```css
width: 100%; padding: 0.5rem 0;
font-size: 0.9375rem;
background: transparent; border: none;
border-bottom: 1px solid var(--color-border);
outline: none; color: var(--color-stone-900);
/* focus */ border-bottom-color: var(--color-accent);
/* placeholder */ color: var(--color-muted);
/* small variant */ font-size: 0.8125rem;
```

### Cards

```css
background: white;
border: 1px solid var(--color-border);
border-radius: 0.75rem;
padding: 1rem;
```

### Badges

```css
font-size: 0.6875rem; font-weight: 500;
padding: 0.125rem 0.5rem;
border-radius: 9999px;
background: var(--color-border);
color: var(--color-muted);
```

### Checkbox (circular)

```css
width: 1.25rem; height: 1.25rem;
border-radius: 50%;
border: 2px solid var(--color-border);
background: transparent;
/* hover */ border-color: var(--color-accent);
/* checked */ border-color: var(--color-accent);
             background: var(--color-accent); color: white;
```

### Task item

```css
display: flex; align-items: flex-start; gap: 0.75rem;
padding: 0.875rem 0;
border-bottom: 1px solid var(--color-border);
/* hover */ transform: translateX(2px);
/* completed */ opacity: 0.6;
```

Action buttons ficam invisíveis e aparecem no hover do task-item (desktop).

---

## Interações

- **TODAS** as transições: `200ms ease` — nunca mais, nunca menos
- Task item hover: `translateX(2px)`
- Links/buttons hover: mudança de cor (muted → accent ou stone-900)
- Progress circle: `transition-all 700ms ease-out` (exceção única)

### Mobile (`@media (hover: none)`)

- Action buttons sempre visíveis com `opacity: 0.5`
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
