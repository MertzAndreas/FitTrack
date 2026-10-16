# FitTrack

Personal fitness tracker. **Single user, no auth, no multi-tenancy.** Mobile-first PWA.

**Current stage: frontend-first.** The frontend is fully mocked — no API calls. The backend has
a data model and schema (`Backend/Model/`, `Backend/Data/`) but no endpoints yet. Build the UI
against mock data; wire it up when endpoints exist.

## Layout

```
Frontend/        React 19 + Vite + TS. shadcn/ui on Base UI. Tailwind v4.
Backend/         .NET 10 minimal API. EF Core + SQLite. Serves the built frontend.
Dockerfile       3-stage: pnpm build -> dotnet publish -> chiseled runtime.
docker-compose   Mounts ./data -> /data, SQLite at /data/fittrack.db.
```

Frontend package manager is **pnpm**. Always run commands from `Frontend/`.

```bash
cd Frontend
pnpm dev          # local
pnpm dev --host   # test on phone over LAN
pnpm lint && pnpm build   # run both before committing
```

## Hard constraints

Things that are easy to get wrong and produce confusing failures.

- **Base UI, not Radix.** shadcn here uses `@base-ui/react/*`. Use `render={<X />}` to
  compose, **not** `asChild`. APIs differ from Radix docs/examples you may have seen.
- **Unused imports are build errors.** `noUnusedLocals` + `TreatWarningsAsErrors` are on.
- **Do not hand-edit `src/components/ui/*`.** Those are vendored shadcn files. If one
  fails lint or types, add an exemption in `eslint.config.js` (see `src/components/ui/**`
  and `src/hooks/**` entries there) rather than patching the file. A hand-patched
  `sidebar.tsx` had to be reverted once already.
- **`Card` is `display: grid`**, so `flex-row` alone does nothing — you must set `flex`.
- **`Card` padding is the `--card-spacing` token**, not plain padding. `Card` =
  `--spacing(8)` (32px), `size="sm"` = `--spacing(5)` (20px). To neutralise it (e.g. for
  a nested card) override the token: `className="[--card-spacing:0px]"`.
- **Nested cards compound.** A card inside a card gets both paddings; on a phone that
  eats the row width fast. This is why hero sections use `size="sm"`.

## Decisions already made

Settled. Don't re-litigate without a reason.

- **Theme is hand-rolled** in `src/hooks/use-theme.tsx`. `next-themes` is deliberately
  not a dependency. The `.dark` class lives on `<html>`, set before paint by an inline
  script in `index.html` to avoid a flash.
- **Meal data model** (`src/lib/meals.ts`): a `Food` carries nutrition per `base` amount
  (100g/100ml). A `MealItem` is only `{ foodId, amount }` — **kcal is never stored or
  hand-entered, it is always derived** via `macrosFor()`. Day and block totals are
  derived too, so the ring and the meal list can never disagree.
- **Serving sizes are deferred** until a DB schema exists. `base` + `unit` are fields, so
  adding them later is additive, not a rewrite.
- **Meal edits are in-memory only** (`useState`) and reset on reload. Expected at this stage.
- **Add and edit are separate components** (`meal-item-add-sheet.tsx` vs
  `meal-item-edit-sheet.tsx`). They share only `meal-amount-fields.tsx`. Keep them
  separate even though they look similar.
- **`FoodRow`** (`src/components/food-row.tsx`) is shared between the search list and the
  overview. If the two ever need to look different, split it rather than adding props.
- **Day navigation is hardcoded**: "Today" is the last mock entry, not `new Date()`.
  `MonthGrid`'s `month`/`year` are hardcoded and do not follow the selected day yet.

## Conventions

- **Mobile-first.** Design and test at phone width; add `sm:`/`md:` for larger screens.
  Touch targets should be comfortable (>= ~36px). Hover-only affordances are broken on
  touch — anything destructive needs a visible control or a confirm dialog.
- **`pnpm lint && pnpm build` before every commit.**
- Commit messages: short, sentence case, no prefix.
  e.g. `Meal logging with food entries and daily tracking`
- Prefer editing in place over creating new abstractions. Don't add a shared component
  until two call sites are genuinely identical.

## Parked / open

- Swipe gestures for day navigation (discussed, not built).
- Serving sizes per food (waiting on DB).
- Real backend + DB schema. The SQLite path is `/data/fittrack.db` per `docker-compose.yml`.
