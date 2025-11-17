
"use client";

import { Slider } from "@/components/ui/slider";
import { useMemo } from "react";
import { Button } from "./ui/button";
import { Pause, Play } from "lucide-react";

type YearSliderProps = {
  years: number[];
  value: number;
  onValueChange: (year: number) => void;
  onValueCommit: (year: number) => void;
  isLoading?: boolean;
  isPlaying: boolean;
  onTogglePlay: () => void;
};

const PRE_INDUSTRIAL_END_YEAR = 1900;

export default function YearSlider({ years, value, onValueChange, onValueCommit, isLoading, isPlaying, onTogglePlay }: YearSliderProps) {
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

  const preIndustrialEndIndex = useMemo(() => years.indexOf(PRE_INDUSTRIAL_END_YEAR), [years]);
  const totalSteps = years.length > 1 ? years.length - 1 : 1;

  const preIndustrialMarkerPosition = preIndustrialEndIndex >= 0
    ? `${(preIndustrialEndIndex / totalSteps) * 100}%`
    : '0%';

  const showPreIndustrialLabel = years[0] < PRE_INDUSTRIAL_END_YEAR && years[years.length -1] > PRE_INDUSTRIAL_END_YEAR;

  const PlayIcon = useMemo(() => <Play className="h-6 w-6" />, []);
  const PauseIcon = useMemo(() => <Pause className="h-6 w-6" />, []);

  return (
    <div className="w-full flex-grow flex items-center gap-4 px-4 md:px-0">
      <Button variant="ghost" size="icon" onClick={onTogglePlay} disabled={isLoading || years.length === 0}>
        {isPlaying ? PauseIcon : PlayIcon}
        <span className="sr-only">{isPlaying ? "Pause" : "Play"}</span>
      </Button>
      <div className="flex-grow relative pt-4">
        <div className="relative">
          <Slider
            value={[valueIndex]}
            onValueChange={handleSliderChange}
            onValueCommit={handleSliderCommit}
            min={0}
            max={years.length > 0 ? years.length - 1 : 0}
            step={1}
            disabled={isLoading || years.length === 0}
          />
          {preIndustrialEndIndex > 0 && (
            <div 
              className="absolute top-0 h-2 rounded-l-full bg-green-500/50"
              style={{ width: preIndustrialMarkerPosition }}
              aria-hidden="true"
            />
          )}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2 relative">
          <span>{years.length > 0 ? years[0] : ''}</span>
          
          <span className="font-bold text-base text-foreground absolute left-1/2 -top-1 -translate-x-1/2">{value}</span>

          {showPreIndustrialLabel && (
            <span 
              className="absolute transform -translate-x-1/2 -bottom-4"
              style={{ left: preIndustrialMarkerPosition }}
            >
              {PRE_INDUSTRIAL_END_YEAR}
            </span>
          )}
          
          <span>{years.length > 0 ? years[years.length - 1] : ''}</span>
        </div>
      </div>
    </div>
  );
}
