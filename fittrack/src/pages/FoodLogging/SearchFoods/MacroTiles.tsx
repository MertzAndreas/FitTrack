import { MACRO_COLORS, MACRO_LABELS, type Macros } from "../food";

export const MacroTiles = ({ macros }: { macros: Macros }) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
    <div className="border bg-primary p-4 text-primary-foreground">
      <p className="text-xs font-semibold uppercase tracking-widest opacity-80">
        Calories
      </p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">
        {macros.kcal}
        <span className="ml-1 text-sm font-normal">kcal</span>
      </p>
    </div>
    {MACRO_LABELS.map(({ key, label }) => (
      <div key={key} className="border bg-muted/50 p-4">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <span
            aria-hidden
            className="size-2"
            style={{ backgroundColor: MACRO_COLORS[label] }}
          />
          {label}
        </p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">
          {macros[key]}g
        </p>
      </div>
    ))}
  </div>
);
