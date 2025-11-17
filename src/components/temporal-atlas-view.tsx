"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getRegionYears, getRegionDataForYear, RegionYearlyTemperatureData } from '@/lib/region-data';

import MapComponent from '@/components/map-component';
import YearSlider from '@/components/year-slider';
import TemperatureLegend from '@/components/temperature-legend';

export default function TemporalAtlasView() {
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | undefined>();
  const [temperatureData, setTemperatureData] = useState<RegionYearlyTemperatureData | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const availableYears = await getRegionYears();
        setYears(availableYears);
        if (availableYears.length > 0) {
          const initialYear = availableYears[0];
          setSelectedYear(initialYear);
          const initialData = await getRegionDataForYear(initialYear);
          setTemperatureData(initialData);
        }
      } catch (error) {
        console.error("Failed to load regional temperature data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (selectedYear === undefined) return;

    async function updateDataForYear() {
      setIsLoading(true);
      try {
        const data = await getRegionDataForYear(selectedYear!);
        setTemperatureData(data);
      } catch (error) {
        console.error(`Failed to load data for year ${selectedYear}:`, error);
      } finally {
        setIsLoading(false);
      }
    }

    updateDataForYear();
  }, [selectedYear]);

  return (
    <div className="relative h-[100svh] w-full overflow-hidden bg-background">
      <MapComponent regionTemperatureData={temperatureData} />

      <header className="absolute top-0 left-0 w-full p-4 md:p-6">
        <h1 className="text-3xl md:text-5xl font-headline font-bold text-white [text-shadow:_0_2px_6px_rgb(0_0_0_/_60%)]">
          Temporal Atlas
        </h1>
      </header>

      <footer className="absolute bottom-0 left-0 w-full p-4">
        <Card className="max-w-3xl mx-auto bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4 flex flex-col md:flex-row items-center gap-6">
            {isLoading || !selectedYear || years.length === 0 ? (
              <div className="w-full h-10 flex items-center justify-center text-muted-foreground">
                Loading data...
              </div>
            ) : (
              <YearSlider
                years={years}
                value={selectedYear}
                onValueChange={setSelectedYear}
              />
            )}
            <TemperatureLegend />
          </CardContent>
        </Card>
      </footer>
    </div>
  );
}
