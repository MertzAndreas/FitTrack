import { CaloriesCard } from "@/pages/FoodLogging/CaloriesCard";
import { FoodLoggingOverview } from "@/pages/FoodLogging/FoodLoggingOverview";
import { MOCK_MEALS } from "./FoodLogging/food";

const Dashboard = () => {
  const meals = MOCK_MEALS;
  return (
    <div className="w-full flex flex-col gap-4 md:p-4 mx-auto max-w-6xl">
      <CaloriesCard meals={meals} />
      <FoodLoggingOverview meals={meals} />
    </div>
  );
};

export default Dashboard;
