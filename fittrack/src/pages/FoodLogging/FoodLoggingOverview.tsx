import { EllipsisVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Meal } from "./food";
import { MealBlock } from "./MealBlock";

type FoodLoggingOverviewProps = {
  meals: Meal[];
};

export const FoodLoggingOverview = ({ meals }: FoodLoggingOverviewProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0">
      <CardTitle>Food logging</CardTitle>
      <Button variant="ghost" size="icon" aria-label="Food logging options">
        <EllipsisVertical className="size-5" />
      </Button>
    </CardHeader>
    <CardContent className="flex flex-col gap-8">
      {meals.map((meal) => (
        <MealBlock key={meal.name} meal={meal} />
      ))}
    </CardContent>
  </Card>
);
