import type { WeightEntry } from "./types";
import { BmiCard } from "./Stats/BmiCard";
import { GoalProgressCard } from "./Stats/GoalProgressCard";
import { HistoryCard } from "./Stats/HistoryCard";
import { TrendsCard } from "./Stats/TrendsCard";

// TODO: replace with real values once goal/height are part of the model.
const MOCK_GOAL_KG = 100;
const MOCK_HEIGHT_CM = 190;

const WeightStats = ({
  data,
  goalKg = MOCK_GOAL_KG,
  goalStartKg,
  heightCm = MOCK_HEIGHT_CM,
}: {
  data: WeightEntry[];
  goalKg?: number;
  goalStartKg?: number;
  heightCm?: number;
}) => {
  if (data.length === 0) return null;

  const entriesByDate = [...data].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <GoalProgressCard
        entries={entriesByDate}
        goalKg={goalKg}
        startKg={goalStartKg}
      />
      <BmiCard
        entries={entriesByDate}
        goalKg={goalKg}
        heightCm={heightCm}
      />
      <TrendsCard entries={entriesByDate} />
      <HistoryCard entries={entriesByDate} />
    </div>
  );
};

export default WeightStats;
