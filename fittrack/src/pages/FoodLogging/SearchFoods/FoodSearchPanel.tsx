import { Camera } from "lucide-react";
import type { RefObject } from "react";

import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { calculateItemMacros, type Food } from "../food";
import { ImageBox } from "../ImageBox";
import { MacroView } from "../MacroView";
import { useSearchFood } from "../use-food-logging";

type FoodSearchPanelProps = {
  inputRef: RefObject<HTMLInputElement | null>;
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (food: Food) => void;
  onOpenCamera: () => void;
};

export const FoodSearchPanel = ({
  inputRef,
  query,
  onQueryChange,
  onSelect,
  onOpenCamera,
}: FoodSearchPanelProps) => {
  const { data } = useSearchFood(query);

  return (
    <>
      <CardHeader>
        <CardTitle>Search foods</CardTitle>
        <div className="flex flex-row">
          <Input
            className="p-0 h-11"
            ref={inputRef}
            autoComplete="off"
            aria-label="Search foods"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && data?.[0] != null) onSelect(data[0]);
            }}
          />
          <Button onClick={onOpenCamera} size="lg" aria-label="Scan barcode">
            <Camera />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col divide-y bg-muted/50">
          {data?.map((food) => (
            <li key={food.id}>
              <button
                onClick={() => onSelect(food)}
                className="hover:bg-accent flex w-full flex-wrap items-center gap-x-3 gap-y-2 p-3 text-left"
              >
                <ImageBox img={food.img} alt={food.name} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{food.name}</span>
                </div>
                <MacroView
                  macros={calculateItemMacros({ food, quantity: 100 })}
                />
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </>
  );
};
