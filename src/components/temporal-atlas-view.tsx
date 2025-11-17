"use client";

import { useState, useEffect, useCallback, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getRegionYears, getRegionDataForYear, RegionYearlyTemperatureData, Scenario } from '@/lib/region-data';

import MapComponent from '@/components/map-component';
import YearSlider from '@/components/year-slider';
import TemperatureLegend from '@/components/temperature-legend';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

const SCENARIOS: { id: Scenario, name: string }[] = [
    { id: 'Historical', name: 'Historical' },
    { id: 'SSP1', name: 'SSP1: Sustainability' },
];

export default function TemporalAtlasView() {
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | undefined>();
  const [selectedScenario, setSelectedScenario] = useState<Scenario>('Historical');
  const [temperatureData, setTemperatureData] = useState<RegionYearlyTemperatureData | undefined>();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isDataLoading, startDataTransition] = useTransition();

  const loadInitialData = async (scenario: Scenario) => {
    setIsInitialLoading(true);
    try {
      const availableYears = await getRegionYears(scenario);
      setYears(availableYears);
      if (availableYears.length > 0) {
        const defaultYear = 2014;
        const initialYear = availableYears.includes(defaultYear)
          ? defaultYear
          : availableYears[Math.floor(availableYears.length / 2)];
        
        setSelectedYear(initialYear);
        const initialData = await getRegionDataForYear(scenario, initialYear);
        setTemperatureData(initialData);
      }
    } catch (error) {
      console.error(`Failed to load initial data for scenario ${scenario}:`, error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Effect for initial data load and scenario changes
  useEffect(() => {
    loadInitialData(selectedScenario);
  }, [selectedScenario]);

  const handleYearChange = useCallback((year: number) => {
    setSelectedYear(year);
    startDataTransition(async () => {
      try {
        const data = await getRegionDataForYear(selectedScenario, year);
        setTemperatureData(data);
      } catch (error) {
        console.error(`Failed to load data for year ${year}:`, error);
      }
    });
  }, [selectedScenario]);

  const handleScenarioChange = (scenarioId: string) => {
    setSelectedScenario(scenarioId as Scenario);
  };
  
  return (
    <div className="relative h-[100svh] w-full overflow-hidden bg-background">
      <div className={`absolute inset-0 z-10 bg-background/50 transition-opacity duration-300 ${isDataLoading ? 'opacity-100' : 'opacity-0'} pointer-events-none`} />
      <MapComponent regionTemperatureData={temperatureData} />

      <header className="absolute top-0 left-0 w-full p-4 md:p-6 z-20 flex justify-between items-start">
        <h1 className="text-3xl md:text-5xl font-headline font-bold text-white [text-shadow:_0_2px_6px_rgb(0_0_0_/_60%)]">
          Temporal Atlas
        </h1>
        <Card className="w-full max-w-xs bg-card/80 backdrop-blur-sm">
            <CardHeader className="p-3">
                <Label className="text-xs font-normal text-muted-foreground">Shared Socioeconomic Pathways</Label>
            </CardHeader>
            <CardContent className="p-3 pt-0">
                <Select value={selectedScenario} onValueChange={handleScenarioChange}>
                    <SelectTrigger>
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
            </CardContent>
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
              <YearSlider
                years={years}
                value={selectedYear}
                onValueChange={handleYearChange}
                onValueCommit={handleYearChange}
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
