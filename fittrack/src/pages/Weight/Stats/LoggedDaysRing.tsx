import { differenceInDays, startOfDay } from "date-fns";

import { ProgressRing } from "@/components/ProgressRing";

import type { WeightEntry } from "../types";

function computeLoggingConsistency(entriesByDate: WeightEntry[]) {
  const firstEntry = entriesByDate[0];
  const lastEntry = entriesByDate[entriesByDate.length - 1];

  const loggedDays = new Set(
    entriesByDate.map((entry) => startOfDay(entry.date).getTime()),
  ).size;
  const totalDays = Math.max(
    1,
    differenceInDays(startOfDay(lastEntry.date), startOfDay(firstEntry.date)) +
      1,
  );
  const percentLogged = Math.min(
    100,
    Math.round((loggedDays / totalDays) * 100),
  );

  return { loggedDays, totalDays, percentLogged };
}

export const LoggedDaysRing = ({ entries }: { entries: WeightEntry[] }) => {
  if (entries.length === 0) return null;

  const { loggedDays, totalDays, percentLogged } =
    computeLoggingConsistency(entries);

  return (
    <ProgressRing
      percent={percentLogged}
      label={`${percentLogged}%`}
      sublabel={`${loggedDays}/${totalDays}`}
      ariaLabel={`${percentLogged}% of days logged (${loggedDays} of ${totalDays})`}
      color="var(--vivid-1)"
      size="compact"
    />
  );
};
