"use client";

import { useState, useEffect, useCallback, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getRegionYears, getRegionDataForYear, RegionYearlyTemperatureData } from '@/lib/region-data';

import MapComponent from '@/components/map-component';
import YearSlider from '@/components/year-slider';
import TemperatureLegend from '@/components/temperature-legend';

export default function TemporalAtlasView() {
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | undefined>();
  const [temperatureData, setTemperatureData] = useState<RegionYearlyTemperatureData | undefined>();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isDataLoading, startDataTransition] = useTransition();

  // Effect for initial data load (years and first year's temp data)
  useEffect(() => {
    async function loadData() {
      try {
        const availableYears = await getRegionYears();
        setYears(availableYears);
        if (availableYears.length > 0) {
          const defaultYear = 2014;
          const initialYear = availableYears.includes(defaultYear) 
            ? defaultYear 
            : availableYears[Math.floor(availableYears.length / 2)];
          
          setSelectedYear(initialYear);
          const initialData = await getRegionDataForYear(initialYear);
          setTemperatureData(initialData);
        }
      } catch (error) {
        console.error("Failed to load regional temperature data:", error);
      } finally {
        setIsInitialLoading(false);
      }
    }
    loadData();
  }, []);

  const handleYearChange = useCallback((year: number) => {
    // Update the slider's visual state immediately
    setSelectedYear(year);
    
    // Fetch the new data in a transition to avoid blocking the UI
    startDataTransition(async () => {
      try {
        const data = await getRegionDataForYear(year);
        setTemperatureData(data);
      } catch (error) {
        console.error(`Failed to load data for year ${year}:`, error);
        // Optionally, handle the error in the UI, e.g., show a toast
      }
    });
  }, []);
  
  const handleSliderCommit = useCallback((year: number) => {
    // This function will be called when the user releases the slider
    handleYearChange(year);
  }, [handleYearChange]);


  return (
    <div className="relative h-[100svh] w-full overflow-hidden bg-background">
      <div className={`absolute inset-0 z-10 bg-background/50 transition-opacity duration-300 ${isDataLoading ? 'opacity-100' : 'opacity-0'} pointer-events-none`} />
      <MapComponent regionTemperatureData={temperatureData} />

      <header className="absolute top-0 left-0 w-full p-4 md:p-6 z-20">
        <h1 className="text-3xl md:text-5xl font-headline font-bold text-white [text-shadow:_0_2px_6px_rgb(0_0_0_/_60%)]">
          Temporal Atlas
        </h1>
      </header>

      <footer className="absolute bottom-0 left-0 w-full p-4 z-20">
        <Card className="max-w-3xl mx-auto bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4 flex flex-col md:flex-row items-center gap-6">
            {isInitialLoading || !selectedYear || years.length === 0 ? (
              <div className="w-full h-10 flex items-center justify-center text-muted-foreground">
                Loading data...
              </div>
            ) : (
              <YearSlider
                years={years}
                value={selectedYear}
                onValueChange={handleYearChange}
                onValueCommit={handleSliderCommit}
                isLoading={isDataLoading}
              />
            )}
            <TemperatureLegend />
          </CardContent>
        </Card>
      </footer>
    </div>
  );
}
