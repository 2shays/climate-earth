
"use client";

import { Slider } from "@/components/ui/slider";
import { useMemo } from "react";

type YearSliderProps = {
  years: number[];
  value: number;
  onValueChange: (year: number) => void;
  onValueCommit: (year: number) => void;
  isLoading?: boolean;
};

export default function YearSlider({ years, value, onValueChange, onValueCommit, isLoading }: YearSliderProps) {
  const valueIndex = useMemo(() => {
    if (!years || years.length === 0 || typeof value !== 'number' || isNaN(value)) return 0;
    const index = years.indexOf(value);
    return index === -1 ? 0 : index;
  }, [years, value]);

  const handleSliderChange = (newIndex: number[]) => {
    if (years.length > 0) {
      onValueChange(years[newIndex[0]]);
    }
  };
  
  const handleSliderCommit = (newIndex: number[]) => {
    if (years.length > 0) {
      onValueCommit(years[newIndex[0]]);
    }
  };

  return (
    <div className="w-full flex-grow px-4 md:px-0">
      <Slider
        value={[valueIndex]}
        onValueChange={handleSliderChange}
        onValueCommit={handleSliderCommit}
        min={0}
        max={years.length > 0 ? years.length - 1 : 0}
        step={1}
        disabled={isLoading || years.length === 0}
      />
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
        <span>{years.length > 0 ? years[0] : ''}</span>
        <span className="font-bold text-base text-foreground -mt-1">{value}</span>
        <span>{years.length > 0 ? years[years.length - 1] : ''}</span>
      </div>
    </div>
  );
}
