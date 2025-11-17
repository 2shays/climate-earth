
"use client";

import { useState, useEffect, useCallback, useTransition, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getCombinedYears, getCombinedDataForYear, Scenario } from '@/lib/region-data';

import MapComponent from '@/components/map-component';
import YearSlider from '@/components/year-slider';
import TemperatureLegend from '@/components/temperature-legend';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Separator } from './ui/separator';

const SCENARIOS: { id: Scenario, name: string }[] = [
    { id: 'SSP1', name: 'SSP1: Sustainability' },
    { id: 'SSP2', name: 'SSP2: Middle of the Road' },
];

export default function TemporalAtlasView() {
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | undefined>();
  const [selectedScenario, setSelectedScenario] = useState<Scenario>('SSP2');
  const [temperatureData, setTemperatureData] = useState<any>();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isDataLoading, startDataTransition] = useTransition();

  const loadInitialData = async (scenario: Scenario) => {
    setIsInitialLoading(true);
    try {
      const availableYears = await getCombinedYears(scenario);
      setYears(availableYears);
      if (availableYears.length > 0) {
        const defaultYear = 2014;
        const initialYear = availableYears.includes(defaultYear)
          ? defaultYear
          : availableYears[Math.floor(availableYears.length / 2)];
        
        setSelectedYear(initialYear);
        const initialData = await getCombinedDataForYear(scenario, initialYear);
        setTemperatureData(initialData);
      } else {
        setYears([]);
        setSelectedYear(undefined);
        setTemperatureData(undefined);
      }
    } catch (error) {
      console.error(`Failed to load initial data for scenario ${scenario}:`, error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData(selectedScenario);
  }, [selectedScenario]);

  const handleYearChange = useCallback((year: number) => {
    setSelectedYear(year);
    startDataTransition(async () => {
      try {
        const data = await getCombinedDataForYear(selectedScenario, year);
        setTemperatureData(data);
      } catch (error) {
        console.error(`Failed to load data for year ${year}:`, error);
        setTemperatureData(undefined);
      }
    });
  }, [selectedScenario]);

  const handleScenarioChange = (scenarioId: string) => {
    setSelectedScenario(scenarioId as Scenario);
  };

  const globalAverageTemp = useMemo(() => {
    if (!temperatureData?.regionTemps) return null;

    const temps = Object.values(temperatureData.regionTemps as Record<string, number>);
    if (temps.length === 0) return null;

    const sum = temps.reduce((acc, temp) => acc + temp, 0);
    return sum / temps.length;
  }, [temperatureData]);
  
  return (
    <div className="relative h-[100svh] w-full overflow-hidden bg-background">
      <div className={`absolute inset-0 z-10 bg-background/50 transition-opacity duration-300 ${isDataLoading ? 'opacity-100' : 'opacity-0'} pointer-events-none`} />
      <MapComponent regionTemperatureData={temperatureData} />

      <header className="absolute top-0 left-0 w-full p-4 md:p-6 z-20 flex justify-end items-start">
        <Card className="w-full max-w-xs bg-card/80 backdrop-blur-sm">
            <CardHeader className="p-4">
                <Label className="text-xs font-normal text-muted-foreground">Shared Socioeconomic Pathways</Label>
                 <Select value={selectedScenario} onValueChange={handleScenarioChange}>
                    <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a scenario" />
                    </SelectTrigger>
                    <SelectContent>
                        {SCENARIOS.map((scenario) => (
                            <SelectItem key={scenario.id} value={scenario.id}>
                                {scenario.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardHeader>
            {globalAverageTemp !== null && (
                <>
                    <Separator />
                    <CardContent className="p-4">
                        <div className="text-xs text-muted-foreground">Global Mean Temperature</div>
                        <div className="text-2xl font-bold text-card-foreground">
                            {globalAverageTemp.toFixed(2)}°C
                        </div>
                    </CardContent>
                </>
            )}
        </Card>
      </header>

      <footer className="absolute bottom-0 left-0 w-full p-4 z-20">
        <Card className="max-w-3xl mx-auto bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4 flex flex-col md:flex-row items-center gap-6">
            {isInitialLoading || !selectedYear || years.length === 0 ? (
              <div className="w-full h-10 flex items-center justify-center text-muted-foreground">
                Loading data...
              </div>
            ) : (
              <>
                <YearSlider
                  years={years}
                  value={selectedYear}
                  onValueChange={handleYearChange}
                  onValueCommit={handleYearChange}
                  isLoading={isDataLoading}
                />
                <TemperatureLegend />
              </>
            )}
          </CardContent>
        </Card>
      </footer>
    </div>
  );
}
