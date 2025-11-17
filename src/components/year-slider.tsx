"use client";

import { Slider } from "@/components/ui/slider";
import { useMemo } from "react";

type YearSliderProps = {
  years: number[];
  value: number;
  onValueChange: (year: number) => void;
};

export default function YearSlider({ years, value, onValueChange }: YearSliderProps) {
  const valueIndex = useMemo(() => years.indexOf(value), [years, value]);

  const handleSliderChange = (newIndex: number[]) => {
    onValueChange(years[newIndex[0]]);
  };

  return (
    <div className="w-full flex-grow">
      <Slider
        value={[valueIndex]}
        onValueChange={handleSliderChange}
        min={0}
        max={years.length - 1}
        step={1}
      />
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
        {years.map((year) => (
          <span key={year} className="transform -translate-x-1/2">
            {year}
          </span>
        ))}
      </div>
    </div>
  );
}
