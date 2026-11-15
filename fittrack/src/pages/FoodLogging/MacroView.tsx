import { MACRO_COLORS, type Macros } from "./food";

const MACRO_LABELS = [
  { key: "carbs", label: "Carbs", short: "C" },
  { key: "protein", label: "Protein", short: "P" },
  { key: "fat", label: "Fat", short: "F" },
] as const;

export const MacroView = ({ macros }: { macros: Macros }) => (
  <div className="grid grid-cols-4 items-center gap-x-3 text-sm tabular-nums">
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
  if (total === 0) return <div className="h-1.5 bg-muted" />;

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
