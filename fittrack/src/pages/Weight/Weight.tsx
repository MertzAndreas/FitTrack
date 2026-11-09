import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeightForm } from "./WeightForm";
import { WeightChart } from "./WeightChart";

const Weight = () => {
  return (
    <div className="p-10 gap-10 flex flex-col">
      <WeightChart />
      <Card >
        <CardHeader>
          <CardTitle className="">Log Weight</CardTitle>
        </CardHeader>
        <CardContent>
          <WeightForm />
        </CardContent>
      </Card>
    </div>
  )
}

export default Weight;
