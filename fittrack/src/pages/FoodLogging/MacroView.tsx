import { MACRO_COLORS, MACRO_LABELS, type Macros } from "./food";

export const MacroView = ({ macros }: { macros: Macros }) => (
  <div className="flex items-center gap-x-4 text-sm tabular-nums">
    {MACRO_LABELS.map(({ key, label, short }) => (
      <span
        key={key}
        className="inline-flex items-center gap-1.5 text-muted-foreground"
        title={label}
      >
        <span
          aria-hidden
          className="size-2"
          style={{ backgroundColor: MACRO_COLORS[label] }}
        />
        <span className="sr-only">{label}</span>
        <span aria-hidden>{short}</span>
        <span className="text-foreground">{macros[key]}g</span>
      </span>
    ))}
    <span className="font-semibold text-foreground">{macros.kcal} kcal</span>
  </div>
);

// Thin proportional bar: how the meal splits between carbs / protein / fat.
export const MacroBar = ({ macros }: { macros: Macros }) => {
  const total = macros.carbs + macros.protein + macros.fat;
  if (total === 0) return null;

  return (
    <div
      className="flex h-1.5 w-full gap-0.5 overflow-hidden bg-muted"
      role="img"
      aria-label={`Carbs ${macros.carbs}g, protein ${macros.protein}g, fat ${macros.fat}g`}
    >
      {MACRO_LABELS.map(({ key, label }) => (
        <div
          key={key}
          className="h-full"
          style={{
            width: `${(macros[key] / total) * 100}%`,
            backgroundColor: MACRO_COLORS[label],
          }}
        />
      ))}
    </div>
  );
};
