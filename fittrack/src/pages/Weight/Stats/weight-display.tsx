import { Minus, TrendingDown, TrendingUp } from "lucide-react";

const formatSigned = (value: number) => (value > 0 ? `+${value}` : `${value}`);

export const WeightWithUnit = ({
  kg,
  unit = "kg",
  signed = false,
}: {
  kg: number;
  unit?: string;
  signed?: boolean;
}) => (
  <p className="text-2xl font-bold tracking-tight">
    {signed ? formatSigned(kg) : kg}{" "}
    <span className="text-sm font-normal text-muted-foreground">{unit}</span>
  </p>
);

export const ChangeDirectionIcon = ({ changeKg }: { changeKg: number }) => {
  if (changeKg < 0) return <TrendingDown className="size-6 text-emerald-500" />;
  if (changeKg > 0) return <TrendingUp className="size-6 text-rose-500" />;
  return <Minus className="size-6 text-muted-foreground" />;
};
