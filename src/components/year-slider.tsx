"use client";

import { Slider } from "@/components/ui/slider";
import { useMemo } from "react";

type YearSliderProps = {
  years: number[];
  value: number;
  onValueChange: (year: number) => void;
  isLoading?: boolean;
};

export default function YearSlider({ years, value, onValueChange, isLoading }: YearSliderProps) {
  const valueIndex = useMemo(() => {
    const index = years.indexOf(value);
    return index === -1 ? 0 : index;
  }, [years, value]);

  const handleSliderChange = (newIndex: number[]) => {
    onValueChange(years[newIndex[0]]);
  };
  
  return (
    <div className="w-full flex-grow px-4 md:px-0">
      <Slider
        value={[valueIndex]}
        onValueChange={handleSliderChange}
        min={0}
        max={years.length - 1}
        step={1}
        disabled={isLoading}
      />
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
        <span>{years[0]}</span>
        <span className="font-bold text-base text-foreground -mt-1">{value}</span>
        <span>{years[years.length - 1]}</span>
      </div>
    </div>
  );
}