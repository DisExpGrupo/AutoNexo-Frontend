# AGENTS.md

## Stack

Vue 3.5 + Vite 5 + TypeScript 5.5 + PrimeVue 4 (Material theme) + Pinia + Vue Router 4 + Tailwind CSS 3

## Package manager

**pnpm** — use `pnpm install`, not npm/yarn. Lockfile: `pnpm-lock.yaml`.

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Start Vite dev server |
| `pnpm build` | Typecheck (`vue-tsc`) then production build (`vite build`) |
| `pnpm preview` | Preview production build locally |
| `pnpm test` | Run Vitest (watch mode by default) |
| `pnpm test run` | Run Vitest once (CI mode) |

## Path alias

`@/` resolves to `./src/` in both TypeScript (`tsconfig.json`) and Vite (`vite.config.ts`).

## Testing

- Vitest with `jsdom` environment, `globals: true` (no need to import `describe`/`it`/`expect`).
- Pinia stores require `setActivePinia(createPinia())` in `beforeEach`.
- Tests live in `src/__tests__/`.

## Architecture

- `src/main.ts` — entry point; mounts app with Pinia, Vue Router, PrimeVue (Material theme, dark mode via `.dark-mode` selector).
- `src/router/index.ts` — Vue Router with `createWebHistory`.
- `src/stores/` — Pinia stores using setup (composition API) syntax.
- `src/views/` — Route-level components.
- `src/App.vue` — Root component wrapping `<RouterView>`.

## Conventions

- No linter or formatter is configured. Follow existing file style.
- TypeScript strict mode with `noUnusedLocals` and `noUnusedParameters` enabled — unused vars will fail the build.
- PrimeVue components are imported individually (e.g. `import Button from 'primevue/button'`).

## Design

- See `DESIGN.md` for design tokens (colors, typography, spacing, shapes). Implement tokens as CSS variables in `src/style.css` and reference via Tailwind/PrimeVue.
