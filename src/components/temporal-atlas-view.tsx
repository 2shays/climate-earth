"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { mockTemperatureData, MOCK_YEARS, TemperaturePoint } from '@/lib/data';

import MapComponent from '@/components/map-component';
import YearSlider from '@/components/year-slider';
import TemperatureLegend from '@/components/temperature-legend';

export default function TemporalAtlasView() {
  const [selectedYear, setSelectedYear] = useState(MOCK_YEARS[0]);

  const temperatureData = useMemo(() => {
    return mockTemperatureData.find(d => d.year === selectedYear)?.data || [];
  }, [selectedYear]);

  return (
    <div className="relative h-[100svh] w-full overflow-hidden bg-background">
      <MapComponent temperatureData={temperatureData} />

      <header className="absolute top-0 left-0 w-full p-4 md:p-6">
        <h1 className="text-3xl md:text-5xl font-headline font-bold text-white [text-shadow:_0_2px_6px_rgb(0_0_0_/_60%)]">
          Temporal Atlas
        </h1>
      </header>

      <footer className="absolute bottom-0 left-0 w-full p-4">
        <Card className="max-w-3xl mx-auto bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4 flex flex-col md:flex-row items-center gap-6">
            <YearSlider
              years={MOCK_YEARS}
              value={selectedYear}
              onValueChange={setSelectedYear}
            />
            <TemperatureLegend />
          </CardContent>
        </Card>
      </footer>
    </div>
  );
}
