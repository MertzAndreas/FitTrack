import { CaloriesCard } from "@/pages/FoodLogging/CaloriesCard";
import { FoodLoggingOverview } from "@/pages/FoodLogging/FoodLoggingOverview";
import { DayNavigator } from "./FoodLogging/DayNavigator";
import { useDayBlocks } from "./FoodLogging/use-food-logging";
import { useDaySwipe } from "./FoodLogging/use-day-swipe";
import { useSelectedDay } from "./FoodLogging/use-selected-day";

const Dashboard = () => {
  const { dateKey } = useSelectedDay();
  const { data: blocks } = useDayBlocks(dateKey);
  const swipeHandlers = useDaySwipe();

  return (
    <div
      className="w-full flex flex-col gap-4 md:p-4 mx-auto max-w-6xl touch-pan-y"
      {...swipeHandlers}
    >
      <DayNavigator />
      <CaloriesCard blocks={blocks || []} />
      <FoodLoggingOverview key={dateKey} blocks={blocks || []} />
    </div>
  );
};

export default Dashboard;
