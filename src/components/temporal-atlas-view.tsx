
'use client';

import { useState, useEffect, useCallback, useTransition, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { getCombinedYears, getCombinedDataForYear, Scenario, RegionYearlyTemperatureData } from '@/lib/region-data';

import MapComponent from '@/components/map-component';
import YearSlider from '@/components/year-slider';
import TemperatureLegend from '@/components/temperature-legend';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { SCENARIOS } from '@/lib/scenarios';

const PRE_INDUSTRIAL_START_YEAR = 1850;
const PRE_INDUSTRIAL_END_YEAR = 1900;

export const calculateGlobalMean = (data: RegionYearlyTemperatureData | undefined) => {
    if (!data?.regionTemps) return null;
    const temps = Object.values(data.regionTemps as Record<string, number>);
    if (temps.length === 0) return null;
    const sum = temps.reduce((acc, temp) => acc + temp, 0);
    return sum / temps.length;
}

export default function TemporalAtlasView() {
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | undefined>();
  const [selectedScenario, setSelectedScenario] = useState<Scenario>('SSP2');
  const [temperatureData, setTemperatureData] = useState<RegionYearlyTemperatureData | undefined>();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isDataLoading, startDataTransition] = useTransition();
  const [preIndustrialAverage, setPreIndustrialAverage] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const loadInitialData = async (scenario: Scenario) => {
    setIsInitialLoading(true);
    try {
      const availableYears = await getCombinedYears(scenario);
      setYears(availableYears);

      const preIndustrialYears = availableYears.filter(y => y >= PRE_INDUSTRIAL_START_YEAR && y <= PRE_INDUSTRIAL_END_YEAR);
      if (preIndustrialYears.length > 0) {
        if (preIndustrialAverage === null) {
          const preIndustrialData = await Promise.all(
            preIndustrialYears.map(year => getCombinedDataForYear(scenario, year))
          );
          const preIndustrialMeans = preIndustrialData.map(calculateGlobalMean).filter(m => m !== null) as number[];
          if (preIndustrialMeans.length > 0) {
            const totalMean = preIndustrialMeans.reduce((sum, mean) => sum + mean, 0);
            setPreIndustrialAverage(totalMean / preIndustrialMeans.length);
          }
        }
      }

      if (availableYears.length > 0) {
        const defaultYear = 2025;
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
    setIsPlaying(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  useEffect(() => {
    if (!isPlaying || years.length === 0 || !selectedYear) return;

    const interval = setInterval(() => {
      const currentIndex = years.indexOf(selectedYear);
      const nextIndex = (currentIndex + 1) % years.length;
      handleYearChange(years[nextIndex]);
    }, 200);

    return () => clearInterval(interval);
  }, [isPlaying, years, selectedYear, handleYearChange]);

  const handleScenarioChange = (scenarioId: string) => {
    setSelectedScenario(scenarioId as Scenario);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const globalAverageTemp = useMemo(() => calculateGlobalMean(temperatureData), [temperatureData]);
  
  const temperatureAnomaly = useMemo(() => {
    if (globalAverageTemp === null || preIndustrialAverage === null) return null;
    return globalAverageTemp - preIndustrialAverage;
  }, [globalAverageTemp, preIndustrialAverage]);

  const selectedScenarioData = useMemo(() => {
    return SCENARIOS.find(s => s.id === selectedScenario);
  }, [selectedScenario]);
  
  return (
    <div className="relative h-[100svh] w-full overflow-hidden bg-background">
      <div className={`absolute inset-0 z-10 bg-background/50 transition-opacity duration-300 ${isDataLoading ? 'opacity-100' : 'opacity-0'} pointer-events-none`} />
      <MapComponent regionTemperatureData={temperatureData} />

      <header className="absolute top-0 left-0 w-full p-4 md:p-6 z-20 flex justify-end items-start pointer-events-none">
        <div className="w-full max-w-xs flex flex-col gap-2 items-end">
            <Card className="w-full bg-card/80 backdrop-blur-sm pointer-events-auto">
                <CardHeader className="p-4 pb-2">
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
                <CardContent className="p-4 pt-2">
                {selectedScenarioData && (
                    <CardDescription className="text-xs">
                    {selectedScenarioData.description}
                    </CardDescription>
                )}
                </CardContent>
                {(globalAverageTemp !== null || temperatureAnomaly !== null) && (
                    <>
                        <Separator />
                        <CardContent className="p-4 grid grid-cols-2 gap-4">
                            {globalAverageTemp !== null && (
                                <div>
                                    <div className="text-xs text-muted-foreground">Global Mean Temp.</div>
                                    <div className="text-2xl font-bold text-card-foreground">
                                        {globalAverageTemp.toFixed(2)}°C
                                    </div>
                                </div>
                            )}
                            {temperatureAnomaly !== null && (
                                <div>
                                    <div className="text-xs text-muted-foreground">vs. Pre-industrial</div>
                                    <div className={`text-2xl font-bold ${temperatureAnomaly > 0 ? 'text-accent' : 'text-primary'}`}>
                                        {temperatureAnomaly > 0 ? '+' : ''}{temperatureAnomaly.toFixed(2)}°C
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </>
                )}
            </Card>
        </div>
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
                  isPlaying={isPlaying}
                  onTogglePlay={togglePlay}
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
